import {
  type DesignReviewMatcher,
  extendExpectDesignReviewer as sharedExtendExpectDesignReviewer,
} from "@vslint/shared";

export function extendExpectDesignReviewer(unsafeArgs: DesignReviewMatcher) {
  return sharedExtendExpectDesignReviewer(
    (matcherContext: jest.MatcherContext) =>
      matcherContext.snapshotState.snapshotPath as string,
    unsafeArgs,
  );
}
