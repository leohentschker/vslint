import {
  type DesignReviewMatcher,
  getExistingSnapshot,
  markSnapshotAsReviewed,
  extendExpectDesignReviewer as sharedExtendExpectDesignReviewer,
} from "@vslint/shared";

export function extendExpectDesignReviewer(unsafeArgs: DesignReviewMatcher) {
  return sharedExtendExpectDesignReviewer(unsafeArgs, {
    getSnapshotData: (matcherContext: jest.MatcherContext) => ({
      markSnapshotAsReviewed: () => markSnapshotAsReviewed(matcherContext),
      snapshotPath: matcherContext.snapshotState.snapshotPath as string,
      existingSnapshot: getExistingSnapshot(matcherContext),
    }),
  });
}
