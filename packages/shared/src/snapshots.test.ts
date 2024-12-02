import { expect, test } from "vitest";
import {
  getExistingSnapshot,
  getSnapshotIdentifier,
  markSnapshotAsReviewed,
} from "./snapshots";

test("getSnapshotIdentifier", () => {
  expect(
    getSnapshotIdentifier(
      {
        currentTestName: "test-name",
        testPath: "/path/to/test.ts",
      } as jest.MatcherState,
      undefined,
    ),
  ).toBe("test.ts-test-name");
});

test("getExistingSnapshot returns null if no snapshot exists", () => {
  expect(
    getExistingSnapshot({
      snapshotState: {
        _counters: new Map(),
        _snapshotData: {},
      },
      currentTestName: "test-name",
    } as Partial<jest.MatcherContext> as jest.MatcherContext),
  ).toBe(null);
});

test("getExistingSnapshot returns snapshot data if snapshot exists", () => {
  const existingSnapshot = getExistingSnapshot({
    snapshotState: {
      _counters: new Map([["test-name", 0]]),
      _snapshotData: {
        "test-name 1": `{"pass": true, "failedRules": [], "contentHash": "contentHash"}`,
      },
    },
    currentTestName: "test-name",
  } as Partial<jest.MatcherContext> as jest.MatcherContext);
  expect(existingSnapshot).not.toBeNull();
  expect(existingSnapshot?.contentHash).toBe("contentHash");
});

test("markSnapshotAsReviewed", () => {
  const matcherContext = {
    snapshotState: {
      _counters: new Map([["test-name", 0]]),
      _uncheckedKeys: new Set(["test-name 1"]),
    },
    currentTestName: "test-name",
  } as Partial<jest.MatcherContext> as jest.MatcherContext;
  markSnapshotAsReviewed(matcherContext);
  expect(matcherContext.snapshotState._uncheckedKeys.size).toBe(0);
});
