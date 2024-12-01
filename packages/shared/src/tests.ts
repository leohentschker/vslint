/**
 * Shared code for jest and vitest packages
 * Helpers here are explicitly expecting to be run in the context of a jest or vitest test
 */

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

export const getExistingSnapshot = (matcherContext: jest.MatcherContext) => {
  const snapshotState = matcherContext.snapshotState; // Jest's snapshot state
  const currentTestName = matcherContext.currentTestName; // Current test name
  const count = snapshotState._counters.get(currentTestName) || 0;
  const snapshotKey = `${currentTestName} ${count + 1}`;
  let snapshotData = snapshotState._snapshotData[snapshotKey];
  if (!snapshotData) {
    return null;
  }
  snapshotData = snapshotData.replace(/^\\n/, "").trim();

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(snapshotData);
  } catch (err) {
    return null;
  }

  const { data: parsedSnapshotData, error: parseError } =
    JestSnapshotDataSchema.safeParse(parsedJson);
  if (parseError) {
    return null;
  }
  return parsedSnapshotData;
};

export const markSnapshotAsReviewed = (matcherContext: jest.MatcherContext) => {
  const snapshotState = matcherContext.snapshotState;
  const currentTestName = matcherContext.currentTestName;
  const count = snapshotState._counters.get(currentTestName) || 0;
  const snapshotKey = `${currentTestName} ${count + 1}`;
  snapshotState._counters.set(currentTestName, count + 1);
  snapshotState._uncheckedKeys.delete(snapshotKey);
};
