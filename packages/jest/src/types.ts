declare global {
	namespace jest {
		interface Matchers<R> {
			toPassDesignReview(floor: number, ceiling: number): R;
		}
	}
}

export type {};
