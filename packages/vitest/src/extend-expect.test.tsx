import { render, screen } from "@testing-library/react";
import { DEFAULT_REVIEW_TIMEOUT } from "@vslint/shared";
import React from "react";
import { expect, test } from "vitest";
import { extendExpectDesignReviewer } from "./extend-expect";

expect.extend(
  extendExpectDesignReviewer({
    customStyles: [],
    model: {
      modelName: "gpt-4o",
      key: process.env.OPENAI_API_KEY,
    },
  }),
);

test("React rendering works as expected", () => {
  render(<div>Hello</div>);
  const element = screen.getByText("Hello");
  expect(element).toBeInTheDocument();
});

test(
  "Snapshot tests work as expected",
  async () => {
    const { container } = render(<div>Testing content for design review</div>);
    await expect(container).toPassDesignReview({ atSize: "xs", strict: false });
  },
  DEFAULT_REVIEW_TIMEOUT,
);
