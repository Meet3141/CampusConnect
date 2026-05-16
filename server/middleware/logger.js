/**
 * middleware/logger.js
 * Winston singleton logger for structured logging.
 * - Development: colorized console output
 * - Production:  console + rotating file transports
 */

import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, "../logs");

const { combine, timestamp, printf, colorize, errors } = winston.format;

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) =>
    stack ? `${timestamp} ${level}: ${message}\n${stack}` : `${timestamp} ${level}: ${message}`
  )
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json()
);

const isProd = process.env.NODE_ENV === "production";

const transports = [
  new winston.transports.Console({
    format: isProd ? prodFormat : devFormat,
  }),
];

if (isProd) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      format: prodFormat,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "app.log"),
      format: prodFormat,
    })
  );
}

const logger = winston.createLogger({
  level: isProd ? "info" : "debug",
  transports,
  exitOnError: false,
});

export default logger;
