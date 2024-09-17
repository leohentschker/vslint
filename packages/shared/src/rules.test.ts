import { expect, test } from "vitest";
import { RuleSchema } from "./rules";

test("kebabCase", () => {
	expect(
		RuleSchema.safeParse({ ruleid: "sample-id", description: "asdasdasd" })
			.error,
	).not.toBeFalsy();
	expect(
		RuleSchema.safeParse({
			ruleid: "sample-id",
			description:
				"If any line of text contains more than 75 characters, mark it as true; otherwise, mark it as false.",
		}).error,
	).toBeFalsy();
});
