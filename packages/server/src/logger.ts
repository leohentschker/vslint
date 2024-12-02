import winston from "winston";

const customFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

let _LOGGER: null | winston.Logger = null;
export const getLogger = (
  logInput?: "debug" | "info" | "warning" | "error" | winston.Logger,
) => {
  if (!logInput || typeof logInput === "string") {
    if (!_LOGGER) {
      _LOGGER = winston.createLogger({
        level: logInput || "info",
        format: winston.format.combine(
          winston.format.timestamp(),
          customFormat,
        ),
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
