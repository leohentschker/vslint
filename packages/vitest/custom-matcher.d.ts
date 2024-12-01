import type { DesignReviewRun } from "@vslint/shared";

interface CustomMatchers<R = unknown> {
  toPassDesignReview: (options?: DesignReviewRun) => R;
}

declare module "vitest" {
  interface Assertion<T> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
