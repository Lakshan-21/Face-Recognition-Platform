import { pgTable, text, serial, timestamp, jsonb, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const faceRegistrations = pgTable("face_registrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role"),
  department: text("department"),
  faceEncoding: jsonb("face_encoding").notNull(),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  isActive: integer("is_active").default(1).notNull(),
});

export const recognitionEvents = pgTable("recognition_events", {
  id: serial("id").primaryKey(),
  personId: integer("person_id").references(() => faceRegistrations.id),
  personName: text("person_name"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  isRecognized: integer("is_recognized").notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  response: text("response").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  level: text("level").notNull(),
  message: text("message").notNull(),
  module: text("module").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: jsonb("metadata"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFaceRegistrationSchema = createInsertSchema(faceRegistrations).pick({
  name: true,
  role: true,
  department: true,
  faceEncoding: true,
});

export const insertRecognitionEventSchema = createInsertSchema(recognitionEvents).pick({
  personId: true,
  personName: true,
  confidence: true,
  isRecognized: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  message: true,
  response: true,
});

export const insertSystemLogSchema = createInsertSchema(systemLogs).pick({
  level: true,
  message: true,
  module: true,
  metadata: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type FaceRegistration = typeof faceRegistrations.$inferSelect;
export type InsertFaceRegistration = z.infer<typeof insertFaceRegistrationSchema>;

export type RecognitionEvent = typeof recognitionEvents.$inferSelect;
export type InsertRecognitionEvent = z.infer<typeof insertRecognitionEventSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type SystemLog = typeof systemLogs.$inferSelect;
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;
