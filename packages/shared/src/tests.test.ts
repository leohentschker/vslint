import { expect, test, vitest } from "vitest";
import { getContentHash } from "./crypto";
import { extendExpectDesignReviewer } from "./tests";

test("extendExpectDesignReviewer behaves as expected", async () => {
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
