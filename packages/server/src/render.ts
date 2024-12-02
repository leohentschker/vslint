import { Failure, Ok, type Option, type ReviewRequest } from "@vslint/shared";
import { JSDOM } from "jsdom";
import puppeteer, { type Browser } from "puppeteer";
import { getLogger } from "./logger";

let _BROWSER: null | Browser = null;
const getBrowser = async () => {
  if (!_BROWSER) {
    _BROWSER = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      ignoreDefaultArgs: ["--disable-extensions"],
    });
  }
  return _BROWSER;
};

export const getHtmlFromReviewRequest = ({
  content,
  stylesheets,
}: ReviewRequest) => {
  const dom = new JSDOM(content);
  const style = dom.window.document.createElement("style");
  style.innerHTML = stylesheets.join("\n");
  dom.window.document.head.appendChild(style);
  return dom.serialize();
};

export const renderHtmlContent = async (
  html: string,
  options: Pick<ReviewRequest["options"], "viewport">,
): Promise<Option<Buffer>> => {
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(html);
    const { naturalWidth, naturalHeight } = await page.evaluate(() => {
      const allChildren = Array.from(document.body.children);
      const boundingBoxes = allChildren.map((child) =>
        child.getBoundingClientRect(),
      );

      const maxWidth = Math.max(...boundingBoxes.map((box) => box.right));
      const maxHeight = Math.max(...boundingBoxes.map((box) => box.bottom));

      return {
        naturalWidth: Math.ceil(maxWidth),
        naturalHeight: Math.ceil(maxHeight),
      };
    });

    const viewportOptions = {
      width: options.viewport === "fit" ? naturalWidth : options.viewport.width,
      height:
        options.viewport === "fit" ? naturalHeight : options.viewport.height,
      deviceScaleFactor: 2,
    };
    await page.setViewport(viewportOptions);
    await page.waitForNetworkIdle();
    const pageScreenshot = await page.screenshot({ type: "png" });
    await page.close();
    return Ok(Buffer.from(pageScreenshot));
  } catch (err) {
    console.log(err, "Failed to render DOM");
    return Failure(err);
  }
};

export const getHtmlAndRender = async (reviewRequest: ReviewRequest) => {
  const html = await getHtmlFromReviewRequest(reviewRequest);
  return renderHtmlContent(html, reviewRequest.options);
};
