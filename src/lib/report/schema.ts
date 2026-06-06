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
  })
  .strict()

export const codexReportResponseSchema = z
  .object({
    source: z.literal('codex').optional(),
    text: z.string().min(1).max(3000),
  })
  .passthrough()

export type ReportSummarySchema = z.infer<typeof reportSummarySchema>

export { bandSchema }
