import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import logger, { requestLogger, errorHandler } from "./utils/logger";
import { randomUUID } from "crypto";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add request ID to each request
app.use((req: Request, _res: Response, next: NextFunction) => {
  req.id = randomUUID();
  next();
});

// Request logging middleware
app.use(requestLogger);

(async () => {
  const server = registerRoutes(app);

  // Error handling middleware
  app.use(errorHandler);

  // Setup Vite or serve static files
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start server
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    logger.info(`Server started`, {
      port: PORT,
      env: app.get("env"),
      nodeVersion: process.version,
    });
  });
})().catch((err) => {
  logger.error("Failed to start server", { error: err });
  process.exit(1);
});