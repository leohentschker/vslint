import { ModelSchema, RenderSizeSchema, RuleSchema } from "@vslint/shared";
import { Logger } from "winston";
import { z } from "zod";

export const DesignReviewMatcherSchema = z.object({
  reviewEndpoint: z.string().optional(),
  customStyles: z.array(z.string()),
  rules: z.array(RuleSchema).optional(),
  strict: z.boolean().default(true),
  model: ModelSchema,
});
export type DesignReviewMatcher = z.input<typeof DesignReviewMatcherSchema>;

export const DesignReviewRunSchema = z.object({
  strict: z.boolean().default(true),
  atSize: RenderSizeSchema.optional(),
  log: z
    .union([
      z.enum(["debug", "info", "warning", "error"]),
      z.instanceof(Logger),
    ])
    .optional(),
});
export type DesignReviewRun = z.input<typeof DesignReviewRunSchema>;

export const JestSnapshotDataSchema = z.object({
  contentHash: z.string(),
  failedRules: z.array(z.string()),
  pass: z.boolean(),
});

declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * Make sure that the received element in `expect(...)` is an HTMLElement
       * Run at different viewport sizes by using the `atSize` parameter
       * Debug what's happening by using the `log` parameter to set different log levels
       */
      toPassDesignReview(
        params?: DesignReviewRun,
      ): Promise<CustomMatcherResult>;
    }
  }
}
