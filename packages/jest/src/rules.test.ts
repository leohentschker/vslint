import { RuleSchema } from "@vslint/shared";
import { expect, test } from "vitest";
import { z } from "zod";
import { DEFAULT_RULES } from "./rules";

test("DEFAULT_RULES parses", () => {
	const { error } = z.array(RuleSchema).safeParse(DEFAULT_RULES);
	expect(error).toBeFalsy();
});
