import { z } from "zod";

export const ModelSchema = z.object({
  modelName: z.enum([
    "gpt-4o-mini",
    "gpt-4o",
    "gemini-1.5-flash",
    "gemini-1.5",
    "gpt-4.1",
    "gpt-4.1-mini",
  ]),
  key: z.string().optional(),
});
