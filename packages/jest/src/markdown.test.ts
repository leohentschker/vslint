import { expect, test } from "vitest";
import { markdownToReviewResponse } from "./markdown";

const SAMPLE_REVIEW_RESPONSE = `
# SearchBox should render
**Pass:** \`true\`
**Content Hash:** \`d584b287ffd189179738c89c5b1bc417\`
**Viewport:** \`640\`x\`480\`

![SearchBox should render](search-box.test.tsx-search-box-should-render-sm.png)

## Review
Design review passed.

### Failed Rules


### Passed Rules
- text-too-wide - If a single line of text, as it appears between line breaks (aka newlines), contains more than 75 characters, excluding spaces and punctuation, mark it as true and explain which line is too long; otherwise, mark it as false.
- bad-gray-text - Gray text components should have the same color. This does not apply to placeholders or labels. If text components have different shades of gray, mark it as true; otherwise, mark it as false.
`.trim();

test("markdownToReviewResponse", () => {
  const result = markdownToReviewResponse(SAMPLE_REVIEW_RESPONSE);
  expect(result).toEqual({
    name: "SearchBox should render",
    pass: true,
    contentHash: "d584b287ffd189179738c89c5b1bc417",
    viewport: {
      width: 640,
      height: 480,
    },
    explanation: "Design review passed.",
    violations: {
      "text-too-wide": {
        rule: "If a single line of text, as it appears between line breaks (aka newlines), contains more than 75 characters, excluding spaces and punctuation, mark it as true and explain which line is too long; otherwise, mark it as false.",
        fail: false,
      },
      "bad-gray-text": {
        rule: "Gray text components should have the same color. This does not apply to placeholders or labels. If text components have different shades of gray, mark it as true; otherwise, mark it as false.",
        fail: false,
      },
    },
  });
});
