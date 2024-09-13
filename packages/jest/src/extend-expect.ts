import crypto from "node:crypto";
import * as fs from "node:fs";
import path from "node:path";
import axios from "axios";
import type { DesignReviewParams } from "./types";
import { getLogger } from "./logging";
import { elementIsHTMLElement, getViewportSize } from "./render";

global.setImmediate =
	global.setImmediate ||
	((fn: any, ...args: any[]) => global.setTimeout(fn, 0, ...args));

export const kebabCase = (str: string) =>
	str
		.replace(/([a-z])([A-Z])/g, "$1-$2")
		.replace(/[\s_]+/g, "-")
		.toLowerCase();

const getSnapshotIdentifier = (params: DesignReviewParams | undefined) => {
	const { currentTestName, testPath } = expect.getState();
	return kebabCase(
		`${path.basename(testPath || "")}-${currentTestName}${params?.atSize ? `-${params.atSize}` : ""}`,
	);
};
const getContentHash = (content: string) => {
	return crypto.createHash("sha256").update(content).digest("hex");
};

type DesignReviewResult = {
	violations: Record<string, boolean>;
	contentHash: string;
	explanation: string;
	pass: boolean;
};

export const extendExpectDesignReviewer = (args: {
	reviewEndpoint: string;
	snapshotsDir: string;
	cssPath: string;
	forceReviewAll?: boolean;
}) => {
	const { cssPath, snapshotsDir, forceReviewAll, reviewEndpoint } = args;
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
			const snapshotIdentifier = getSnapshotIdentifier(params);
			const logger = getLogger(params?.log);

			const snapshotPath = path.join(
				snapshotsDir,
				`${snapshotIdentifier}.json`,
			);
			logger.debug(`Snapshot path: ${snapshotPath}`);

			const snapshotFileExists = fs.existsSync(snapshotPath);
			if (snapshotFileExists)
				logger.debug(`Snapshot file exists, pulling existing data`);
			else logger.debug(`Snapshot file does not exist, creating new snapshot`);

			const forceRereview = params?.forceReviewTest || forceReviewAll;
			logger.debug(
				forceRereview
					? "Re-reviewing all snapshots."
					: "Not forcing re-review, will check for existing snapshot changes.",
			);

			const existingSnapshot: Partial<DesignReviewResult> =
				forceRereview || !fs.existsSync(snapshotPath)
					? {}
					: JSON.parse(fs.readFileSync(snapshotPath, "utf8"));

			if (!elementIsHTMLElement(received)) {
				const errorMessage =
					"Received invalid value for element. Make sure that you pass a HTMLElement object into your expect call! This should look like:\nconst { container } = render(...);\nexpect(container).toPassDesignReview();";
				logger.error(errorMessage);
				return { pass: false, message: () => errorMessage };
			}

			if (
				!forceRereview &&
				existingSnapshot.contentHash === getContentHash(received.outerHTML)
			) {
				logger.debug(
					`Snapshot ${snapshotPath} already exists and has the same content hash. Skipping review. To force a review, pass the option { forceReview: true } to your expect call.`,
				);
				return {
					pass: !!existingSnapshot.pass,
					message: () =>
						!!existingSnapshot.pass
							? "Snapshot passed design review"
							: `Snapshot failed design review. ${existingSnapshot.explanation}`,
				};
			}
			const viewport = getViewportSize(params);
			logger.debug(`Viewport: ${JSON.stringify(viewport)}`);

			try {
				logger.debug(`Sending request to review endpoint`);
				const response = await axios.post(reviewEndpoint, {
					content: received.outerHTML,
					styles: customStyles,
					options: {
						viewport,
					},
				});
				const { explanation, ...violations } = response.data;
				const pass = Object.values(violations).every(
					(checkFailed) => !checkFailed,
				);
				logger.debug(`Review result: ${JSON.stringify(violations, null, 2)}`);

				const newSnapshot = {
					explanation,
					violations,
					contentHash: getContentHash(received.outerHTML),
					pass,
				};
				if (newSnapshot !== existingSnapshot) {
					logger.debug(`Snapshot ${snapshotPath} has changed, updating`);
					fs.writeFileSync(
						snapshotPath,
						JSON.stringify(
							{
								explanation,
								violations,
								contentHash: getContentHash(received.outerHTML),
								pass,
							},
							null,
							2,
						),
					);
				} else {
					logger.debug(
						`Snapshot ${snapshotPath} has not changed, skipping update`,
					);
				}

				const message = () =>
					pass
						? "Automated review successful"
						: `Design review failed: ${explanation}`;
				return {
					message,
					pass,
				};
			} catch (err) {
				logger.debug(`Failed to run design review: ${err}`);
				return {
					pass: false,
					message: () => `Failed to run design review: ${err}`,
				};
			}
		},
	};
};
