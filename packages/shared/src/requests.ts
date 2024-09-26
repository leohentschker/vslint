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
	testDetails: z.object({
		name: z.string(),
	}),
});
export type ReviewRequest = z.infer<typeof ReviewRequestSchema>;

export const ReviewResponseSchema = z.object({
	explanation: z.string().optional(),
	contentHash: z.string(),
	violations: z.record(
		z.string(),
		z.object({
			fail: z.boolean(),
			rule: z.string(),
		}),
	),
	name: z.string(),
	content: z.string(),
	viewport: z.object({
		width: z.number(),
		height: z.number(),
	}),
	pass: z.boolean(),
});
export type ReviewResponse = z.infer<typeof ReviewResponseSchema>;
