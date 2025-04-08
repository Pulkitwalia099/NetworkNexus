import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";
import logger from "../server/utils/logger";

// Flag to track if we're using mock data
export const useMockData = !process.env.DATABASE_URL;

// Initialize database connection if DATABASE_URL is available
export const db = process.env.DATABASE_URL 
  ? drizzle({
      connection: process.env.DATABASE_URL,
      schema,
      ws: ws,
    })
  : null;

// Log which mode we're running in
if (useMockData) {
  console.log("DATABASE_URL not set. Using mock data for local development.");
  logger.info("Using mock data for local development (no DATABASE_URL found)", {
    context: "database",
    service: "mock-data"
  });
} else {
  console.log("Using PostgreSQL database.");
  logger.info("Connected to PostgreSQL database", {
    context: "database",
    service: "postgres"
  });
}
