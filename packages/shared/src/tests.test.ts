import { expect, test, vitest } from "vitest";
import { getContentHash } from "./crypto";
import { extendExpectDesignReviewer } from "./tests";

test("extendExpectDesignReviewer passes with cached passing snapshot", async () => {
  const sampleElement = document.createElement("div");
  sampleElement.outerHTML = "<div>sample-element</div>";
  const matcher = extendExpectDesignReviewer(
    {
      customStyles: [],
      model: { modelName: "gpt-4o-mini" },
    },
    () => ({
      snapshotPath: "snapshot-path",
      snapshotIdentifier: "snapshot-identifier",
      markSnapshotAsReviewed: vitest.fn(),
      existingSnapshot: {
        contentHash: getContentHash(sampleElement.outerHTML),
        failedRules: [],
        pass: true,
      },
    }),
  );
  const result = await matcher.toPassDesignReview(sampleElement);
  expect(result.pass).toBe(true);
});

test("extendExpectDesignReviewer fails with cached failing snapshot", async () => {
  const sampleElement = document.createElement("div");
  sampleElement.outerHTML = "<div>sample-element</div>";
  const matcher = extendExpectDesignReviewer(
    {
      customStyles: [],
      model: { modelName: "gpt-4o-mini" },
    },
    () => ({
      snapshotPath: "snapshot-path",
      snapshotIdentifier: "snapshot-identifier",
      markSnapshotAsReviewed: vitest.fn(),
      existingSnapshot: {
        contentHash: getContentHash(sampleElement.outerHTML),
        failedRules: ["rule-1"],
        pass: false,
      },
    }),
  );
  const result = await matcher.toPassDesignReview(sampleElement);
  expect(result.pass).toBe(false);
});

test("extendExpectDesignReviewer passes with cached failing snapshot but not strict", async () => {
  const sampleElement = document.createElement("div");
  sampleElement.outerHTML = "<div>sample-element</div>";
  const matcher = extendExpectDesignReviewer(
    {
      customStyles: [],
      model: { modelName: "gpt-4o-mini" },
      strict: false,
    },
    () => ({
      snapshotPath: "snapshot-path",
      snapshotIdentifier: "snapshot-identifier",
      markSnapshotAsReviewed: vitest.fn(),
      existingSnapshot: {
        contentHash: getContentHash(sampleElement.outerHTML),
        failedRules: ["rule-1"],
        pass: false,
      },
    }),
  );
  const result = await matcher.toPassDesignReview(sampleElement);
  expect(result.pass).toBe(true);
});
