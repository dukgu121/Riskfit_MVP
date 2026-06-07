import { describe, expect, it } from 'vitest'
import { calculateCompleteness } from '../src/lib/completeness'
import coverageTypesData from '../src/data/coverageTypes.json'
import standardCoveragesData from '../src/data/standardCoverages.json'
import { COVERAGE_SCORING_ORDER } from '../src/lib/calc/coverageFit'
import {
  calculateBmi,
  coverageFit,
  financialRisk,
  hasCoverage,
  healthRisk,
  lifestyleRisk,
  outOfPocket,
  riskBand,
  scoreBmi,
  selectUserType,
  totalRiskScore,
} from '../src/lib/calc'
import type {
  CoverageType,
  Insurance,
  StandardCoverage,
  UserProfile,
  UserTypeId,
} from '../src/types'
import { kimMinjiInsurances, kimMinjiProfile } from './fixtures'

describe('RiskFit calculation core', () => {
  it('reproduces the Kim Minji golden case', () => {
    const score = totalRiskScore(kimMinjiProfile, kimMinjiInsurances)
    const fit = coverageFit(kimMinjiInsurances, kimMinjiProfile)
    const oop = outOfPocket(kimMinjiProfile, kimMinjiInsurances)

    expect(score).toMatchObject({
      health: 35,
      lifestyle: 40,
      job: 30,
      finance: 40,
      total: 36,
      band: 'low',
      bandLabel: '낮음',
    })
    // Data-driven scoring now covers all required types for this user
    // (실손·암·뇌혈관·심장·질병입원·상해입원·수술·소득중단·배상책임). The new
    // 뇌·심장·수술·배상 lines are unheld → 0, dragging overall from 55 to 31.
    expect(fit.overall).toBe(31)
    expect(fit.band).toBe('insufficient')
    expect(fit.items.map((item) => item.fit)).toEqual([
      100, 75, 0, 0, 0, 100, 0, 0, 0,
    ])
    expect(fit.weakCoverages).toEqual([
      '뇌혈관 진단비',
      '심장질환 진단비',
      '질병 입원비',
      '수술비',
      '소득중단 보장',
      '배상책임',
    ])
    expect(fit.cautionCoverages).toEqual(['암 진단비'])
    expect(oop.total).toBe(2_683_333)
    expect(oop.displayAmount).toBe(2_700_000)
    expect(oop.displayText).toBe('약 270만 원')
  })

  it('scores BMI and risk band boundaries', () => {
    expect(scoreBmi(22.99)).toBe(10)
    expect(scoreBmi(23)).toBe(25)
    expect(scoreBmi(24.9)).toBe(25)
    expect(scoreBmi(25)).toBe(40)
    expect(calculateBmi(163, 55)).toBeCloseTo(20.7, 1)

    expect(riskBand(39).id).toBe('low')
    expect(riskBand(40).id).toBe('medium')
    expect(riskBand(69).id).toBe('medium')
    expect(riskBand(70).id).toBe('high')
  })

  it('scores health and lifestyle inputs independently', () => {
    expect(healthRisk(kimMinjiProfile)).toBe(35)
    expect(
      healthRisk({
        ...kimMinjiProfile,
        weightKg: 70,
        checkupIssue: true,
        currentDisease: true,
        hospitalVisits: 'visits_6_plus',
        familyHistory: ['cancer', 'diabetes', 'hypertension'],
      }),
    ).toBe(100)
    expect(lifestyleRisk(kimMinjiProfile)).toBe(40)
  })

  it('keeps known family history when sentinel values are mixed in', () => {
    expect(
      healthRisk({
        ...kimMinjiProfile,
        checkupIssue: false,
        currentDisease: false,
        hospitalVisits: 'visits_1_2',
        familyHistory: ['none', 'cancer'] as UserProfile['familyHistory'],
      }),
    ).toBe(25)
    expect(
      healthRisk({
        ...kimMinjiProfile,
        checkupIssue: false,
        currentDisease: false,
        hospitalVisits: 'visits_1_2',
        familyHistory: ['unknown', 'diabetes'] as UserProfile['familyHistory'],
      }),
    ).toBe(25)
  })

  it('scores financial boundary conditions', () => {
    const base = {
      ...kimMinjiProfile,
      monthlyIncome: 1_000_000,
      monthlyExpense: 500_000,
      emergencyFund: 500_000,
      hasDependents: false,
    }
    const noPremiums: Insurance[] = []
    const highPremiums: Insurance[] = [
      {
        id: 'premium',
        coverageType: 'other',
        coverageAmount: 0,
        amountUnit: 'krw',
        monthlyPremium: 50_000,
      },
    ]

    expect(financialRisk(base, noPremiums)).toBe(40)
    expect(financialRisk({ ...base, emergencyFund: 1_500_000 }, noPremiums)).toBe(20)
    expect(financialRisk({ ...base, emergencyFund: 1_499_999 }, noPremiums)).toBe(40)
    expect(financialRisk({ ...base, monthlyExpense: 700_000 }, noPremiums)).toBe(70)
    expect(financialRisk(base, highPremiums)).toBe(45)
  })

  it('aggregates duplicate coverage rows and caps fit at 100', () => {
    const insurances: Insurance[] = [
      {
        id: 'cancer-a',
        coverageType: 'cancer_diagnosis',
        coverageAmount: 20_000_000,
        amountUnit: 'krw_per_event',
      },
      {
        id: 'cancer-b',
        coverageType: 'cancer_diagnosis',
        coverageAmount: 10_000_000,
        amountUnit: 'krw_per_event',
      },
      {
        id: 'disease-a',
        coverageType: 'disease_hospitalization',
        coverageAmount: 30_000,
        amountUnit: 'krw_per_day',
      },
      {
        id: 'disease-b',
        coverageType: 'disease_hospitalization',
        coverageAmount: 30_000,
        amountUnit: 'krw_per_day',
      },
      {
        id: 'surgery',
        coverageType: 'surgery',
        coverageAmount: 9_999_999,
        amountUnit: 'krw_per_event',
      },
    ]

    const fit = coverageFit(insurances, kimMinjiProfile)
    expect(fit.items.find((item) => item.type === 'cancer_diagnosis')?.current).toBe(
      30_000_000,
    )
    expect(
      fit.items.find((item) => item.type === 'disease_hospitalization')?.fit,
    ).toBe(100)
    // 수술비 is now scored (presence type, required for all user types); a held
    // surgery row reads as covered → fit 100.
    expect(fit.items.find((item) => item.type === 'surgery')?.fit).toBe(100)
  })

  it('treats malformed presence coverage amounts as absent', () => {
    const insurances: Insurance[] = [
      {
        id: 'actual-negative',
        coverageType: 'actual_medical',
        coverageAmount: -1,
        amountUnit: 'presence',
      },
      {
        id: 'actual-nan',
        coverageType: 'actual_medical',
        coverageAmount: Number.NaN,
        amountUnit: 'presence',
      },
    ]

    const fit = coverageFit(insurances, kimMinjiProfile)
    const actualMedical = fit.items.find(
      (item) => item.type === 'actual_medical',
    )
    const oop = outOfPocket(kimMinjiProfile, insurances)

    expect(hasCoverage(insurances, 'actual_medical')).toBe(false)
    expect(actualMedical).toMatchObject({
      current: false,
      fit: 0,
      band: 'insufficient',
    })
    expect(oop.actualMedicalPayout).toBe(0)
  })

  it('labels coverage fit boundaries', () => {
    const base = { ...kimMinjiProfile, age: 35, hasDependents: false }
    const fit49 = coverageFit(
      [
        {
          id: 'income-49',
          coverageType: 'income_interruption',
          coverageAmount: 980_000,
          amountUnit: 'krw_per_month',
        },
      ],
      base,
    )
    const fit80 = coverageFit(
      [
        {
          id: 'income-80',
          coverageType: 'income_interruption',
          coverageAmount: 1_600_000,
          amountUnit: 'krw_per_month',
        },
      ],
      base,
    )

    expect(
      fit49.items.find((item) => item.type === 'income_interruption')?.band,
    ).toBe('insufficient')
    expect(
      fit80.items.find((item) => item.type === 'income_interruption')?.band,
    ).toBe('sufficient')
  })

  it('selects MVP user types deterministically', () => {
    expect(selectUserType({ age: 27, hasDependents: false })).toBe(
      'twenties_new_worker',
    )
    expect(selectUserType({ age: 30, hasDependents: false })).toBe(
      'thirties_worker',
    )
    expect(selectUserType({ age: 24, hasDependents: true })).toBe(
      'has_dependents',
    )
  })

  it('keeps out-of-pocket non-negative when insurance payout is high', () => {
    const result = outOfPocket(kimMinjiProfile, [
      {
        id: 'actual',
        coverageType: 'actual_medical',
        coverageAmount: null,
        amountUnit: 'presence',
      },
      {
        id: 'daily',
        coverageType: 'disease_hospitalization',
        coverageAmount: 1_000_000,
        amountUnit: 'krw_per_day',
      },
    ])

    expect(result.total).toBe(0)
  })

  it('calculates progressive completeness and counts false/zero as valid', () => {
    const complete = calculateCompleteness(kimMinjiProfile, kimMinjiInsurances)
    const minimal = calculateCompleteness(
      {
        age: 27,
        gender: 'female',
        jobGroup: 'office',
        monthlyIncome: 0,
        hasDependents: false,
        checkupIssue: false,
      },
      [],
    )

    expect(complete.percent).toBe(100)
    expect(minimal.missingFields).toContain('월 소득')
    expect(minimal.missingFields).not.toContain('부양가족 여부')
    expect(minimal.missingFields).not.toContain('건강검진 이상 여부')
    expect(minimal.imputedFields.length).toBeGreaterThan(0)
  })

  it('keeps coverage standard data aligned with scoring rules', () => {
    const coverageTypes = coverageTypesData as CoverageType[]
    const standardCoverages = standardCoveragesData as StandardCoverage[]
    const coverageTypeIds = new Set(coverageTypes.map((item) => item.id))
    const userTypes: UserTypeId[] = [
      'twenties_new_worker',
      'thirties_worker',
      'has_dependents',
    ]
    const seen = new Set<string>()

    for (const standard of standardCoverages) {
      const key = `${standard.userType}/${standard.coverageType}`
      expect(seen.has(key)).toBe(false)
      seen.add(key)
      expect(coverageTypeIds.has(standard.coverageType)).toBe(true)
      expect(userTypes).toContain(standard.userType)

      if (standard.required) {
        expect(COVERAGE_SCORING_ORDER).toContain(standard.coverageType)
      }

      if (standard.fitMode === 'presence') {
        expect(standard.standardAmount).toBeNull()
        expect(standard.unit).toBe('presence')
      } else {
        expect(standard.standardAmount).toEqual(expect.any(Number))
        expect(standard.standardAmount).toBeGreaterThan(0)
        expect(standard.unit).not.toBe('presence')
      }
    }

    for (const userType of userTypes) {
      const requiredCount = standardCoverages.filter(
        (item) => item.userType === userType && item.required,
      ).length
      expect(requiredCount).toBe(userType === 'has_dependents' ? 10 : 9)
    }
  })
})
