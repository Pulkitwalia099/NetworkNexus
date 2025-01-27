import { pgTable, text, serial, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  title: text("title"),
  avatar: text("avatar"),
  notes: text("notes"),
  group: text("group"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  location: text("location"),
  status: text("status").default("scheduled"),
  contactId: integer("contact_id").references(() => contacts.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  priority: text("priority").default("medium"),
  status: text("status").default("pending"),
  category: text("category"),
  contactId: integer("contact_id").references(() => contacts.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const contactRelations = relations(contacts, ({ many }) => ({
  meetings: many(meetings),
  tasks: many(tasks)
}));

export const meetingRelations = relations(meetings, ({ one }) => ({
  contact: one(contacts, {
    fields: [meetings.contactId],
    references: [contacts.id]
  })
}));

export const taskRelations = relations(tasks, ({ one }) => ({
  contact: one(contacts, {
    fields: [tasks.contactId],
    references: [contacts.id]
  })
}));

// Schemas
export type Contact = typeof contacts.$inferSelect;
export type Meeting = typeof meetings.$inferSelect;
export type Task = typeof tasks.$inferSelect;
