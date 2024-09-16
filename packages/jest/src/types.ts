import { Logger } from "winston";
import { z } from "zod";

export const RuleSchema = z.object({
	ruleid: z.string().min(1).max(100),
	description: z
		.string()
		.min(10)
		.max(1000)
		.refine((val) => {
			if (!val.includes("mark it as true")) return false;
			if (!val.includes("mark it as false")) return false;
		}, 'Rule must contain the phrase "mark it as true" as well as the phrase "mark it as false"'),
});
export type Rule = z.infer<typeof RuleSchema>;

export const DesignReviewMatcherSchema = z.object({
	reviewEndpoint: z.string().optional(),
	storeRendering: z.boolean().optional(),
	snapshotsDir: z.string().optional(),
	customStyles: z.array(z.string()),
	rules: z.array(RuleSchema).optional(),
	model: z.object({
		modelName: z.enum(["gpt-4o-mini", "gpt-4o", "gemini-1.5-flash"]),
		key: z.string().optional(),
	}),
});
export type DesignReviewMatcher = z.infer<typeof DesignReviewMatcherSchema>;

export const DesignReviewRunSchema = z.object({
	atSize: z
		.union([
			z.enum([
				"full-screen",
				"mobile",
				"tablet",
				"sm",
				"md",
				"lg",
				"xl",
				"2xl",
				"3xl",
			]),
			z.object({
				width: z.number(),
				height: z.number(),
			}),
		])
		.optional(),
	log: z
		.union([
			z.enum(["debug", "info", "warning", "error"]),
			z.instanceof(Logger),
		])
		.optional(),
});
export type DesignReviewRun = z.infer<typeof DesignReviewRunSchema>;

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
