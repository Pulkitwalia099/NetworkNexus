import type { Express } from "express";
import { createServer, type Server } from "http";
import { db, useMockData } from "@db";
import { contacts, meetings, tasks, interactions, contactConnections } from "@db/schema";
import { eq, like, desc, and, or } from "drizzle-orm";
import { createObjectCsvStringifier } from "csv-writer";
import { parse } from "csv-parse/sync";
import { sql } from 'drizzle-orm/sql';
import { mockDataService } from "./utils/mock-data";
import logger from "./utils/logger";

export function registerRoutes(app: Express): Server {
  // Check server health
  app.get("/api/health", (_req, res) => {
    res.json({ 
      status: "ok",
      mock: useMockData
    });
  });

  // ################## CONTACTS API ##################
  app.get("/api/contacts", async (req, res) => {
    try {
      const searchTerm = req.query.search as string;
      
      if (useMockData) {
        // Use mock data
        const results = mockDataService.getContacts(searchTerm);
        return res.json(results);
      }

      // Use database
      const results = await db.query.contacts.findMany({
        orderBy: desc(contacts.updatedAt),
        where: searchTerm ? like(contacts.name, `%${searchTerm}%`) : undefined,
      });
      res.json(results);
    } catch (error) {
      logger.error("Error fetching contacts:", { error });
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      if (useMockData) {
        // Use mock data
        const contact = mockDataService.createContact(req.body);
        return res.json(contact);
      }

      // Use database
      const contact = await db.insert(contacts)
        .values({
          ...req.body,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      res.json(contact[0]);
    } catch (error) {
      logger.error("Error creating contact:", { error });
      res.status(500).json({ error: "Failed to create contact" });
    }
  });

  app.put("/api/contacts/:id", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      
      if (useMockData) {
        // Use mock data
        const contact = mockDataService.updateContact(contactId, req.body);
        if (!contact) {
          return res.status(404).json({ error: "Contact not found" });
        }
        return res.json(contact);
      }

      // Use database
      const contact = await db.update(contacts)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(contacts.id, contactId))
        .returning();
      
      if (!contact.length) {
        return res.status(404).json({ error: "Contact not found" });
      }
      
      res.json(contact[0]);
    } catch (error) {
      logger.error("Error updating contact:", { error });
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      
      if (useMockData) {
        // Use mock data
        const contact = mockDataService.deleteContact(contactId);
        if (!contact) {
          return res.status(404).json({ error: "Contact not found" });
        }
        return res.json(contact);
      }

      // Use database
      const contact = await db.delete(contacts)
        .where(eq(contacts.id, contactId))
        .returning();
      
      if (!contact.length) {
        return res.status(404).json({ error: "Contact not found" });
      }
      
      res.json(contact[0]);
    } catch (error) {
      logger.error("Error deleting contact:", { error });
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  app.get("/api/contacts/export", async (req, res) => {
    try {
      const format = req.query.format as string || 'json';
      let results;
      
      if (useMockData) {
        // Use mock data
        results = mockDataService.getContacts();
      } else {
        // Use database
        results = await db.query.contacts.findMany({
          orderBy: desc(contacts.updatedAt),
        });
      }

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
      logger.error("Error exporting contacts:", { error });
      res.status(500).json({ error: "Failed to export contacts" });
    }
  });

  app.post("/api/contacts/import", async (req, res) => {
    try {
      const { data, format } = req.body;
      let contactsList;

      if (format === 'csv') {
        contactsList = parse(data, {
          columns: true,
          skip_empty_lines: true
        });
      } else {
        contactsList = JSON.parse(data);
      }

      if (useMockData) {
        // Use mock data
        const inserted = contactsList.map((contact: any) => {
          return mockDataService.createContact({
            ...contact,
          });
        });
        return res.json(inserted);
      }

      // Use database
      const inserted = await db.insert(contacts)
        .values(contactsList.map((contact: any) => ({
          ...contact,
          createdAt: new Date(),
          updatedAt: new Date(),
        })))
        .returning();

      res.json(inserted);
    } catch (error) {
      logger.error("Error importing contacts:", { error });
      res.status(500).json({ error: "Failed to import contacts" });
    }
  });

  // ################## MEETINGS API ##################
  app.get("/api/meetings", async (_req, res) => {
    try {
      if (useMockData) {
        // Use mock data
        const results = mockDataService.getMeetings();
        return res.json(results);
      }

      // Use database
      const results = await db.query.meetings.findMany({
        orderBy: desc(meetings.date),
      });
      res.json(results);
    } catch (error) {
      logger.error("Error fetching meetings:", { error });
      res.status(500).json({ error: "Failed to fetch meetings" });
    }
  });

  app.post("/api/meetings", async (req, res) => {
    try {
      const meetingData = {
        ...req.body,
        date: new Date(req.body.date), // Ensure date is converted to a Date object
      };

      if (useMockData) {
        // Use mock data
        const meeting = mockDataService.createMeeting(meetingData);
        return res.json(meeting);
      }

      // Use database
      const meeting = await db.insert(meetings)
        .values({
          ...meetingData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      res.json(meeting[0]);
    } catch (error) {
      logger.error("Error creating meeting:", { error });
      res.status(500).json({ error: "Failed to create meeting" });
    }
  });

  app.put("/api/meetings/:id", async (req, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const meetingData = {
        ...req.body,
        date: new Date(req.body.date),
      };

      if (useMockData) {
        // Use mock data
        const meeting = mockDataService.updateMeeting(meetingId, meetingData);
        if (!meeting) {
          return res.status(404).json({ error: "Meeting not found" });
        }
        return res.json(meeting);
      }

      // Use database
      const meeting = await db.update(meetings)
        .set({
          ...meetingData,
          updatedAt: new Date(),
        })
        .where(eq(meetings.id, meetingId))
        .returning();

      if (!meeting.length) {
        return res.status(404).json({ error: "Meeting not found" });
      }

      res.json(meeting[0]);
    } catch (error) {
      logger.error("Error updating meeting:", { error });
      res.status(500).json({ error: "Failed to update meeting" });
    }
  });

  app.delete("/api/meetings/:id", async (req, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      logger.info(`API: Attempting to delete meeting with ID: ${meetingId}`);
      
      if (isNaN(meetingId)) {
        logger.error(`API: Invalid meeting ID: ${req.params.id}`);
        return res.status(400).json({ error: "Invalid meeting ID" });
      }
      
      if (useMockData) {
        // Use mock data
        const meeting = mockDataService.deleteMeeting(meetingId);
        if (!meeting) {
          logger.error(`API: Meeting with ID ${meetingId} not found`);
          return res.status(404).json({ error: "Meeting not found" });
        }
        
        logger.info(`API: Successfully deleted meeting with mock data`, { meeting });
        return res.json(meeting);
      }
      
      // First check if the meeting exists in the database
      const existingMeeting = await db.query.meetings.findFirst({
        where: eq(meetings.id, meetingId)
      });
      
      if (!existingMeeting) {
        logger.error(`API: Meeting with ID ${meetingId} not found`);
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      logger.info(`API: Found meeting to delete:`, { meeting: existingMeeting });
      
      // Proceed with deletion from database
      const meeting = await db.delete(meetings)
        .where(eq(meetings.id, meetingId))
        .returning();

      logger.info(`API: Successfully deleted meeting from database`, { meeting: meeting[0] });
      res.json(meeting[0]);
    } catch (error) {
      logger.error("API: Error deleting meeting:", { error });
      res.status(500).json({ 
        error: "Failed to delete meeting", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // ################## TASKS API ##################
  app.get("/api/tasks", async (_req, res) => {
    try {
      if (useMockData) {
        // Use mock data
        const results = mockDataService.getTasks();
        return res.json(results);
      }

      // Use database
      const results = await db.query.tasks.findMany({
        orderBy: desc(tasks.dueDate),
      });
      res.json(results);
    } catch (error) {
      logger.error("Error fetching tasks:", { error });
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      if (useMockData) {
        // Use mock data
        const task = mockDataService.createTask(req.body);
        return res.json(task);
      }

      // Use database
      const task = await db.insert(tasks)
        .values({
          ...req.body,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      res.json(task[0]);
    } catch (error) {
      logger.error("Error creating task:", { error });
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      
      if (useMockData) {
        // Use mock data
        const task = mockDataService.updateTask(taskId, req.body);
        if (!task) {
          return res.status(404).json({ error: "Task not found" });
        }
        return res.json(task);
      }

      // Use database
      const task = await db.update(tasks)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, taskId))
        .returning();
      
      if (!task.length) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.json(task[0]);
    } catch (error) {
      logger.error("Error updating task:", { error });
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      
      if (useMockData) {
        // Use mock data
        const task = mockDataService.deleteTask(taskId);
        if (!task) {
          return res.status(404).json({ error: "Task not found" });
        }
        return res.json(task);
      }

      // Use database
      const task = await db.delete(tasks)
        .where(eq(tasks.id, taskId))
        .returning();
      
      if (!task.length) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.json(task[0]);
    } catch (error) {
      logger.error("Error deleting task:", { error });
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // ################## INTERACTIONS API ##################
  app.get("/api/contacts/interactions", async (_req, res) => {
    try {
      if (useMockData) {
        // Use mock data
        const results = mockDataService.getInteractions();
        return res.json(results);
      }

      // Use database
      const results = await db.query.interactions.findMany({
        orderBy: desc(interactions.date),
      });
      res.json(results);
    } catch (error) {
      logger.error("Error fetching interactions:", { error });
      res.status(500).json({ error: "Failed to fetch interactions" });
    }
  });

  app.post("/api/contacts/interactions", async (req, res) => {
    try {
      if (useMockData) {
        // Use mock data
        const interaction = mockDataService.createInteraction(req.body);
        return res.json(interaction);
      }

      // Use database
      const interaction = await db.insert(interactions)
        .values({
          ...req.body,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      res.json(interaction[0]);
    } catch (error) {
      logger.error("Error creating interaction:", { error });
      res.status(500).json({ error: "Failed to create interaction" });
    }
  });

  app.put("/api/contacts/interactions/:id", async (req, res) => {
    try {
      const interactionId = parseInt(req.params.id);
      
      if (useMockData) {
        // Use mock data
        const interaction = mockDataService.updateInteraction(interactionId, req.body);
        if (!interaction) {
          return res.status(404).json({ error: "Interaction not found" });
        }
        return res.json(interaction);
      }

      // Use database
      const interaction = await db.update(interactions)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(interactions.id, interactionId))
        .returning();
      
      if (!interaction.length) {
        return res.status(404).json({ error: "Interaction not found" });
      }
      
      res.json(interaction[0]);
    } catch (error) {
      logger.error("Error updating interaction:", { error });
      res.status(500).json({ error: "Failed to update interaction" });
    }
  });

  app.delete("/api/contacts/interactions/:id", async (req, res) => {
    try {
      const interactionId = parseInt(req.params.id);
      
      if (useMockData) {
        // Use mock data
        const interaction = mockDataService.deleteInteraction(interactionId);
        if (!interaction) {
          return res.status(404).json({ error: "Interaction not found" });
        }
        return res.json(interaction);
      }

      // Use database
      const interaction = await db.delete(interactions)
        .where(eq(interactions.id, interactionId))
        .returning();
      
      if (!interaction.length) {
        return res.status(404).json({ error: "Interaction not found" });
      }
      
      res.json(interaction[0]);
    } catch (error) {
      logger.error("Error deleting interaction:", { error });
      res.status(500).json({ error: "Failed to delete interaction" });
    }
  });

  // ################## CONTACT TASKS API ##################
  app.get("/api/contacts/tasks", async (_req, res) => {
    try {
      if (useMockData) {
        // Use mock data
        const results = mockDataService.getContactTasks();
        return res.json(results);
      }

      // Use database
      const results = await db.query.tasks.findMany({
        where: sql`contact_id IS NOT NULL`,
        orderBy: desc(tasks.dueDate),
      });
      res.json(results);
    } catch (error) {
      logger.error("Error fetching contact tasks:", { error });
      res.status(500).json({ error: "Failed to fetch contact tasks" });
    }
  });

  // ################## GROUPS API ##################
  app.get("/api/groups", async (_req, res) => {
    try {
      if (useMockData) {
        // Use mock data
        const results = mockDataService.getGroups();
        return res.json(results);
      }

      // Use database
      const result = await db.execute(sql`
        SELECT * FROM groups 
        ORDER BY name ASC
      `);
      res.json(result.rows);
    } catch (error) {
      logger.error("Error fetching groups:", { error });
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  app.post("/api/contacts/groups/create", async (req, res) => {
    try {
      const { group } = req.body;

      if (useMockData) {
        // Use mock data
        const result = mockDataService.createGroup(group);
        if (!result) {
          return res.status(400).json({ error: "Group already exists" });
        }
        return res.json({ success: true, group: result });
      }

      // Use database
      const result = await db.execute(
        sql`INSERT INTO groups (name) VALUES (${group}) RETURNING *`
      );

      res.json({ success: true, group: result.rows[0] });
    } catch (error) {
      logger.error("Error creating group:", { error });
      res.status(500).json({ error: "Failed to create group" });
    }
  });

  app.post("/api/contacts/groups/update", async (req, res) => {
    try {
      const { oldGroup, newGroup } = req.body;

      if (useMockData) {
        // Use mock data
        const result = mockDataService.updateGroup(oldGroup, newGroup);
        if (!result) {
          return res.status(404).json({ error: "Group not found" });
        }
        return res.json({ success: true });
      }

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
      logger.error("Error updating contact groups:", { error });
      res.status(500).json({ error: "Failed to update contact groups" });
    }
  });

  app.post("/api/contacts/groups/delete", async (req, res) => {
    try {
      const { group } = req.body;

      if (useMockData) {
        // Use mock data
        const result = mockDataService.deleteGroup(group);
        if (!result) {
          return res.status(404).json({ error: "Group not found" });
        }
        return res.json({ success: true });
      }

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
      logger.error("Error deleting group:", { error });
      res.status(500).json({ error: "Failed to delete group" });
    }
  });

  // ################## CONNECTION API ##################
  app.get("/api/connections", async (_req, res) => {
    try {
      if (useMockData) {
        // Use mock data
        const results = mockDataService.getConnections();
        return res.json(results);
      }

      // Use database
      const results = await db.query.contactConnections.findMany({
        with: {
          sourceContact: true,
          targetContact: true,
        },
      });
      res.json(results);
    } catch (error) {
      logger.error("Error fetching all connections:", { error });
      res.status(500).json({ error: "Failed to fetch connections" });
    }
  });

  app.get("/api/contacts/:id/connections", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      
      if (useMockData) {
        // Use mock data
        const results = mockDataService.getConnectionsForContact(contactId);
        return res.json(results);
      }

      // Use database
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
      logger.error("Error fetching contact connections:", { error });
      res.status(500).json({ error: "Failed to fetch contact connections" });
    }
  });

  app.post("/api/contacts/connections", async (req, res) => {
    try {
      if (useMockData) {
        // Use mock data
        const connection = mockDataService.createConnection(req.body);
        return res.json(connection);
      }

      // Use database
      const connection = await db.insert(contactConnections)
        .values({
          ...req.body,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      res.json(connection[0]);
    } catch (error) {
      logger.error("Error creating contact connection:", { error });
      res.status(500).json({ error: "Failed to create contact connection" });
    }
  });

  app.put("/api/contacts/connections/:id", async (req, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      
      if (useMockData) {
        // Use mock data
        const connection = mockDataService.updateConnection(connectionId, req.body);
        if (!connection) {
          return res.status(404).json({ error: "Connection not found" });
        }
        return res.json(connection);
      }

      // Use database
      const connection = await db.update(contactConnections)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(contactConnections.id, connectionId))
        .returning();
      
      if (!connection.length) {
        return res.status(404).json({ error: "Connection not found" });
      }
      
      res.json(connection[0]);
    } catch (error) {
      logger.error("Error updating contact connection:", { error });
      res.status(500).json({ error: "Failed to update contact connection" });
    }
  });

  app.delete("/api/contacts/connections/:id", async (req, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      
      if (useMockData) {
        // Use mock data
        const connection = mockDataService.deleteConnection(connectionId);
        if (!connection) {
          return res.status(404).json({ error: "Connection not found" });
        }
        return res.json(connection);
      }

      // Use database
      const connection = await db.delete(contactConnections)
        .where(eq(contactConnections.id, connectionId))
        .returning();
      
      if (!connection.length) {
        return res.status(404).json({ error: "Connection not found" });
      }
      
      res.json(connection[0]);
    } catch (error) {
      logger.error("Error deleting contact connection:", { error });
      res.status(500).json({ error: "Failed to delete contact connection" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}