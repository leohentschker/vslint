import { Logger } from "winston";
import { z } from "zod";

export const RenderSizeSchema = z.union([
  z.enum([
    "full-screen",
    "mobile",
    "tablet",
    "xs",
    "sm",
    "md",
    "lg",
    "xl",
    "2xl",
    "3xl",
  ]),
  z.object({
    width: z.number(),
    height: z.number(),
  }),
]);

export const DesignReviewRunSchema = z.object({
  atSize: RenderSizeSchema.optional(),
  log: z
    .union([
      z.enum(["debug", "info", "warning", "error"]),
      z.instanceof(Logger),
    ])
    .optional(),
});
