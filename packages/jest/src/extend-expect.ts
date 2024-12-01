import {
  type DesignReviewMatcher,
  extendExpectDesignReviewer as sharedExtendExpectDesignReviewer,
} from "@vslint/shared";

export function extendExpectDesignReviewer(unsafeArgs: DesignReviewMatcher) {
  return sharedExtendExpectDesignReviewer(
    unsafeArgs,
    (matcherContext: jest.MatcherContext) => ({
      snapshotPath: matcherContext.snapshotState._snapshotPath as string,
    }),
  );
}
