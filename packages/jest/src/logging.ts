import winston from "winston";
import { DesignReviewParams } from "./types";

export const getLogger = (logInput?: DesignReviewParams["log"]) => {
	if (!logInput || typeof logInput === "string") {
		return winston.createLogger({
			level: logInput || "info",
			transports: [new winston.transports.Console()],
		});
	}
	return logInput;
};
