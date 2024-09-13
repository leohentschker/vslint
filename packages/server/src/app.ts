import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { renderDom } from ".";
import { runReview } from "./review";
import { RenderRequestSchema } from "./types";

const port = process.env.PORT || 8080;
const app = express();
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());

app.post("/api/v1/design-review", async (req, res) => {
	console.log('Initiating request...');
	const {
		success: parseSuccess,
		data: reviewRequest,
		error: parseError,
	} = RenderRequestSchema.safeParse(req.body);
	if (!parseSuccess) {
		console.log(parseError, 'Failed to parse request');
		return res.status(400).json({
			error: "Invalid request",
			message: parseError.message,
		});
	}
	const { response: renderResponse, error: renderError } =
		await renderDom(reviewRequest);
	if (renderError) {
		console.log(renderError, 'Failed to render container');
		return res.status(500).json({
			error: "Failed to render",
			message: renderError.message,
		});
	}

	const { response: reviewResponse, error: reviewError } = await runReview(
		renderResponse,
		"image/png",
	);
	if (reviewError) {
		console.log(reviewError, 'Failed to run automated design review');
		return res.status(500).json({
			error: "Failed to review",
			message: reviewError.message,
		});
	}
	res.json(reviewResponse);
});

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
