import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { contacts, meetings, tasks, interactions, contactConnections } from "@db/schema";
import { eq, like, desc, and, or } from "drizzle-orm";
import { createObjectCsvStringifier } from "csv-writer";
import { parse } from "csv-parse/sync";
import { sql } from 'drizzle-orm/sql';

export function registerRoutes(app: Express): Server {
  // Check server health
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Contacts API
  app.get("/api/contacts", async (req, res) => {
    try {
      const searchTerm = req.query.search as string;
      const results = await db.query.contacts.findMany({
        orderBy: desc(contacts.updatedAt),
        where: searchTerm ? like(contacts.name, `%${searchTerm}%`) : undefined,
      });
      res.json(results);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const contact = await db.insert(contacts)
        .values({
          ...req.body,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      res.json(contact[0]);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(500).json({ error: "Failed to create contact" });
    }
  });

  app.put("/api/contacts/:id", async (req, res) => {
    try {
      const contact = await db.update(contacts)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(contacts.id, parseInt(req.params.id)))
        .returning();
      res.json(contact[0]);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      const contact = await db.delete(contacts)
        .where(eq(contacts.id, parseInt(req.params.id)))
        .returning();
      res.json(contact[0]);
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  app.get("/api/contacts/export", async (req, res) => {
    try {
      const format = req.query.format as string || 'json';
      const results = await db.query.contacts.findMany({
        orderBy: desc(contacts.updatedAt),
      });

      if (format === 'csv') {
        const csvStringifier = createObjectCsvStringifier({
          header: [
            { id: 'name', title: 'Name' },
            { id: 'email', title: 'Email' },
            { id: 'phone', title: 'Phone' },
            { id: 'company', title: 'Company' },
            { id: 'title', title: 'Title' },
            { id: 'notes', title: 'Notes' },
            { id: 'group', title: 'Group' },
          ]
        });

        const csvString = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(results);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
        return res.send(csvString);
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=contacts.json');
      return res.json(results);
    } catch (error) {
      console.error("Error exporting contacts:", error);
      res.status(500).json({ error: "Failed to export contacts" });
    }
  });

  app.post("/api/contacts/import", async (req, res) => {
    try {
      const { data, format } = req.body;
      let contacts;

      if (format === 'csv') {
        contacts = parse(data, {
          columns: true,
          skip_empty_lines: true
        });
      } else {
        contacts = JSON.parse(data);
      }

      const inserted = await db.insert(contacts)
        .values(contacts.map((contact: any) => ({
          ...contact,
          createdAt: new Date(),
          updatedAt: new Date(),
        })))
        .returning();

      res.json(inserted);
    } catch (error) {
      console.error("Error importing contacts:", error);
      res.status(500).json({ error: "Failed to import contacts" });
    }
  });

  // Meetings API
  app.get("/api/meetings", async (_req, res) => {
    try {
      const results = await db.query.meetings.findMany({
        orderBy: desc(meetings.date),
      });
      res.json(results);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      res.status(500).json({ error: "Failed to fetch meetings" });
    }
  });

  app.post("/api/meetings", async (req, res) => {
    try {
      const meetingData = {
        ...req.body,
        date: new Date(req.body.date), // Ensure date is converted to a Date object
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const meeting = await db.insert(meetings)
        .values(meetingData)
        .returning();

      res.json(meeting[0]);
    } catch (error) {
      console.error("Error creating meeting:", error);
      res.status(500).json({ error: "Failed to create meeting" });
    }
  });

  app.put("/api/meetings/:id", async (req, res) => {
    try {
      const meetingData = {
        ...req.body,
        date: new Date(req.body.date),
        updatedAt: new Date(),
      };

      const meeting = await db.update(meetings)
        .set(meetingData)
        .where(eq(meetings.id, parseInt(req.params.id)))
        .returning();

      res.json(meeting[0]);
    } catch (error) {
      console.error("Error updating meeting:", error);
      res.status(500).json({ error: "Failed to update meeting" });
    }
  });

  // Tasks API 
  app.get("/api/tasks", async (_req, res) => {
    try {
      const results = await db.query.tasks.findMany({
        orderBy: desc(tasks.dueDate),
      });
      res.json(results);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const task = await db.insert(tasks)
        .values({
          ...req.body,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      res.json(task[0]);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const task = await db.update(tasks)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, parseInt(req.params.id)))
        .returning();
      res.json(task[0]);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  // Interactions API
  app.get("/api/contacts/:id/interactions", async (req, res) => {
    try {
      const results = await db.query.interactions.findMany({
        where: eq(interactions.contactId, parseInt(req.params.id)),
        orderBy: desc(interactions.date),
      });
      res.json(results);
    } catch (error) {
      console.error("Error fetching interactions:", error);
      res.status(500).json({ error: "Failed to fetch interactions" });
    }
  });

  app.post("/api/contacts/:id/interactions", async (req, res) => {
    try {
      const interaction = await db.insert(interactions)
        .values({
          ...req.body,
          contactId: parseInt(req.params.id),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      res.json(interaction[0]);
    } catch (error) {
      console.error("Error creating interaction:", error);
      res.status(500).json({ error: "Failed to create interaction" });
    }
  });

  // New route to get all interactions
  app.get("/api/interactions", async (_req, res) => {
    try {
      const results = await db.query.interactions.findMany({
        orderBy: desc(interactions.date),
      });
      res.json(results);
    } catch (error) {
      console.error("Error fetching interactions:", error);
      res.status(500).json({ error: "Failed to fetch interactions" });
    }
  });

  app.post("/api/contacts/groups/create", async (req, res) => {
    try {
      const { group } = req.body;

      // Insert the new group directly into the groups table
      const result = await db.execute(
        sql`INSERT INTO groups (name) VALUES (${group}) RETURNING *`
      );

      res.json({ success: true, group: result.rows[0] });
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ error: "Failed to create group" });
    }
  });

  app.get("/api/groups", async (_req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT * FROM groups 
        ORDER BY name ASC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  app.post("/api/contacts/groups/update", async (req, res) => {
    try {
      const { oldGroup, newGroup } = req.body;

      // First update the group name in the groups table
      await db.execute(
        sql`UPDATE groups SET name = ${newGroup}, updated_at = NOW() WHERE name = ${oldGroup}`
      );

      // Then update all contacts that reference this group
      const updatedContacts = await db.update(contacts)
        .set({ 
          group: newGroup,
          updatedAt: new Date()
        })
        .where(eq(contacts.group, oldGroup))
        .returning();

      res.json(updatedContacts);
    } catch (error) {
      console.error("Error updating contact groups:", error);
      res.status(500).json({ error: "Failed to update contact groups" });
    }
  });

  // Add this new endpoint just before the existing contact connections endpoints
  app.post("/api/contacts/groups/delete", async (req, res) => {
    try {
      const { group } = req.body;

      // First clear the group reference from all contacts
      await db.update(contacts)
        .set({ 
          group: null,
          updatedAt: new Date()
        })
        .where(eq(contacts.group, group));

      // Then delete the group from the groups table
      await db.execute(
        sql`DELETE FROM groups WHERE name = ${group}`
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({ error: "Failed to delete group" });
    }
  });

  app.get("/api/connections", async (_req, res) => {
    try {
      const results = await db.query.contactConnections.findMany({
        with: {
          sourceContact: true,
          targetContact: true,
        },
      });
      res.json(results);
    } catch (error) {
      console.error("Error fetching all connections:", error);
      res.status(500).json({ error: "Failed to fetch connections" });
    }
  });

  // Contact Connections API
  app.get("/api/contacts/:id/connections", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const results = await db.query.contactConnections.findMany({
        where: or(
          eq(contactConnections.sourceContactId, contactId),
          eq(contactConnections.targetContactId, contactId)
        ),
        with: {
          sourceContact: true,
          targetContact: true,
        },
      });
      res.json(results);
    } catch (error) {
      console.error("Error fetching contact connections:", error);
      res.status(500).json({ error: "Failed to fetch contact connections" });
    }
  });

  app.post("/api/contacts/connections", async (req, res) => {
    try {
      const connection = await db.insert(contactConnections)
        .values({
          ...req.body,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      res.json(connection[0]);
    } catch (error) {
      console.error("Error creating contact connection:", error);
      res.status(500).json({ error: "Failed to create contact connection" });
    }
  });

  app.put("/api/contacts/connections/:id", async (req, res) => {
    try {
      const connection = await db.update(contactConnections)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(contactConnections.id, parseInt(req.params.id)))
        .returning();
      res.json(connection[0]);
    } catch (error) {
      console.error("Error updating contact connection:", error);
      res.status(500).json({ error: "Failed to update contact connection" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}