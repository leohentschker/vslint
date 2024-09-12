import z from "zod";

export const RenderRequestSchema = z.object({
	content: z.string(),
	styles: z.string(),
	options: z.object({
		viewport: z.object({
			width: z.number(),
			height: z.number(),
		}),
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
