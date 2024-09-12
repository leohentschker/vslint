import crypto from "node:crypto";
import * as fs from "node:fs";
import path from "node:path";
import axios from "axios";
import type { DesignReviewParams } from "./types";

export const kebabCase = (str: string) =>
	str
		.replace(/([a-z])([A-Z])/g, "$1-$2")
		.replace(/[\s_]+/g, "-")
		.toLowerCase();

const getSnapshotIdentifier = () => {
	const { currentTestName, testPath } = expect.getState();
	return kebabCase(`${path.basename(testPath || "")}-${currentTestName}`);
};
const getContentHash = (content: string) => {
	return crypto.createHash("sha256").update(content).digest("hex");
};

const elementIsHTMLElement = (element: unknown): element is HTMLElement => {
	return (
		typeof element === "object" &&
		element !== null
	);
};
const getViewportSize = (
	params?: DesignReviewParams,
): { width: number; height: number } => {
	if (params === undefined) {
		return {
			width: 1920,
			height: 1080,
		};
	}
	if (params.atSize === "full-screen") {
		return {
			width: 1920,
			height: 1080,
		};
	}
	if (params.atSize === "mobile") {
		return {
			width: 375,
			height: 812,
		};
	}
	if (params.atSize === "tablet") {
		return {
			width: 768,
			height: 1024,
		};
	}
	if (params.atSize === "sm") {
		return {
			width: 640,
			height: 480,
		};
	}
	if (params.atSize === "md") {
		return {
			width: 768,
			height: 1024,
		};
	}
	if (params.atSize === "lg") {
		return {
			width: 1024,
			height: 768,
		};
	}
	if (params.atSize === "xl") {
		return {
			width: 1280,
			height: 1024,
		};
	}
	if (params.atSize === "2xl") {
		return {
			width: 1536,
			height: 1024,
		};
	}
	if (params.atSize === "3xl") {
		return {
			width: 1920,
			height: 1080,
		};
	}
	return params.atSize;
};

type DesignReviewResult = {
	violations: Record<string, boolean>;
	contentHash: string;
	pass: boolean;
};

export const extendExpectDesignReviewer = (args: {
	designReviewEndpoint: string;
	snapshotsDir: string;
	cssPath: string;
	forceReview?: boolean;
}) => {
	const { cssPath, snapshotsDir, forceReview, designReviewEndpoint } = args;
	if (!fs.existsSync(cssPath)) {
		throw new Error(`Could not find CSS file at path ${cssPath}`);
	}
	if (!fs.existsSync(snapshotsDir)) {
		throw new Error(
			`Could not find snapshots directory at path ${snapshotsDir}`,
		);
	}

	const customStyles = fs.readFileSync(cssPath, "utf8");
	return {
		async toPassDesignReview(
			received: unknown,
			params?: DesignReviewParams,
		): Promise<jest.CustomMatcherResult> {
			const snapshotIdentifier = getSnapshotIdentifier();
			const snapshotPath = path.join(
				snapshotsDir,
				`${snapshotIdentifier}.json`,
			);
			const existingSnapshot: Partial<DesignReviewResult> =
				forceReview || !fs.existsSync(snapshotPath)
					? {}
					: JSON.parse(fs.readFileSync(snapshotPath, "utf8"));

			if (!elementIsHTMLElement(received)) {
				return {
					pass: false,
					message: () =>
						"Received invalid value for element. Make sure that you pass a HTMLElement object into your expect call! This should look like:\nconst { container } = render(...);\nexpect(container).toPassDesignReview();",
				};
			}

			if (
				!forceReview &&
				existingSnapshot.contentHash === getContentHash(received.outerHTML)
			) {
				return {
					pass: !!existingSnapshot.pass,
					message: () =>
						`Snapshot ${snapshotPath} already exists and has the same content hash. If you want to force a review, pass the option { forceReview: true } to your expect call.`,
				};
			}

			try {
				const response = await axios.post(designReviewEndpoint, {
					content: received.outerHTML,
					styles: customStyles,
					options: {
						viewport: getViewportSize(params),
					},
				});
				const { explanation, ...violations } = response.data;
				const pass = Object.values(violations).every(
					(checkFailed) => !checkFailed,
				);

				fs.writeFileSync(
					snapshotPath,
					JSON.stringify(
						{
							violations,
							contentHash: getContentHash(received.outerHTML),
							pass,
						},
						null,
						2,
					),
				);

				const message = () =>
					pass
						? "Automated review successful"
						: `Design review failed: ${explanation}`;
				return {
					message,
					pass,
				};
			} catch (err) {
				return {
					pass: false,
					message: () => `Failed to run design review: ${err}`,
				};
			}
		},
	};
};
