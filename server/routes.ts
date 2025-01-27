import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { contacts, meetings, tasks } from "@db/schema";
import { eq, like, desc } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Check server health
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Contacts API
  app.get("/api/contacts", async (req, res) => {
    try {
      const searchTerm = req.query.search as string;
      let query = db.select().from(contacts);

      if (searchTerm) {
        query = query.where(like(contacts.name, `%${searchTerm}%`));
      }

      const results = await query.orderBy(desc(contacts.updatedAt));
      res.json(results);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const contact = await db.insert(contacts).values(req.body).returning();
      res.json(contact[0]);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(500).json({ error: "Failed to create contact" });
    }
  });

  app.put("/api/contacts/:id", async (req, res) => {
    try {
      const contact = await db
        .update(contacts)
        .set(req.body)
        .where(eq(contacts.id, parseInt(req.params.id)))
        .returning();
      res.json(contact[0]);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  // Meetings API
  app.get("/api/meetings", async (_req, res) => {
    try {
      const results = await db.select().from(meetings).orderBy(desc(meetings.date));
      res.json(results);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      res.status(500).json({ error: "Failed to fetch meetings" });
    }
  });

  app.post("/api/meetings", async (req, res) => {
    try {
      const meeting = await db.insert(meetings).values(req.body).returning();
      res.json(meeting[0]);
    } catch (error) {
      console.error("Error creating meeting:", error);
      res.status(500).json({ error: "Failed to create meeting" });
    }
  });

  // Tasks API 
  app.get("/api/tasks", async (_req, res) => {
    try {
      const results = await db.select().from(tasks).orderBy(desc(tasks.dueDate));
      res.json(results);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const task = await db.insert(tasks).values(req.body).returning();
      res.json(task[0]);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const task = await db
        .update(tasks)
        .set(req.body)
        .where(eq(tasks.id, parseInt(req.params.id)))
        .returning();
      res.json(task[0]);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}