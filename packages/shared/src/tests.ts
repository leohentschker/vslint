import { Logger } from "winston";
import { z } from "zod";
import { ModelSchema } from "./models";
import { RenderSizeSchema } from "./render";
import { RuleSchema } from "./rules";

export const DesignReviewMatcherSchema = z.object({
  reviewEndpoint: z.string().optional(),
  snapshotsDir: z.string().optional(),
  customStyles: z.array(z.string()),
  rules: z.array(RuleSchema).optional(),
  model: ModelSchema,
});
export type DesignReviewMatcher = z.infer<typeof DesignReviewMatcherSchema>;

export const DesignReviewRunSchema = z.object({
  atSize: RenderSizeSchema.optional(),
  log: z
    .union([
      z.enum(["debug", "info", "warning", "error"]),
      z.instanceof(Logger),
    ])
    .optional(),
});
export type DesignReviewRun = z.infer<typeof DesignReviewRunSchema>;
