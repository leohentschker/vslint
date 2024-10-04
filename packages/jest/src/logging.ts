import winston from "winston";
import type { DesignReviewRun } from "./types";

export const getLogger = (logInput?: DesignReviewRun["log"]) => {
  if (!logInput || typeof logInput === "string") {
    return winston.createLogger({
      level: logInput || "info",
      transports: [new winston.transports.Console()],
    });
  }
  return logInput;
};
