import crypto from "node:crypto";
import * as fs from "node:fs";
import path from "node:path";

const kebabCase = (str: string) =>
	str
		.replace(/([a-z])([A-Z])/g, "$1-$2")
		.replace(/[\s_]+/g, "-")
		.toLowerCase();

type DesignReviewResult = {
	contentHash: string;
	pass: boolean;
};

const getCurrentSnapshotIdentifier = () => {
	const { currentTestName, testPath } = expect.getState();
	if (!testPath) {
		throw new Error("Could not find current test path");
	}
	return kebabCase(`${path.basename(testPath)}-${currentTestName}`);
};

const elementIsHTMLElement = (element: unknown): element is HTMLElement => {
	return (
		typeof element === "object" &&
		element !== null &&
		Object.hasOwn(element, "nodeType")
	);
};

export const extendExpectDesignReviewer = (args: {
	snapshotsDir: string;
	rulesPath: string;
	openaiKey: string | undefined;
	cssPath: string;
}) => {
	const { cssPath, snapshotsDir, rulesPath, openaiKey } = args;
	if (!openaiKey) {
		throw new Error("OPENAI_KEY environment variable must be set");
	}
	if (!fs.existsSync(cssPath)) {
		throw new Error(`Could not find CSS file at path ${cssPath}`);
	}
	if (!fs.existsSync(rulesPath)) {
		throw new Error(`Could not find rules file at path ${rulesPath}`);
	}
	const customStyles = fs.readFileSync(cssPath, "utf8");
	const customRules = fs.readFileSync(rulesPath, "utf8");

	return {
		async toPassDesignReview(
			received: unknown,
		): Promise<jest.CustomMatcherResult> {
			if (!elementIsHTMLElement(received)) {
				return {
					pass: false,
					message: () =>
						"Received invalid value for element. Make sure that you pass a HTMLElement object into your expect call! This should look like:\nconst { container } = render(...);\nexpect(container).toPassDesignReview();",
				};
			}
			const testIdentifier = getCurrentSnapshotIdentifier();
			const contentHash = crypto
				.createHash("md5")
				.update(received.outerHTML)
				.digest("hex");
			const snapshotPath = path.join(snapshotsDir, `${testIdentifier}.json`);
			const existingReviewResult: Partial<DesignReviewResult> = fs.existsSync(
				snapshotPath,
			)
				? JSON.parse(fs.readFileSync(snapshotPath, "utf8"))
				: {};
			if (existingReviewResult.contentHash === contentHash) {
				return {
					pass: !!existingReviewResult.pass,
					message: () => `Using cached result for ${testIdentifier}`,
				};
			}

			const pass = false;
			const message: () => string = () =>
				pass ? "" : `Received ${received.outerHTML}`;
			return {
				message,
				pass,
			};
		},
	};
};
