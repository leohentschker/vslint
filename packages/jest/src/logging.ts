import winston from "winston";
import type { DesignReviewRun } from "./types";

let _LOGGER: null | winston.Logger = null;

export const getLogger = (logInput?: DesignReviewRun["log"]) => {
  if (!logInput || typeof logInput === "string") {
    if (!_LOGGER) {
      _LOGGER = winston.createLogger({
        level: logInput || "info",
        transports: [new winston.transports.Console()],
      });
    }
    return _LOGGER;
  }
  return logInput;
};

export const setLogLevel = (level: "info" | "debug") => {
  const logger = getLogger();
  logger.level = level;
};
