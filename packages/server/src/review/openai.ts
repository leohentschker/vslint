import { Failure, Ok, type ReviewRequest } from "@vslint/shared";
import OpenAI from "openai";
import { logger } from "../logger";

const getOpenaiClient = (modelConfig: ReviewRequest["model"]) => {
	if (!modelConfig.key) return Failure(new Error("OPENAI_API_KEY not set"));
	return Ok(new OpenAI({ apiKey: modelConfig.key }));
};

const BASE_OPENAI_SYSTEM_PROMPT = `
You are an AI assistant working as a senior designer to review website designs and provide feedback in JSON format.
You review a rule and and an image. If the test fails the rule and is problematic, return true. If the test fails the rule, return false.
Always include a field called "explanation" in your response. If the test failed, explain why. If it passed, set this field to null.
YOU ARE A SENIOR DESIGNER THAT CARES A LOT ABOUT DESIGN QUALITY AND DOES NOT MISS ANY DETAIL.
`.trim();

const getChatCompletion = async (
	modelName: ReviewRequest["model"]["modelName"],
	rule: ReviewRequest["rules"][number],
	openai: OpenAI,
	base64image: string,
	mimeType: string,
) => {
	let completion: OpenAI.Chat.ChatCompletion;
	try {
		const userPrompt = `${BASE_OPENAI_SYSTEM_PROMPT}\n\nReturn in format: { explanation: string; ${rule.ruleid}: string | null; }.\n\nHere is the rule you are evaluating:\n## ${rule.ruleid}\n${rule.description}`;
		logger.debug("Creating OpenAI chat completion");
		completion = await openai.chat.completions.create({
			model: modelName,
			response_format: {
				type: "json_object",
			},
			temperature: 0,
			seed: 42,
			messages: [
				{
					role: "system",
					content: userPrompt,
				},
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
			],
		});
	} catch (error) {
		logger.error(error);
		return Failure(error);
	}
	const result = completion.choices[0]?.message.content;
	if (!result) return Failure(new Error("No result from OpenAI"));
	return Ok(JSON.parse(result));
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
				renderRequest.model.modelName,
				rule,
				openai,
				base64Content,
				mimeType,
			);
			if (openaiError) return Failure(openaiError);
			return Ok(result);
		}),
	);

	const results: Record<string, boolean | null | string> = {
		explanation: null,
	};
	for (const {
		response: completion,
		error: completionError,
	} of completionResults) {
		if (completionError) return Failure(completionError);
		for (const [key, value] of Object.entries(completion)) {
			if (key === "explanation" && !value) continue;
			results[key] = value as string;
		}
	}

	logger.debug(`OpenAI response: ${JSON.stringify(results)}`);
	return Ok(results);
};
