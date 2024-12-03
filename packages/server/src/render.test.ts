import * as fs from "node:fs";
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
  expect(size.width).toBeGreaterThan(0);
  expect(size.height).toBeGreaterThan(0);
  if (!size.width || !size.height) {
    throw new Error("Size is undefined");
  }
  expect(Math.abs(size.width - 1584)).toBeLessThan(5);
  expect(Math.abs(size.height - 54)).toBeLessThan(5);
});
