import { expect, test } from "vitest";
import { z } from "zod";
import { DEFAULT_RULES, RuleSchema } from "./rules";

test("RuleSchema", () => {
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

test("DEFAULT_RULES parses", () => {
  const { error } = z.array(RuleSchema).safeParse(DEFAULT_RULES);
  expect(error).toBeFalsy();
});
