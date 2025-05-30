import { 
  users, 
  faceRegistrations, 
  recognitionEvents, 
  chatMessages, 
  systemLogs,
  type User, 
  type InsertUser,
  type FaceRegistration,
  type InsertFaceRegistration,
  type RecognitionEvent,
  type InsertRecognitionEvent,
  type ChatMessage,
  type InsertChatMessage,
  type SystemLog,
  type InsertSystemLog
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte } from "drizzle-orm";

interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  
  // Face registration methods
  createFaceRegistration(data: InsertFaceRegistration): Promise<FaceRegistration>;
  getAllFaceRegistrations(): Promise<FaceRegistration[]>;
  getRecentFaceRegistrations(limit: number): Promise<FaceRegistration[]>;
  getRegistrationCount(): Promise<number>;
  
  // Recognition event methods
  createRecognitionEvent(data: InsertRecognitionEvent): Promise<RecognitionEvent>;
  getRecentRecognitionEvents(limit: number): Promise<RecognitionEvent[]>;
  getRecognitionStats(): Promise<any>;
  getTodayRecognitionCount(): Promise<number>;
  
  // Chat methods
  createChatMessage(data: InsertChatMessage): Promise<ChatMessage>;
  getChatHistory(limit: number): Promise<ChatMessage[]>;
  
  // System log methods
  createSystemLog(data: InsertSystemLog): Promise<SystemLog>;
  getSystemLogs(level: string, module: string, limit: number): Promise<SystemLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Face registration methods
  async createFaceRegistration(data: InsertFaceRegistration): Promise<FaceRegistration> {
    const [registration] = await db
      .insert(faceRegistrations)
      .values(data)
      .returning();
    return registration;
  }

  async getAllFaceRegistrations(): Promise<FaceRegistration[]> {
    return await db.select().from(faceRegistrations).where(eq(faceRegistrations.isActive, 1));
  }

  async getRecentFaceRegistrations(limit: number): Promise<FaceRegistration[]> {
    return await db
      .select()
      .from(faceRegistrations)
      .where(eq(faceRegistrations.isActive, 1))
      .orderBy(desc(faceRegistrations.registeredAt))
      .limit(limit);
  }

  async getRegistrationCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(faceRegistrations)
      .where(eq(faceRegistrations.isActive, 1));
    return result.count;
  }

  // Recognition event methods
  async createRecognitionEvent(data: InsertRecognitionEvent): Promise<RecognitionEvent> {
    const [event] = await db
      .insert(recognitionEvents)
      .values(data)
      .returning();
    return event;
  }

  async getRecentRecognitionEvents(limit: number): Promise<RecognitionEvent[]> {
    return await db
      .select()
      .from(recognitionEvents)
      .orderBy(desc(recognitionEvents.detectedAt))
      .limit(limit);
  }

  async getRecognitionStats(): Promise<any> {
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(recognitionEvents);

    const [recognizedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(recognitionEvents)
      .where(eq(recognitionEvents.isRecognized, 1));

    const [unknownResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(recognitionEvents)
      .where(eq(recognitionEvents.isRecognized, 0));

    // Fix confidence calculation - convert string to number
    const [avgConfidenceResult] = await db
      .select({ avg: sql<number>`avg(cast(confidence as decimal))` })
      .from(recognitionEvents);

    return {
      totalDetections: totalResult.count || 0,
      recognizedFaces: recognizedResult.count || 0,
      unknownFaces: unknownResult.count || 0,
      averageConfidence: Math.round((avgConfidenceResult.avg || 0) * 100)
    };
  }

  async getTodayRecognitionCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(recognitionEvents)
      .where(gte(recognitionEvents.detectedAt, today));
    
    return result.count;
  }

  // Chat methods
  async createChatMessage(data: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(data)
      .returning();
    return message;
  }

  async getChatHistory(limit: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .orderBy(desc(chatMessages.timestamp))
      .limit(limit);
  }

  // System log methods
  async createSystemLog(data: InsertSystemLog): Promise<SystemLog> {
    const [log] = await db
      .insert(systemLogs)
      .values(data)
      .returning();
    return log;
  }

  async getSystemLogs(level: string, module: string, limit: number): Promise<SystemLog[]> {
    if (level !== 'all' && module !== 'all') {
      return await db
        .select()
        .from(systemLogs)
        .where(and(eq(systemLogs.level, level), eq(systemLogs.module, module)))
        .orderBy(desc(systemLogs.timestamp))
        .limit(limit);
    } else if (level !== 'all') {
      return await db
        .select()
        .from(systemLogs)
        .where(eq(systemLogs.level, level))
        .orderBy(desc(systemLogs.timestamp))
        .limit(limit);
    } else if (module !== 'all') {
      return await db
        .select()
        .from(systemLogs)
        .where(eq(systemLogs.module, module))
        .orderBy(desc(systemLogs.timestamp))
        .limit(limit);
    } else {
      return await db
        .select()
        .from(systemLogs)
        .orderBy(desc(systemLogs.timestamp))
        .limit(limit);
    }
  }
}

export const storage = new DatabaseStorage();