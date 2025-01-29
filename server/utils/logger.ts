import { createLogger, format, transports, Logger } from "winston";
import { Request, Response, NextFunction } from "express";
import path from "path";

// Extend Express Request type to include ID
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

// Custom format for structured logging
const logFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.metadata(),
  format.json()
);

// Create the logger instance
const logger: Logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  defaultMeta: { service: "crm-service" },
  transports: [
    // Console transport for development
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, metadata }) => {
          const meta = metadata.stack ? `\n${metadata.stack}` : metadata.error || '';
          return `${timestamp} [${level}]: ${message}${meta}`;
        })
      ),
    }),
    // File transport for errors
    new transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
    }),
    // File transport for all logs
    new transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'combined.log') 
    }),
  ],
});

// Error handling middleware
export const errorHandler = (err: Error & { status?: number; statusCode?: number }, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log the error
  logger.error(message, {
    error: err,
    request: {
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query,
      body: req.body,
      headers: req.headers,
    },
  });

  // Don't expose internal server errors to client in production
  const clientMessage = process.env.NODE_ENV === "production" && status === 500
    ? "An unexpected error occurred"
    : message;

  res.status(status).json({
    status,
    message: clientMessage,
    requestId: req.id,
  });
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log request
  logger.info(`Incoming ${req.method} ${req.url}`, {
    requestId: req.id,
    method: req.method,
    url: req.url,
    query: req.query,
    headers: req.headers,
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';

    logger[level](`${req.method} ${req.url} ${res.statusCode} ${duration}ms`, {
      requestId: req.id,
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
    });
  });

  next();
};

// Custom error types
export class AppError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Export logger instance
export default logger;