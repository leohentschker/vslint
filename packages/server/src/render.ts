import { JSDOM } from "jsdom";
import puppeteer, { type Browser } from "puppeteer";
import { Failure, Ok, type Option, type RenderRequest } from "./types";

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
export const renderDom = async ({
	stylesheets,
	content,
	options,
}: RenderRequest): Promise<Option<Buffer>> => {
	const dom = new JSDOM(content);
	const style = dom.window.document.createElement("style");
	style.innerHTML = stylesheets.join("\n");
	dom.window.document.head.appendChild(style);
	try {
		const browser = await getBrowser();
		const page = await browser.newPage();
		await page.setContent(dom.serialize());
		await page.setViewport(options.viewport);
		const pageScreenshot = await page.screenshot({ type: "png" });
		await page.close();
		return Ok(Buffer.from(pageScreenshot));
	} catch (err) {
		console.log(err, "Failed to render DOM");
		return Failure(err);
	}
};
