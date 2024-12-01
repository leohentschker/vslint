import path from "node:path";
import { kebabCase } from "@vslint/shared";
import type { DesignReviewRun } from "@vslint/shared";

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
