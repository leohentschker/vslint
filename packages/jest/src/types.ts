import type { DesignReviewRun } from "@vslint/shared";

declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * Make sure that the received element in `expect(...)` is an HTMLElement
       * Run at different viewport sizes by using the `atSize` parameter
       * Debug what's happening by using the `log` parameter to set different log levels
       */
      toPassDesignReview(
        params?: DesignReviewRun,
      ): Promise<CustomMatcherResult>;
    }
  }
}
