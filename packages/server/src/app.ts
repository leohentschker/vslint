import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { renderDom } from ".";
import { logger } from "./logger";
import { runReview } from "./review";
import { RenderRequestSchema } from "./types";

const port = process.env.PORT || 8080;
const app = express();
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());

app.post("/api/v1/design-review", async (req, res) => {
	logger.info("Initiating request...");
	const {
		success: parseSuccess,
		data: reviewRequest,
		error: parseError,
	} = RenderRequestSchema.safeParse(req.body);
	if (!parseSuccess) {
		logger.error(`Failed to parse request: ${parseError.message}`);
		return res.status(400).json({
			error: "Invalid request",
			message: parseError.message,
		});
	}
	const { response: renderResponse, error: renderError } =
		await renderDom(reviewRequest);
	if (renderError) {
		logger.error(`Failed to render container ${renderError}`);
		return res.status(500).json({
			error: "Failed to render",
			message: renderError.message,
		});
	}

	const { response: reviewResponse, error: reviewError } = await runReview(
		reviewRequest,
		renderResponse,
		"image/png",
	);
	if (reviewError) {
		logger.error(`Failed to run automated design review: ${reviewError}`);
		return res.status(500).json({
			error: "Failed to review",
			message: reviewError.message,
		});
	}
	res.json({
		...reviewResponse,
		rendering: Buffer.from(renderResponse).toString("base64"),
	});
});

app.listen(port, () => {
	logger.info(`Listening on port ${port}`);
});
