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
    {
      getSnapshotData: () => ({
        snapshotPath: "snapshot-path",
        snapshotIdentifier: "snapshot-identifier",
        markSnapshotAsReviewed: vitest.fn(),
        existingSnapshot: {
          contentHash: getContentHash(sampleElement.outerHTML),
          failedRules: [],
          pass: true,
        },
      }),
    },
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
    {
      getSnapshotData: () => ({
        snapshotPath: "snapshot-path",
        snapshotIdentifier: "snapshot-identifier",
        markSnapshotAsReviewed: vitest.fn(),
        existingSnapshot: {
          contentHash: getContentHash(sampleElement.outerHTML),
          failedRules: ["rule-1"],
          pass: false,
        },
      }),
    },
  );
  const result = await matcher.toPassDesignReview(sampleElement);
  expect(result.pass).toBe(false);
});

test("extendExpectDesignReviewer passes with cached failing snapshot but not strict set at the global level", async () => {
  const sampleElement = document.createElement("div");
  sampleElement.outerHTML = "<div>sample-element</div>";
  const matcher = extendExpectDesignReviewer(
    {
      customStyles: [],
      model: { modelName: "gpt-4o-mini" },
      strict: false,
    },
    {
      getSnapshotData: () => ({
        snapshotPath: "snapshot-path",
        snapshotIdentifier: "snapshot-identifier",
        markSnapshotAsReviewed: vitest.fn(),
        existingSnapshot: {
          contentHash: getContentHash(sampleElement.outerHTML),
          failedRules: ["rule-1"],
          pass: false,
        },
      }),
    },
  );
  const result = await matcher.toPassDesignReview(sampleElement);
  expect(result.pass).toBe(true);
});

test("extendExpectDesignReviewer passes with cached failing snapshot but not strict set at the test level", async () => {
  const sampleElement = document.createElement("div");
  sampleElement.outerHTML = "<div>sample-element</div>";
  const matcher = extendExpectDesignReviewer(
    {
      customStyles: [],
      model: { modelName: "gpt-4o-mini" },
    },
    {
      getSnapshotData: () => ({
        snapshotPath: "snapshot-path",
        snapshotIdentifier: "snapshot-identifier",
        markSnapshotAsReviewed: vitest.fn(),
        existingSnapshot: {
          contentHash: getContentHash(sampleElement.outerHTML),
          failedRules: ["rule-1"],
          pass: false,
        },
      }),
    },
  );
  const result = await matcher.toPassDesignReview(sampleElement, {
    strict: false,
  });
  expect(result.pass).toBe(true);
});

test("extendExpectDesignReviewer throws a runtime exception when no cached snapshot is present and we are missing the OpenAI API key", async () => {
  const sampleElement = document.createElement("div");
  sampleElement.outerHTML = "<div>sample-element</div>";
  const matcher = extendExpectDesignReviewer(
    {
      customStyles: [],
      model: { modelName: "gpt-4o-mini" },
    },
    {
      getSnapshotData: () => ({
        snapshotPath: "snapshot-path",
        snapshotIdentifier: "snapshot-identifier",
        markSnapshotAsReviewed: vitest.fn(),
        existingSnapshot: null,
      }),
    },
  );
  await expect(matcher.toPassDesignReview(sampleElement)).rejects.toThrow(
    "No model key provided.",
  );
});

test("extendExpectDesignReviewer throws an error when snapshot does not match but we are in CI", async () => {
  const sampleElement = document.createElement("div");
  sampleElement.outerHTML = "<div>sample-element</div>";

  const matcher = extendExpectDesignReviewer(
    {
      customStyles: [],
      model: { modelName: "gpt-4o-mini", key: "test-api-key" },
    },
    {
      getTestEnvironment: () => ({ inCI: true }),
      getSnapshotData: () => ({
        snapshotPath: "snapshot-path",
        snapshotIdentifier: "snapshot-identifier",
        markSnapshotAsReviewed: vitest.fn(),
        existingSnapshot: null,
      }),
    },
  );
  await expect(matcher.toPassDesignReview(sampleElement)).rejects.toThrow(
    "Snapshots must be generated locally.",
  );
});
