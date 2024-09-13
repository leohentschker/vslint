import type { Logger, LoggerOptions } from "winston";

export type DesignReviewParams = {
	atSize?:
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
	log?: LoggerOptions["level"] | Logger;
	forceReviewTest?: boolean;
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
