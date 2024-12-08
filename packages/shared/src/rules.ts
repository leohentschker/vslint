import * as fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const RuleSampleSchema = z.object({
  html: z.string().min(10),
  viewport: z.object({
    width: z.number(),
    height: z.number(),
  }),
  fail: z.boolean(),
});

export const RuleSchema = z.object({
  ruleid: z.string().min(1).max(100),
  description: z
    .string()
    .min(10)
    .max(1000)
    .refine((val) => {
      if (!val.includes("mark it as true")) return false;
      if (!val.includes("mark it as false")) return false;
      return true;
    }, 'Rule must contain the phrase "mark it as true" as well as the phrase "mark it as false"'),
  samples: z.array(RuleSampleSchema).optional(),
});
export type Rule = z.infer<typeof RuleSchema>;

const RULE_DATA = JSON.parse(
  fs.readFileSync(path.join(__dirname, "rules.json"), "utf8"),
);
export const DEFAULT_RULES: Rule[] = z.array(RuleSchema).parse(RULE_DATA);
