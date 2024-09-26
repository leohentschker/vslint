import { ReviewResponseSchema } from "@vslint/shared";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
export const TestFixtureSchema = z.object({
	snapshot: ReviewResponseSchema,
	file: z.string(),
	lastModified: z.string(),
});
export type TestFixture = z.infer<typeof TestFixtureSchema>;
export const ListTextFixtureResponseSchema = z.object({
	fixtures: z.array(TestFixtureSchema),
});
