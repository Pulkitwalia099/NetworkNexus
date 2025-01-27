import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { contacts, meetings, tasks } from "@db/schema";
import { eq, like, desc } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Contacts API
  app.get("/api/contacts", async (req, res) => {
    const searchTerm = req.query.search as string;
    let query = db.select().from(contacts);
    
    if (searchTerm) {
      query = query.where(like(contacts.name, `%${searchTerm}%`));
    }
    
    const results = await query.orderBy(desc(contacts.updatedAt));
    res.json(results);
  });

  app.post("/api/contacts", async (req, res) => {
    const contact = await db.insert(contacts).values(req.body).returning();
    res.json(contact[0]);
  });

  app.put("/api/contacts/:id", async (req, res) => {
    const contact = await db
      .update(contacts)
      .set(req.body)
      .where(eq(contacts.id, parseInt(req.params.id)))
      .returning();
    res.json(contact[0]);
  });

  // Meetings API
  app.get("/api/meetings", async (req, res) => {
    const results = await db.select().from(meetings).orderBy(desc(meetings.date));
    res.json(results);
  });

  app.post("/api/meetings", async (req, res) => {
    const meeting = await db.insert(meetings).values(req.body).returning();
    res.json(meeting[0]);
  });

  // Tasks API 
  app.get("/api/tasks", async (req, res) => {
    const results = await db.select().from(tasks).orderBy(desc(tasks.dueDate));
    res.json(results);
  });

  app.post("/api/tasks", async (req, res) => {
    const task = await db.insert(tasks).values(req.body).returning();
    res.json(task[0]);
  });

  app.put("/api/tasks/:id", async (req, res) => {
    const task = await db
      .update(tasks)
      .set(req.body)
      .where(eq(tasks.id, parseInt(req.params.id)))
      .returning();
    res.json(task[0]);
  });

  const httpServer = createServer(app);
  return httpServer;
}
