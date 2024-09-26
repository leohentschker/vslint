import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const TestSnapshotSchema = z.object({
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
});
export const TestFixtureSchema = z.object({
	snapshot: TestSnapshotSchema,
	file: z.string(),
	lastModified: z.string(),
});
export type TestFixture = z.infer<typeof TestFixtureSchema>;
export const ListTextFixtureResponseSchema = z.object({
	fixtures: z.array(TestFixtureSchema),
});
