import {
	Failure,
	Ok,
	type ReviewRequest,
	type ReviewResponse,
} from "@vslint/shared";
import OpenAI from "openai";
import { z } from "zod";
import { logger } from "../logger";

const OpenaiResponseSchema = z.object({
	explanation: z.string().optional(),
	fail: z.boolean(),
});

const getOpenaiClient = (modelConfig: ReviewRequest["model"]) => {
	if (!modelConfig.key) return Failure(new Error("OPENAI_API_KEY not set"));
	return Ok(new OpenAI({ apiKey: modelConfig.key }));
};

const BASE_OPENAI_SYSTEM_PROMPT = `
You are an AI assistant working as a senior designer to reviews website components and provide feedback on their design.

You take two inputs:
1. Rule: The rule to evaluate the component against.
2. Image: A screenshot of the component in Chrome.

You need to evaluate the component against the rule and provide feedback on the design to be run in a CI pipeline.

YOU ARE A SENIOR DESIGNER THAT CARES A LOT ABOUT DESIGN QUALITY AND DOES NOT MISS ANY DETAIL. WHEN YOU GIVE FEEDBACK IT SHOULD BE VERY DETAILED AND INCLUDE EXPLANATIONS IN THE CONTEXT OF THE SPECIFIC HTML PASSED IN.
`.trim();

const getChatCompletion = async (
	reviewRequest: ReviewRequest,
	rule: ReviewRequest["rules"][number],
	openai: OpenAI,
	base64image: string,
	mimeType: string,
) => {
	let completion: OpenAI.Chat.ChatCompletion;
	try {
		const userPrompt = `${BASE_OPENAI_SYSTEM_PROMPT}\n\nReturn in JSON format: { explanation: string; fail: boolean; }.\n\nHere is the rule you are evaluating:\n## ${rule.ruleid}\n${rule.description}`;
		logger.debug("Creating OpenAI chat completion");
		completion = await openai.chat.completions.create({
			model: reviewRequest.model.modelName,
			response_format: {
				type: "json_object",
			},
			temperature: 0,
			seed: 42,
			messages: [
				{
					role: "user",
					content: [
						{
							type: "image_url",
							image_url: {
								url: `data:${mimeType};base64,${base64image}`,
								detail: "high",
							},
						},
					],
				},
				{
					role: "system",
					content: userPrompt,
				},
			],
		});
	} catch (error) {
		logger.error(error);
		return Failure(error);
	}
	const result = completion.choices[0]?.message.content;
	if (!result) return Failure(new Error("No result from OpenAI"));
	const parsedResult = OpenaiResponseSchema.safeParse(JSON.parse(result));
	if (!parsedResult.success) {
		logger.error(parsedResult.error);
		return Failure(new Error("Failed to parse OpenAI response"));
	}
	return Ok({
		...parsedResult.data,
		rule,
	});
};

export const runOpenaiReview = async (
	renderRequest: ReviewRequest,
	imageBuffer: Buffer,
	mimeType: "image/png",
) => {
	const base64Content = imageBuffer.toString("base64");
	const { response: openai, error: clientError } = getOpenaiClient(
		renderRequest.model,
	);
	if (clientError) return Failure(clientError);

	const completionResults = await Promise.all(
		renderRequest.rules.map(async (rule) => {
			const { response: result, error: openaiError } = await getChatCompletion(
				renderRequest,
				rule,
				openai,
				base64Content,
				mimeType,
			);
			if (openaiError) return Failure(openaiError);
			return Ok(result);
		}),
	);

	const violations: ReviewResponse["violations"] = {};
	const failedExplanations = [];
	for (const {
		response: completion,
		error: completionError,
	} of completionResults) {
		if (completionError) return Failure(completionError);
		const {
			explanation: failExplanation,
			fail,
			rule: { ruleid, description: rule },
		} = completion;
		if (fail && failExplanation) {
			failedExplanations.push(failExplanation);
		}
		violations[ruleid] = { fail, rule };
	}
	const explanation = failedExplanations.length
		? failedExplanations.join("\n\n")
		: "Design review passed.";

	logger.debug(`OpenAI response: ${JSON.stringify(violations)}`);
	logger.debug(`OpenAI explanation: ${explanation}`);
	return Ok({ violations, explanation });
};
