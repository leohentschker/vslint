export type DesignReviewParams = {
	atSize:
		| "full-screen"
		| "mobile"
		| "tablet"
		| "sm"
		| "md"
		| "lg"
		| "xl"
		| "2xl"
		| "3xl"
		| { width: number; height: number };
};

declare global {
	namespace jest {
		interface Matchers<R> {
			toPassDesignReview(
				params?: DesignReviewParams,
			): Promise<CustomMatcherResult>;
		}
	}
}
