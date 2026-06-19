import { z } from "zod";

import type {
  AmountUnit,
  ChronicCondition,
  CoverageTypeId,
  DietHabit,
  DrinkingFrequency,
  ExerciseFrequency,
  FamilyHistoryCondition,
  Gender,
  GeneratedReport,
  HospitalVisits,
  Insurance,
  JobGroupId,
  OvertimeFrequency,
  ReportSummary,
  SleepDuration,
  SmokingStatus,
  StressLevel,
  VitalBand,
} from "../../types";
import { reportSummarySchema } from "../report/schema";

export const FIREBASE_SCHEMA_VERSION = 1;

export const FIREBASE_COLLECTIONS = {
  users: "users",
  profile: "profile",
  insurances: "insurances",
  reportRuns: "reportRuns",
  checklists: "checklists",
} as const;

export const FIREBASE_DOC_IDS = {
  current: "current",
} as const;

export function userDocPath(uid: string): string {
  return `${FIREBASE_COLLECTIONS.users}/${uid}`;
}

export function profileDocPath(uid: string): string {
  return `${userDocPath(uid)}/${FIREBASE_COLLECTIONS.profile}/${FIREBASE_DOC_IDS.current}`;
}

export function insurancesCollectionPath(uid: string): string {
  return `${userDocPath(uid)}/${FIREBASE_COLLECTIONS.insurances}`;
}

export function insuranceDocPath(uid: string, insuranceId: string): string {
  return `${insurancesCollectionPath(uid)}/${insuranceId}`;
}

export function reportsCollectionPath(uid: string): string {
  return `${userDocPath(uid)}/${FIREBASE_COLLECTIONS.reportRuns}`;
}

export function reportDocPath(uid: string, reportId: string): string {
  return `${reportsCollectionPath(uid)}/${reportId}`;
}

export function checklistDocPath(uid: string): string {
  return `${userDocPath(uid)}/${FIREBASE_COLLECTIONS.checklists}/${FIREBASE_DOC_IDS.current}`;
}

const nullableStringSchema = z.string().nullable().optional();
const nullableBooleanSchema = z.boolean().nullable().optional();
const numericFormValueSchema = z.union([z.string(), z.number()]).optional();
const nullableNonNegativeNumberSchema = z
  .number()
  .nonnegative()
  .nullable()
  .optional();
const firestoreDocumentIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[^/]+$/, "Firestore document IDs cannot contain '/'.");

export const genderSchema = z.enum(["female", "male", "other"]);
export const jobGroupSchema = z.enum([
  "student",
  "office",
  "service",
  "driving",
  "field",
]);
export const hospitalVisitsSchema = z.enum([
  "visits_1_2",
  "visits_3_5",
  "visits_6_plus",
]);
export const familyHistoryConditionSchema = z.enum([
  "cancer",
  "hypertension",
  "diabetes",
  "cardio",
  "cerebrovascular",
  "dementia",
  "none",
  "unknown",
]);
export const smokingStatusSchema = z.enum(["no", "yes"]);
export const drinkingFrequencySchema = z.enum([
  "rare",
  "weekly_1_2",
  "weekly_3_plus",
]);
export const exerciseFrequencySchema = z.enum([
  "weekly_3_plus",
  "weekly_2",
  "weekly_1_or_less",
  "rare",
]);
export const sleepDurationSchema = z.enum([
  "hours_7_plus",
  "hours_6_7",
  "under_6",
]);
export const stressLevelSchema = z.enum(["normal", "high"]);
export const overtimeFrequencySchema = z.enum([
  "rare",
  "weekly_1_2",
  "weekly_3_plus",
]);
export const chronicConditionSchema = z.enum([
  "hypertension",
  "diabetes",
  "hyperlipidemia",
  "heart",
  "thyroid",
  "other",
  "none",
]);
export const vitalBandSchema = z.enum(["normal", "caution", "high"]);
export const dietHabitSchema = z.enum([
  "balanced",
  "irregular",
  "high_sodium",
  "high_fat",
]);
export const coverageTypeIdSchema = z.enum([
  "actual_medical",
  "cancer_diagnosis",
  "cerebrovascular_diagnosis",
  "cardiac_diagnosis",
  "disease_hospitalization",
  "accident_hospitalization",
  "surgery",
  "income_interruption",
  "death",
  "liability",
  "other",
]);
export const amountUnitSchema = z.enum([
  "presence",
  "krw",
  "krw_per_event",
  "krw_per_day",
  "krw_per_month",
]);

export const profileBasicSliceSchema = z
  .object({
    name: z.string().optional(),
    age: numericFormValueSchema,
    gender: genderSchema.nullable().optional(),
    jobGroup: jobGroupSchema.nullable().optional(),
    monthlyIncomeMan: numericFormValueSchema,
    monthlyExpenseMan: numericFormValueSchema,
    emergencyFundMan: numericFormValueSchema,
    hasDependents: nullableBooleanSchema,
    housingType: z.string().optional(),
  })
  .passthrough();

export const profileHealthSliceSchema = z
  .object({
    heightCm: numericFormValueSchema,
    weightKg: numericFormValueSchema,
    checkupIssue: nullableBooleanSchema,
    currentDisease: nullableBooleanSchema,
    hospitalVisits: hospitalVisitsSchema.nullable().optional(),
    smoking: smokingStatusSchema.nullable().optional(),
    drinking: drinkingFrequencySchema.nullable().optional(),
    exercise: exerciseFrequencySchema.nullable().optional(),
    sleep: sleepDurationSchema.nullable().optional(),
    stress: stressLevelSchema.nullable().optional(),
    overtime: overtimeFrequencySchema.nullable().optional(),
    // Health/lifestyle fields. The health map stays a single Firestore slice
    // (rules validate it as `is map`), so adding typed fields here needs NO
    // rule change and NO schema-version bump — `.passthrough()` already let
    // them round-trip; this just makes them validated + typed.
    chronicConditions: z.array(chronicConditionSchema).optional(),
    bloodPressure: vitalBandSchema.nullable().optional(),
    bloodSugar: vitalBandSchema.nullable().optional(),
    cholesterol: vitalBandSchema.nullable().optional(),
    dietHabit: dietHabitSchema.nullable().optional(),
  })
  .passthrough();

export const firebaseProfileDocSchema = z
  .object({
    schemaVersion: z.literal(FIREBASE_SCHEMA_VERSION),
    status: z.enum(["draft", "complete"]).optional(),
    basic: profileBasicSliceSchema,
    health: profileHealthSliceSchema,
    familyHistory: z.array(familyHistoryConditionSchema),
    completedSteps: z.array(z.string()).optional(),
    createdAt: z.unknown().optional(),
    updatedAt: z.unknown().optional(),
  })
  .strict();

export const firebaseConsentSchema = z
  .object({
    accepted: z.boolean(),
    version: z.string(),
    acceptedAt: z.unknown().optional(),
    updatedAt: z.unknown().optional(),
  })
  .strict();

export const firebaseUserDocSchema = z
  .object({
    schemaVersion: z.literal(FIREBASE_SCHEMA_VERSION),
    authType: z.literal("google"),
    consent: firebaseConsentSchema,
    createdAt: z.unknown().optional(),
    updatedAt: z.unknown().optional(),
    lastActiveAt: z.unknown().optional(),
  })
  .strict();

export const firebaseInsuranceDocSchema = z
  .object({
    schemaVersion: z.literal(FIREBASE_SCHEMA_VERSION),
    id: firestoreDocumentIdSchema,
    company: z.string().optional(),
    productName: z.string().optional(),
    coverageType: coverageTypeIdSchema,
    coverageAmount: nullableNonNegativeNumberSchema,
    amountUnit: amountUnitSchema,
    monthlyPremium: z.number().nonnegative().optional(),
    joinedAt: nullableStringSchema,
    source: z.literal("manual").optional(),
    createdAt: z.unknown().optional(),
    updatedAt: z.unknown().optional(),
  })
  .strict();

export const firebaseGeneratedReportSchema = z
  .object({
    source: z.enum(["codex", "template"]),
    text: z.string().min(1).max(3000),
    errorReason: z.string().optional(),
  })
  .strict();

export const firebaseReportDocSchema = z
  .object({
    schemaVersion: z.literal(FIREBASE_SCHEMA_VERSION),
    summary: reportSummarySchema,
    report: firebaseGeneratedReportSchema,
    createdAt: z.unknown().optional(),
  })
  .strict();

export const firebaseChecklistDocSchema = z
  .object({
    schemaVersion: z.literal(FIREBASE_SCHEMA_VERSION),
    checkedIds: z.array(z.string()),
    updatedAt: z.unknown().optional(),
  })
  .strict();

export type ProfileBasicSlice = z.infer<typeof profileBasicSliceSchema> & {
  gender?: Gender | null;
  jobGroup?: JobGroupId | null;
};

export type ProfileHealthSlice = z.infer<typeof profileHealthSliceSchema> & {
  hospitalVisits?: HospitalVisits | null;
  smoking?: SmokingStatus | null;
  drinking?: DrinkingFrequency | null;
  exercise?: ExerciseFrequency | null;
  sleep?: SleepDuration | null;
  stress?: StressLevel | null;
  overtime?: OvertimeFrequency | null;
  chronicConditions?: ChronicCondition[];
  bloodPressure?: VitalBand | null;
  bloodSugar?: VitalBand | null;
  cholesterol?: VitalBand | null;
  dietHabit?: DietHabit | null;
};

export type FirebaseProfileDoc = z.infer<typeof firebaseProfileDocSchema> & {
  familyHistory: FamilyHistoryCondition[];
};
export type FirebaseUserDoc = z.infer<typeof firebaseUserDocSchema>;
export type FirebaseInsuranceDoc = z.infer<typeof firebaseInsuranceDocSchema> & {
  coverageType: CoverageTypeId;
  amountUnit: AmountUnit;
};
export interface FirebaseReportDoc {
  schemaVersion: typeof FIREBASE_SCHEMA_VERSION;
  summary: ReportSummary;
  report: GeneratedReport;
  createdAt?: unknown;
}
export type FirebaseChecklistDoc = z.infer<typeof firebaseChecklistDocSchema>;

export interface LocalProfileSlices {
  basic: Record<string, unknown>;
  health: Record<string, unknown>;
  familyHistory: unknown;
}

export interface LocalProfileSlicesForStorage {
  basic: ProfileBasicSlice;
  health: ProfileHealthSlice;
  familyHistory: FamilyHistoryCondition[];
}

export function localSlicesToFirebaseProfileDoc(
  slices: LocalProfileSlices,
): FirebaseProfileDoc {
  const familyHistory = Array.isArray(slices.familyHistory)
    ? slices.familyHistory
    : [];

  return firebaseProfileDocSchema.parse({
    schemaVersion: FIREBASE_SCHEMA_VERSION,
    basic: slices.basic,
    health: slices.health,
    familyHistory,
  });
}

export function firebaseProfileDocToLocalSlices(
  doc: unknown,
): LocalProfileSlicesForStorage {
  const parsed = firebaseProfileDocSchema.parse(doc);
  return {
    basic: parsed.basic,
    health: parsed.health,
    familyHistory: parsed.familyHistory,
  };
}

export function insuranceToFirebaseDoc(
  insurance: Insurance,
): FirebaseInsuranceDoc {
  return firebaseInsuranceDocSchema.parse({
    schemaVersion: FIREBASE_SCHEMA_VERSION,
    source: "manual",
    ...insurance,
  });
}

export function firebaseDocToInsurance(doc: unknown): Insurance {
  const parsed = firebaseInsuranceDocSchema.parse(doc);
  return {
    id: parsed.id,
    company: parsed.company,
    productName: parsed.productName,
    coverageType: parsed.coverageType,
    coverageAmount: parsed.coverageAmount,
    amountUnit: parsed.amountUnit,
    monthlyPremium: parsed.monthlyPremium,
    joinedAt: parsed.joinedAt ?? undefined,
  };
}

export function reportToFirebaseDoc(
  summary: ReportSummary,
  report: GeneratedReport,
): FirebaseReportDoc {
  const doc: FirebaseReportDoc = {
    schemaVersion: FIREBASE_SCHEMA_VERSION,
    summary,
    report,
  };
  firebaseReportDocSchema.parse(doc);
  return doc;
}

export function checklistToFirebaseDoc(
  checked: Record<string, boolean>,
): FirebaseChecklistDoc {
  return firebaseChecklistDocSchema.parse({
    schemaVersion: FIREBASE_SCHEMA_VERSION,
    checkedIds: Object.entries(checked)
      .filter(([, isChecked]) => isChecked)
      .map(([id]) => id),
  });
}

export function firebaseDocToChecklist(doc: unknown): Record<string, boolean> {
  const parsed = firebaseChecklistDocSchema.parse(doc);
  return Object.fromEntries(parsed.checkedIds.map((id) => [id, true]));
}
