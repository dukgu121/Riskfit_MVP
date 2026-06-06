import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";

import type { GeneratedReport, Insurance, ReportSummary } from "../../types";
import { getFirebase } from "./app";
import {
  FIREBASE_DOC_IDS,
  FIREBASE_SCHEMA_VERSION,
  checklistDocPath,
  checklistToFirebaseDoc,
  firebaseDocToChecklist,
  firebaseDocToInsurance,
  firebaseProfileDocToLocalSlices,
  firebaseUserDocSchema,
  insuranceDocPath,
  insuranceToFirebaseDoc,
  insurancesCollectionPath,
  localSlicesToFirebaseProfileDoc,
  profileDocPath,
  reportDocPath,
  reportToFirebaseDoc,
  userDocPath,
  type LocalProfileSlices,
  type LocalProfileSlicesForStorage,
} from "./schema";

export async function saveUserConsent(
  uid: string,
  accepted: boolean,
  authType: "google" = "google",
): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;

  const docData = firebaseUserDocSchema.parse({
    schemaVersion: FIREBASE_SCHEMA_VERSION,
    authType,
    consent: {
      accepted,
      version: "mvp-privacy-v1",
      acceptedAt: accepted ? serverTimestamp() : undefined,
      updatedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  });

  await setDoc(doc(fb.db, userDocPath(uid)), stripUndefined(docData), {
    merge: true,
  });
}

export async function loadUserConsent(uid: string): Promise<boolean | null> {
  const fb = getFirebase();
  if (!fb) return null;

  const snap = await getDoc(doc(fb.db, userDocPath(uid)));
  if (!snap.exists()) return null;
  const parsed = firebaseUserDocSchema.safeParse(snap.data());
  if (!parsed.success) return null;
  return parsed.data.consent.accepted;
}

export async function saveProfile(
  uid: string,
  slices: LocalProfileSlices,
): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;

  const docData = localSlicesToFirebaseProfileDoc(slices);
  await setDoc(
    doc(fb.db, profileDocPath(uid)),
    stripUndefined({
      ...docData,
      updatedAt: serverTimestamp(),
    }),
    { merge: true },
  );
}

export async function loadProfile(
  uid: string,
): Promise<LocalProfileSlicesForStorage | null> {
  const fb = getFirebase();
  if (!fb) return null;

  const snap = await getDoc(doc(fb.db, profileDocPath(uid)));
  if (!snap.exists()) return null;
  return firebaseProfileDocToLocalSlices(snap.data());
}

export async function saveInsurances(
  uid: string,
  insurances: Insurance[],
): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;

  const colRef = collection(fb.db, insurancesCollectionPath(uid));
  const existing = await getDocs(colRef);
  const nextIds = new Set(insurances.map((insurance) => insurance.id));
  const batch = writeBatch(fb.db);

  for (const insurance of insurances) {
    batch.set(
      doc(fb.db, insuranceDocPath(uid, insurance.id)),
      stripUndefined({
        ...insuranceToFirebaseDoc(insurance),
        updatedAt: serverTimestamp(),
      }),
      { merge: true },
    );
  }

  for (const existingDoc of existing.docs) {
    if (!nextIds.has(existingDoc.id)) {
      batch.delete(existingDoc.ref);
    }
  }

  await batch.commit();
}

export async function loadInsurances(uid: string): Promise<Insurance[]> {
  const fb = getFirebase();
  if (!fb) return [];

  const snap = await getDocs(collection(fb.db, insurancesCollectionPath(uid)));
  return snap.docs.map((item) => firebaseDocToInsurance(item.data()));
}

export async function saveChecklist(
  uid: string,
  checked: Record<string, boolean>,
): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;

  await setDoc(
    doc(fb.db, checklistDocPath(uid)),
    stripUndefined({
      ...checklistToFirebaseDoc(checked),
      updatedAt: serverTimestamp(),
    }),
  );
}

export async function loadChecklist(
  uid: string,
): Promise<Record<string, boolean> | null> {
  const fb = getFirebase();
  if (!fb) return null;

  const snap = await getDoc(doc(fb.db, checklistDocPath(uid)));
  if (!snap.exists()) return null;
  return firebaseDocToChecklist(snap.data());
}

export async function saveReport(
  uid: string,
  summary: ReportSummary,
  report: GeneratedReport,
): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;

  await setDoc(
    doc(fb.db, reportDocPath(uid, FIREBASE_DOC_IDS.current)),
    stripUndefined({
      ...reportToFirebaseDoc(summary, report),
      createdAt: serverTimestamp(),
    }),
  );
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripUndefined) as T;
  }
  if (!isPlainObject(value)) {
    return value;
  }

  const record = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(record)) {
    if (item === undefined) continue;
    next[key] = stripUndefined(item);
  }
  return next as T;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
