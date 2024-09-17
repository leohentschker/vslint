import { z } from "zod";
import { ModelSchema } from "./models";
import { RuleSchema } from "./rules";

export const ReviewRequestSchema = z.object({
	content: z.string(),
	stylesheets: z.array(z.string()),
	rules: z.array(RuleSchema),
	model: ModelSchema,
	options: z.object({
		viewport: z.object({ width: z.number(), height: z.number() }),
	}),
});
export type ReviewRequest = z.infer<typeof ReviewRequestSchema>;

export const ReviewResponseSchema = z.object({
	explanation: z.string().optional().nullable(),
	contentHash: z.string(),
	violations: z.any(),
	rendering: z.string(),
	pass: z.boolean(),
});
export type ReviewResponse = z.infer<typeof ReviewResponseSchema>;
