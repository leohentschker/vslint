import sizeImage from "image-size";
import { expect, test } from "vitest";
import { renderHtmlContent } from "./render";

test("renderHtmlContent works with hardcoded viewport", async () => {
  const html = "<div>Hello, world!</div>";
  const viewport = { width: 375, height: 812 };
  const { response } = await renderHtmlContent(html, { viewport });
  expect(response).toBeDefined();
  const size = await sizeImage(response as Buffer);
  expect(size.width).toBe(viewport.width * 2);
  expect(size.height).toBe(viewport.height * 2);
});
test("renderHtmlContent works with fit viewport", async () => {
  const html = "<div>Hello, world!</div>";
  const { response } = await renderHtmlContent(html, { viewport: "fit" });
  expect(response).toBeDefined();
  const size = await sizeImage(response as Buffer);
  expect(size.width).toBeCloseTo(1584, 1);
  expect(size.height).toBeCloseTo(54, 1);
});
