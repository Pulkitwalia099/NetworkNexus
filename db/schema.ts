import { pgTable, text, serial, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

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
  tags: jsonb("tags").default([]).notNull(),
  // Add social media fields
  linkedinUrl: text("linkedin_url"),
  twitterHandle: text("twitter_handle"),
  githubUsername: text("github_username"),
  // Store additional social profiles as JSON
  socialProfiles: jsonb("social_profiles").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contactConnections = pgTable("contact_connections", {
  id: serial("id").primaryKey(),
  sourceContactId: integer("source_contact_id").references(() => contacts.id).notNull(),
  targetContactId: integer("target_contact_id").references(() => contacts.id).notNull(),
  relationshipType: text("relationship_type").notNull(), 
  tags: jsonb("tags").default([]).notNull(), 
  notes: text("notes"),
  strength: integer("strength").default(1), 
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  type: text("type").notNull(), 
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull().defaultNow(),
  outcome: text("outcome"),
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
  tags: jsonb("tags").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contactRelations = relations(contacts, ({ many }) => ({
  meetings: many(meetings),
  tasks: many(tasks),
  interactions: many(interactions),
  sourceConnections: many(contactConnections, { relationName: "sourceContact" }),
  targetConnections: many(contactConnections, { relationName: "targetContact" }),
}));

export const contactConnectionRelations = relations(contactConnections, ({ one }) => ({
  sourceContact: one(contacts, {
    fields: [contactConnections.sourceContactId],
    references: [contacts.id],
    relationName: "sourceContact"
  }),
  targetContact: one(contacts, {
    fields: [contactConnections.targetContactId],
    references: [contacts.id],
    relationName: "targetContact"
  }),
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

export const interactionRelations = relations(interactions, ({ one }) => ({
  contact: one(contacts, {
    fields: [interactions.contactId],
    references: [contacts.id]
  })
}));

export type Contact = typeof contacts.$inferSelect;
export type ContactConnection = typeof contactConnections.$inferSelect;
export type Meeting = typeof meetings.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Interaction = typeof interactions.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;