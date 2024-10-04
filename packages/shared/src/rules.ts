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
      return true;
    }, 'Rule must contain the phrase "mark it as true" as well as the phrase "mark it as false"'),
});
export type Rule = z.infer<typeof RuleSchema>;
