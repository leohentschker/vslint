import z from "zod";

export const RenderRequestSchema = z.object({
	content: z.string(),
	stylesheets: z.array(z.string()),
	options: z.object({
		viewport: z.object({
			width: z.number(),
			height: z.number(),
		}),
	}),
	rules: z.array(
		z.object({
			ruleid: z.string(),
			description: z.string(),
		}),
	),
	model: z.object({
		modelName: z
			.literal("gpt-4o")
			.or(z.literal("gpt-4o-mini"))
			.or(z.literal("gemini-1.5-flash")),
		key: z.string(),
	}),
});
export type RenderRequest = z.infer<typeof RenderRequestSchema>;

export type Option<T> =
	| { response: T; error: null }
	| { response: null; error: Error };
export const Ok = <T>(response: T): Option<T> => ({ response, error: null });
export const Failure = (error: unknown) => ({
	response: null,
	error: error as Error,
});
