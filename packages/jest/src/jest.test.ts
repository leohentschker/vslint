import { expect, test } from "vitest";
import { getSnapshotIdentifier } from "./jest";

test("getSnapshotIdentifier", () => {
	const expectState = {
		currentTestName: "current-test",
		testPath: "./current-file.test.tsx",
	} as jest.MatcherState;
	expect(getSnapshotIdentifier(expectState, undefined)).toBe(
		"current-file.test.tsx-current-test",
	);
	expect(getSnapshotIdentifier(expectState, { atSize: "sm" })).toBe(
		"current-file.test.tsx-current-test-sm",
	);
	expect(
		getSnapshotIdentifier(expectState, { atSize: { width: 100, height: 200 } }),
	).toBe("current-file.test.tsx-current-test-100x200");
});
