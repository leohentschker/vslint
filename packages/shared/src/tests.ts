import path from "node:path";
import { z } from "zod";
import { kebabCase } from "./crypto";
import { ModelSchema } from "./models";
import type { DesignReviewRun } from "./render";
import { RuleSchema } from "./rules";

export const DesignReviewMatcherSchema = z.object({
  reviewEndpoint: z.string().optional(),
  customStyles: z.array(z.string()),
  rules: z.array(RuleSchema).optional(),
  strict: z.boolean().default(true),
  model: ModelSchema,
});
export type DesignReviewMatcher = z.input<typeof DesignReviewMatcherSchema>;
export const DEFAULT_REVIEW_TIMEOUT = 50000;

export const elementIsHTMLElement = (
  element: unknown,
): element is HTMLElement => {
  return typeof element === "object" && element !== null;
};

export const JestSnapshotDataSchema = z.object({
  contentHash: z.string(),
  failedRules: z.array(z.string()),
  pass: z.boolean(),
});

export const getSnapshotIdentifier = (
  jestState: jest.MatcherState,
  params: DesignReviewRun | undefined,
) => {
  const { currentTestName, testPath } = jestState;
  let sizeSuffix = "";
  if (params?.atSize) {
    sizeSuffix =
      typeof params.atSize === "string"
        ? params.atSize
        : `${params.atSize.width}x${params.atSize.height}`;
  }
  return kebabCase(
    `${path.basename(testPath || "")}-${currentTestName}${sizeSuffix ? `-${sizeSuffix}` : ""}`,
  );
};
