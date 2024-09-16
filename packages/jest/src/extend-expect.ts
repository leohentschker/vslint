import crypto from "node:crypto";
import * as fs from "node:fs";
import path from "node:path";
import axios, { type AxiosError, type AxiosResponse } from "axios";
import { getLogger } from "./logging";
import { elementIsHTMLElement, getViewportSize } from "./render";
import { DEFAULT_RULES } from "./rules";
import type { DesignReviewParams } from "./types";

global.setImmediate =
	global.setImmediate ||
	((fn: TimerHandler, ...args: unknown[]) => global.setTimeout(fn, 0, ...args));

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

const DEFAULT_DESIGN_SNAPSHOT_DIR = "__tests__/__design_snapshots__";
const DEFAULT_REVIEW_ENDPOINT =
	"https://vslint-644118703752.us-central1.run.app/api/v1/design-review";

export const extendExpectDesignReviewer = (args: {
	reviewEndpoint?: string;
	snapshotsDir?: string;
	customStyles: string[];
	model: { modelName: string; key: string };
	rules?: { ruleid: string; description: string }[];
}) => {
	const { customStyles, snapshotsDir, reviewEndpoint, model, rules } = args;
	const designSnapshotsDir = snapshotsDir || DEFAULT_DESIGN_SNAPSHOT_DIR;
	for (const cssPath of customStyles) {
		if (!fs.existsSync(cssPath)) {
			throw new Error(
				`Could not find CSS file at path ${cssPath}. This file is required to correctly render your snapshots with your custom files.`,
			);
		}
	}
	if (!model?.modelName || !model?.key) {
		throw new Error("Model name and key must be provided in the model config");
	}

	// if the snapshots directory does not exist, log and create it
	if (!fs.existsSync(designSnapshotsDir)) {
		fs.mkdirSync(designSnapshotsDir, { recursive: true });
		getLogger().warn(
			`Created snapshots directory at path ${designSnapshotsDir}`,
		);
	}

	const stylesheets = customStyles.map((cssPath) =>
		fs.readFileSync(cssPath, "utf8"),
	);

	return {
		async toPassDesignReview(
			received: unknown,
			params?: DesignReviewParams,
		): Promise<jest.CustomMatcherResult> {
			const snapshotIdentifier = getSnapshotIdentifier(params);
			const logger = getLogger(params?.log);

			const snapshotPath = path.join(
				designSnapshotsDir,
				`${snapshotIdentifier}.json`,
			);
			logger.debug(`Snapshot path: ${snapshotPath}`);

			const snapshotFileExists = fs.existsSync(snapshotPath);
			if (snapshotFileExists)
				logger.debug("Snapshot file exists, pulling existing data");
			else logger.debug("Snapshot file does not exist, creating new snapshot");

			const existingSnapshot: Partial<DesignReviewResult> = !fs.existsSync(
				snapshotPath,
			)
				? {}
				: JSON.parse(fs.readFileSync(snapshotPath, "utf8"));

			if (!elementIsHTMLElement(received)) {
				const errorMessage =
					"Received invalid value for element. Make sure that you pass a HTMLElement object into your expect call! This should look like:\nconst { container } = render(...);\nexpect(container).toPassDesignReview();";
				logger.error(errorMessage);
				return { pass: false, message: () => errorMessage };
			}

			if (existingSnapshot.contentHash === getContentHash(received.outerHTML)) {
				logger.debug(
					`Snapshot ${snapshotPath} already exists and has the same content hash. Skipping review. To force a review, pass the option { forceReview: true } to your expect call.`,
				);
				return {
					pass: !!existingSnapshot.pass,
					message: () =>
						existingSnapshot.pass
							? "Snapshot passed design review"
							: `Snapshot failed design review. ${existingSnapshot.explanation}`,
				};
			}
			const viewport = getViewportSize(params);
			logger.debug(`Viewport: ${JSON.stringify(viewport)}`);

			let response: AxiosResponse;

			try {
				logger.debug("Sending request to review endpoint");
				response = await axios.post(reviewEndpoint || DEFAULT_REVIEW_ENDPOINT, {
					content: received.outerHTML,
					stylesheets,
					rules: rules || DEFAULT_RULES,
					model,
					options: {
						viewport,
					},
				});
			} catch (err) {
				const axiosError = err as AxiosError;
				logger.error(
					`Error while sending request to review endpoint: ${axiosError.message}`,
				);
				return {
					pass: false,
					message: () =>
						`Error while sending request to review endpoint: ${axiosError.message}`,
				};
			}
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
		},
	};
};
