import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  firebaseInsuranceDocSchema,
  firebaseReportDocSchema,
  FIREBASE_SCHEMA_VERSION,
  checklistDocPath,
  checklistToFirebaseDoc,
  firebaseDocToChecklist,
  firebaseDocToInsurance,
  firebaseUserDocSchema,
  firebaseProfileDocToLocalSlices,
  insuranceDocPath,
  insuranceToFirebaseDoc,
  localSlicesToFirebaseProfileDoc,
  profileDocPath,
  reportDocPath,
  reportToFirebaseDoc,
  userDocPath,
} from "../src/lib/firebase/schema";
import { kimMinjiInsurances, buildKimMinjiSummary } from "./fixtures";

describe("Firebase schema contract", () => {
  it("keeps stable user-owned Firestore paths", () => {
    expect(userDocPath("uid-1")).toBe("users/uid-1");
    expect(profileDocPath("uid-1")).toBe("users/uid-1/profile/current");
    expect(insuranceDocPath("uid-1", "insurance-1")).toBe(
      "users/uid-1/insurances/insurance-1",
    );
    expect(reportDocPath("uid-1", "report-1")).toBe(
      "users/uid-1/reportRuns/report-1",
    );
    expect(checklistDocPath("uid-1")).toBe("users/uid-1/checklists/current");
  });

  it("wraps existing localStorage profile slices without changing field shape", () => {
    const basic = {
      name: "Kim",
      age: "27",
      gender: "female",
      jobGroup: "office",
      monthlyIncomeMan: "250",
      monthlyExpenseMan: "140",
      emergencyFundMan: "300",
      hasDependents: false,
      housingType: "",
    };
    const health = {
      heightCm: "163",
      weightKg: "55",
      checkupIssue: false,
      currentDisease: false,
      hospitalVisits: "visits_1_2",
      smoking: "no",
      drinking: "weekly_1_2",
      exercise: "weekly_1_or_less",
      sleep: "hours_6_7",
      stress: "high",
      overtime: "weekly_1_2",
    };
    const doc = localSlicesToFirebaseProfileDoc({
      basic,
      health,
      familyHistory: ["cancer", "hypertension"],
    });

    expect(doc).toMatchObject({
      schemaVersion: FIREBASE_SCHEMA_VERSION,
      basic,
      health,
      familyHistory: ["cancer", "hypertension"],
    });
    expect(firebaseProfileDocToLocalSlices(doc)).toEqual({
      basic,
      health,
      familyHistory: ["cancer", "hypertension"],
    });
  });

  it("round-trips insurance rows with schema metadata stripped on read", () => {
    const firebaseDoc = insuranceToFirebaseDoc(kimMinjiInsurances[0]);

    expect(firebaseDoc.schemaVersion).toBe(FIREBASE_SCHEMA_VERSION);
    expect(firebaseDocToInsurance(firebaseDoc)).toEqual(kimMinjiInsurances[0]);
  });

  it("rejects Firestore-unsafe insurance ids and negative money values", () => {
    const firebaseDoc = insuranceToFirebaseDoc(kimMinjiInsurances[0]);

    expect(() =>
      firebaseInsuranceDocSchema.parse({
        ...firebaseDoc,
        id: "bad/id",
      }),
    ).toThrow();
    expect(() =>
      firebaseInsuranceDocSchema.parse({
        ...firebaseDoc,
        coverageAmount: -1,
      }),
    ).toThrow();
    expect(() =>
      firebaseInsuranceDocSchema.parse({
        ...firebaseDoc,
        monthlyPremium: -1,
      }),
    ).toThrow();
  });

  it("validates report and checklist document shapes", () => {
    const reportDoc = reportToFirebaseDoc(buildKimMinjiSummary(), {
      source: "template",
      text: "report body",
    });
    const checklistDoc = checklistToFirebaseDoc({
      "weak.cancer_diagnosis": true,
      "caution.actual_medical": false,
    });

    expect(reportDoc.schemaVersion).toBe(FIREBASE_SCHEMA_VERSION);
    expect(reportDoc.report.source).toBe("template");
    expect(checklistDoc.checkedIds).toEqual(["weak.cancer_diagnosis"]);
    expect(firebaseDocToChecklist(checklistDoc)).toEqual({
      "weak.cancer_diagnosis": true,
    });
  });

  it("rejects invalid generated report payloads before Firestore writes", () => {
    const reportDoc = reportToFirebaseDoc(buildKimMinjiSummary(), {
      source: "template",
      text: "report body",
    });

    expect(() =>
      firebaseReportDocSchema.parse({
        ...reportDoc,
        report: { source: "manual", text: "report body" },
      }),
    ).toThrow();
    expect(() =>
      firebaseReportDocSchema.parse({
        ...reportDoc,
        report: { source: "template", text: "" },
      }),
    ).toThrow();
  });

  it("uses Google auth as the only MVP user doc auth type", () => {
    expect(
      firebaseUserDocSchema.parse({
        schemaVersion: FIREBASE_SCHEMA_VERSION,
        authType: "google",
        consent: {
          accepted: true,
          version: "mvp-privacy-v1",
        },
      }).authType,
    ).toBe("google");

    expect(() =>
      firebaseUserDocSchema.parse({
        schemaVersion: FIREBASE_SCHEMA_VERSION,
        authType: "anonymous",
        consent: {
          accepted: true,
          version: "mvp-privacy-v1",
        },
      }),
    ).toThrow();
  });

  it("keeps Firestore rules aligned with consent, report, and money guards", () => {
    const rules = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");

    expect(rules).toContain("function validConsentMap()");
    expect(rules).toContain("request.resource.data.consent.keys().hasOnly");
    expect(rules).toContain("function validGeneratedReport()");
    expect(rules).toContain("request.resource.data.report.text.size() <= 3000");
    expect(rules).toContain("optionalNonNegativeNullableNumber('coverageAmount')");
    expect(rules).toContain("optionalNonNegativeNumber('monthlyPremium')");
  });
});
