import chalk from "chalk";
import winston from "winston";

const customFormat = winston.format.printf(({ level, message, timestamp }) => {
  let logLevelColor: chalk.Chalk;

  switch (level) {
    case "error":
      logLevelColor = chalk.red.bold;
      break;
    case "warn":
      logLevelColor = chalk.yellow.bold;
      break;
    case "info":
      logLevelColor = chalk.blue.bold;
      break;
    case "debug":
      logLevelColor = chalk.green.bold;
      break;
    default:
      logLevelColor = chalk.white.bold;
  }

  return `${chalk.gray(timestamp)} ${logLevelColor(level)}: ${chalk.white(message)}`;
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
