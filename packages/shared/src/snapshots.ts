import path from "node:path";
import Json5 from "json5";
import { z } from "zod";
import { kebabCase } from "./crypto";
import type { DesignReviewRun } from "./render";

export const JestSnapshotDataSchema = z.object({
  contentHash: z.string(),
  failedRules: z.array(z.string()),
  pass: z.boolean(),
});
export type JestSnapshotData = z.infer<typeof JestSnapshotDataSchema>;

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
  const snapshotState = matcherContext.snapshotState;
  const currentTestName = matcherContext.currentTestName;
  const count = snapshotState._counters.get(currentTestName) || 0;
  const snapshotKey = `${currentTestName} ${count + 1}`;
  let snapshotData = snapshotState._snapshotData[snapshotKey];
  if (!snapshotData) {
    return null;
  }
  snapshotData = snapshotData.replace(/^\\n/, "").trim();
  let parsedJson: unknown;
  try {
    parsedJson = Json5.parse(snapshotData);
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
