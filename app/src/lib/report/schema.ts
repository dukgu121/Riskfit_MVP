import { z } from 'zod'

const bandSchema = z.object({
  id: z.string(),
  min: z.number(),
  max: z.number(),
  label: z.string(),
})

export const reportSummarySchema = z
  .object({
    profileSummary: z
      .object({
        name: z.string().max(50).optional(),
        age: z.number().min(0).max(120).optional(),
        jobGroup: z.string().max(50).optional(),
        userType: z.string().max(50).optional(),
      })
      .strict(),
    riskScore: z
      .object({
        total: z.number().min(0).max(100),
        health: z.number().min(0).max(100),
        lifestyle: z.number().min(0).max(100),
        job: z.number().min(0).max(100),
        finance: z.number().min(0).max(100),
        band: z.enum(['low', 'medium', 'high']),
        bandLabel: z.string().max(20),
      })
      .strict(),
    coverageFit: z
      .object({
        userType: z.string().max(50),
        items: z
          .array(
            z
              .object({
                type: z.string().max(50),
                label: z.string().max(50),
                current: z.union([z.number().min(0).max(10_000_000_000), z.boolean()]),
                standard: z.union([
                  z.number().min(0).max(10_000_000_000),
                  z.boolean(),
                  z.null(),
                ]),
                unit: z.string().max(50),
                fit: z.number().min(0).max(100),
                band: z.enum(['insufficient', 'caution', 'sufficient', 'excessive']),
                bandLabel: z.string().max(20),
              })
              .strict(),
          )
          .max(10),
        overall: z.number().min(0).max(100),
        band: z.enum(['insufficient', 'caution', 'sufficient', 'excessive']),
        bandLabel: z.string().max(20),
        sufficientCoverages: z.array(z.string().max(50)).max(12),
        cautionCoverages: z.array(z.string().max(50)).max(12),
        weakCoverages: z.array(z.string().max(50)).max(12),
        excessiveCoverages: z.array(z.string().max(50)).max(12),
      })
      .strict(),
    weakCoverages: z.array(z.string().max(50)).max(10),
    cautionCoverages: z.array(z.string().max(50)).max(10),
    expectedOutOfPocket: z.number().min(0).max(1_000_000_000),
    expectedOutOfPocketText: z.string().max(50),
    completeness: z.number().min(0).max(100),
    // Report-AI edge fields. MUST mirror types/index.ts:ReportSummary.
    topRiskFactors: z
      .array(
        z
          .object({
            label: z.string().max(50),
            delta: z.number().min(0).max(100),
            area: z.string().max(30),
            detail: z.string().max(80).optional(),
          })
          .strict(),
      )
      .max(5),
    improvement: z
      .object({
        top: z
          .array(
            z
              .object({
                label: z.string().max(50),
                currentFit: z.number().min(0).max(100),
              })
              .strict(),
          )
          .max(3),
        currentOverallFit: z.number().min(0).max(100),
        projectedOverallFit: z.number().min(0).max(100),
      })
      .strict(),
  })
  .strict()

export const codexReportResponseSchema = z
  .object({
    source: z.literal('codex').optional(),
    text: z.string().min(1).max(3000),
  })
  .passthrough()

/* ------------------------------------------------------------------ */
/*  AI content bundle (all post-/analyzing screens, one generation)    */
/* ------------------------------------------------------------------ */

/**
 * Per-screen blurbs are short Toss-tone one-liners; the report is the same
 * 200~350자 줄글 as `/api/report`. Generous caps so a slightly long-but-valid
 * field isn't rejected (length is the only structural guard — number grounding
 * is enforced client-side per field by `isReportGrounded`). All fields optional:
 * the client falls back to the deterministic template for any missing/ungrounded
 * one, so a partial generation still yields a complete package.
 */
const contentBlurbSchema = z.string().min(1).max(400)

export const aiContentAreasSchema = z
  .object({
    lifestyle: contentBlurbSchema.optional(),
    health: contentBlurbSchema.optional(),
    family: contentBlurbSchema.optional(),
    job: contentBlurbSchema.optional(),
    financial: contentBlurbSchema.optional(),
  })
  .partial()

/**
 * Wire shape of `POST /api/content` → `{ fields: {...} }`. The sidecar
 * label-parses codex output into these named fields; the client re-grounds each
 * one. `.passthrough()` mirrors `codexReportResponseSchema` so future additive
 * fields don't break older clients.
 */
export const aiContentResponseSchema = z
  .object({
    fields: z
      .object({
        resultSummary: contentBlurbSchema.optional(),
        riskOverview: contentBlurbSchema.optional(),
        areas: aiContentAreasSchema.optional(),
        improveIntro: contentBlurbSchema.optional(),
        report: z.string().min(1).max(3000).optional(),
        premium: z.string().min(1).max(3000).optional(),
      })
      .passthrough(),
  })
  .passthrough()

export type AiContentResponse = z.infer<typeof aiContentResponseSchema>

export type ReportSummarySchema = z.infer<typeof reportSummarySchema>

export { bandSchema }
