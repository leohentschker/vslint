import * as fs from "node:fs";
import path from "node:path";
import type { ReviewRequest, ReviewResponse } from "@vslint/shared";
import axios, { type AxiosError, type AxiosResponse } from "axios";
import {
	DEFAULT_DESIGN_SNAPSHOT_DIR,
	DEFAULT_REVIEW_ENDPOINT,
} from "./constants";
import { getContentHash } from "./helpers";
import { getSnapshotIdentifier } from "./jest";
import { getLogger } from "./logging";
import { elementIsHTMLElement, getViewportSize } from "./render";
import { DEFAULT_RULES } from "./rules";
import {
	type DesignReviewMatcher,
	DesignReviewMatcherSchema,
	type DesignReviewRun,
	DesignReviewRunSchema,
} from "./types";
import { markdownToReviewResponse, reviewResponseToMarkdown } from "./markdown";

global.setImmediate =
	global.setImmediate ||
	((fn: TimerHandler, ...args: unknown[]) => global.setTimeout(fn, 0, ...args));

/**
 * Create a new jest matcher that exposes the `toPassDesignReview` method.
 * Expose this to your jest environment by running
 * expect.extend(extendExpectDesignReviewer({
 *   customStyles: ['./styles/globals.css'],
 *   model: {
 *     modelName: 'gpt-4o',
 *     key: process.env.OPENAI_API_KEY
 *   }
 * }));
 * @param {DesignReviewMatcher} args - Configuration for the design reviewer
 */
export const extendExpectDesignReviewer = (unsafeArgs: DesignReviewMatcher) => {
	const { data: args, error: extendValidationError } =
		DesignReviewMatcherSchema.safeParse(unsafeArgs);
	if (extendValidationError) {
		throw new Error(extendValidationError.message);
	}
	const { customStyles, snapshotsDir, reviewEndpoint, model, rules } = args;
	const designSnapshotsDir = snapshotsDir || DEFAULT_DESIGN_SNAPSHOT_DIR;
	for (const cssPath of customStyles) {
		if (!fs.existsSync(cssPath)) {
			throw new Error(
				`Could not find CSS file at path ${cssPath}. This file is required to correctly render your snapshots with your custom files.`,
			);
		}
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
		/**
		 * Make sure that the received element in `expect(...)` is an HTMLElement
		 * Run at different viewport sizes by using the `atSize` parameter
		 * Debug what's happening by using the `log` parameter to set different log levels
		 */
		async toPassDesignReview(
			received: unknown,
			unsafeParams?: DesignReviewRun,
		): Promise<jest.CustomMatcherResult> {
			const { data: params, error: runValidationError } =
				DesignReviewRunSchema.safeParse(unsafeParams);
			if (runValidationError) {
				return {
					pass: false,
					message: () =>
						runValidationError.errors.map((e) => e.message).join("\n"),
				};
			}

			const snapshotIdentifier = getSnapshotIdentifier(
				expect.getState(),
				params,
			);
			const logger = getLogger(params?.log);

			const snapshotPath = path.join(
				designSnapshotsDir,
				`${snapshotIdentifier}.md`,
			);
			logger.debug(`Snapshot path: ${snapshotPath}`);

			const snapshotFileExists = fs.existsSync(snapshotPath);
			if (snapshotFileExists)
				logger.debug("Snapshot file exists, pulling existing data");
			else logger.debug("Snapshot file does not exist, creating new snapshot");

			if (!elementIsHTMLElement(received)) {
				const errorMessage =
					"Received invalid value for element. Make sure that you pass a HTMLElement object into your expect call! This should look like:\nconst { container } = render(...);\nexpect(container).toPassDesignReview();";
				logger.error(errorMessage);
				return { pass: false, message: () => errorMessage };
			}

			const existingSnapshotFileContent = fs.existsSync(snapshotPath) && fs.readFileSync(snapshotPath, "utf8");
			const existingSnapshot: Partial<ReviewResponse> = existingSnapshotFileContent ? markdownToReviewResponse(existingSnapshotFileContent) : {};

			if (existingSnapshot.contentHash === getContentHash(received.outerHTML)) {
				logger.debug(
					`Snapshot ${snapshotPath} already exists and has the same content hash. Skipping review. To force a review, pass the option { forceReview: true } to your expect call.`,
				);
				return {
					pass: !!existingSnapshot.pass,
					message: () =>
						existingSnapshot.pass
							? "Snapshot passed design review"
							: `Snapshot failed design review.\n${existingSnapshot.explanation}\n\nTo override this, update the value of pass to true in ${snapshotPath}`,
				};
			}

			if (!model?.modelName || !model?.key) {
				throw new Error(
					process.env.CI
						? "vslint is running in a CI environment but the design snapshot does not exist for this test. vslint should never generate snapshots in CI as this could cause unintended model usage. Make sure to run this test locally and commit the results so re-review doesn't happen in CI."
						: "Component changed but can't re-run review as model name and key are not correctly set in `extendExpectDesignReviewer`. If you are setting the model key with an environment variable, make sure that `process.env.OPENAI_API_KEY` or `process.env.GEMINI_API_KEY` is set by running export OPENAI_API_KEY=...",
				);
			}

			const viewport = getViewportSize(params);
			logger.debug(`Viewport: ${JSON.stringify(viewport)}`);

			let response: AxiosResponse<ReviewResponse, ReviewRequest>;

			try {
				logger.debug("Sending request to review endpoint");
				const requestData: ReviewRequest = {
					content: received.outerHTML,
					stylesheets,
					rules: rules || DEFAULT_RULES,
					model,
					options: {
						viewport,
					},
					testDetails: {
						name: expect.getState().currentTestName || "",
					}
				};
				response = await axios.post(reviewEndpoint || DEFAULT_REVIEW_ENDPOINT, requestData);
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
			const { content, explanation, pass, ...violations } = response.data;
			logger.debug(`Review result: ${JSON.stringify(violations, null, 2)}. Explanation: ${explanation}`);

			const imageSnapshotPath = path.join(
				designSnapshotsDir,
				`${snapshotIdentifier}.png`,
			);
			fs.writeFileSync(imageSnapshotPath, Buffer.from(response.data.content, "base64"));

			const reviewMarkdown = reviewResponseToMarkdown(response.data, imageSnapshotPath);
			if (!existingSnapshotFileContent || getContentHash(reviewMarkdown) !== getContentHash(existingSnapshotFileContent)) {
				logger.debug(`Snapshot ${snapshotPath} has changed, updating`);
				fs.writeFileSync(snapshotPath, reviewMarkdown);
			} else {
				logger.debug(
					`Snapshot ${snapshotPath} has not changed, skipping update`,
				);
			}

			const message = () =>
				pass
					? "Automated review successful"
					: `Design review failed: ${explanation}\n\nTo override this, update the value of pass to true in ${snapshotPath}`;
			return {
				message,
				pass,
			};
		},
	};
};
