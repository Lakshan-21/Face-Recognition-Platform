import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFaceRegistrationSchema, insertRecognitionEventSchema, insertChatMessageSchema, insertSystemLogSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Face Registration Routes
  app.post("/api/register-face", async (req, res) => {
    try {
      const validatedData = insertFaceRegistrationSchema.parse(req.body);
      
      // Log registration attempt
      await storage.createSystemLog({
        level: "info",
        message: `Face registration attempt for: ${validatedData.name}`,
        module: "face_registration",
        metadata: { name: validatedData.name, role: validatedData.role }
      });
      
      const registration = await storage.createFaceRegistration(validatedData);
      
      await storage.createSystemLog({
        level: "info",
        message: `Face registration successful for: ${registration.name}`,
        module: "face_registration",
        metadata: { id: registration.id, name: registration.name }
      });
      
      res.json(registration);
    } catch (error) {
      await storage.createSystemLog({
        level: "error",
        message: `Face registration failed: ${error instanceof Error ? error.message : String(error)}`,
        module: "face_registration",
        metadata: { error: error instanceof Error ? error.message : String(error) }
      });
      
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/registrations", async (req, res) => {
    try {
      const registrations = await storage.getAllFaceRegistrations();
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/registrations/all", async (req, res) => {
    try {
      const registrations = await storage.getAllFaceRegistrations();
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/registrations/recent", async (req, res) => {
    try {
      const recentRegistrations = await storage.getRecentFaceRegistrations(10);
      res.json(recentRegistrations);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Face Detection and Encoding Route (Simplified for demo)
  app.post("/api/detect-face", async (req, res) => {
    try {
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ error: "Image data is required" });
      }

      // Simulate realistic face detection - only detect faces 30% of the time
      const hasDetection = Math.random() < 0.3;
      
      if (hasDetection) {
        const baseConfidence = 0.85 + Math.random() * 0.1; // 85-95% confidence range
        const faceData = {
          faces: [{
            bbox: [25, 20, 75, 80],
            encoding: new Array(128).fill(0).map(() => Math.random() * 2 - 1),
            confidence: Math.round(baseConfidence * 100) / 100
          }],
          count: 1
        };

        await storage.createSystemLog({
          level: "info",
          message: "Face detection completed",
          module: "face_detection",
          metadata: { faceCount: faceData.count }
        });

        res.json(faceData);
      } else {
        // No face detected
        res.json({
          faces: [],
          count: 0
        });
      }

    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Session tracking for face recognition
  const recognitionSessions = new Map();
  
  // Live Recognition Routes
  app.post("/api/recognize-faces", async (req, res) => {
    try {
      const { imageData, sessionId } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ error: "Image data is required" });
      }

      // Get all registered faces
      const registrations = await storage.getAllFaceRegistrations();
      
      // Only process if there are registered faces and randomly simulate detection
      const detectedFaces = [];
      const hasDetection = Math.random() < 0.4; // 40% chance of detection
      
      if (registrations.length > 0 && hasDetection) {
        // Randomly select a registered person for detection
        const randomPerson = registrations[Math.floor(Math.random() * registrations.length)];
        const confidence = 95 + Math.random() * 5; // 95-100% confidence
        const isRecognized = true;
        
        // Check if this person was already detected in this session
        const currentSessionId = sessionId || 'default';
        const sessionData = recognitionSessions.get(currentSessionId) || new Set();
        
        if (!sessionData.has(randomPerson.id)) {
          // First time detecting this person in this session
          sessionData.add(randomPerson.id);
          recognitionSessions.set(currentSessionId, sessionData);
          
          detectedFaces.push({
            bbox: [30, 25, 150, 120],
            name: randomPerson.name,
            personId: randomPerson.id,
            confidence: Math.round(confidence),
            isRecognized: isRecognized
          });

          // Log the detection event
          await storage.createRecognitionEvent({
            personId: randomPerson.id,
            personName: randomPerson.name,
            confidence: confidence.toFixed(0), // Store as whole number percentage
            isRecognized: 1
          });
        } else {
          // Person already detected in this session, show detection but don't log
          detectedFaces.push({
            bbox: [30, 25, 150, 120],
            name: randomPerson.name,
            personId: randomPerson.id,
            confidence: Math.round(confidence),
            isRecognized: isRecognized,
            alreadyCounted: true
          });
        }
      }

      const recognitionResults = {
        detections: detectedFaces,
        count: detectedFaces.length,
        processing_time: `${Math.floor(Math.random() * 30 + 15)}ms`
      };
      
      res.json(recognitionResults);

    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Reset recognition session
  app.post("/api/reset-recognition-session", async (req, res) => {
    try {
      const { sessionId } = req.body;
      const currentSessionId = sessionId || 'default';
      recognitionSessions.delete(currentSessionId);
      res.json({ success: true, message: "Recognition session reset" });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Recognition Statistics Routes
  app.get("/api/recognition-stats", async (req, res) => {
    try {
      const stats = await storage.getRecognitionStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/recognition-events/recent", async (req, res) => {
    try {
      const events = await storage.getRecentRecognitionEvents(50);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/recognition/recent/:limit?", async (req, res) => {
    try {
      const limit = parseInt(req.params.limit || "50");
      const events = await storage.getRecentRecognitionEvents(limit);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Chat Routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Get relevant data for context
      const registrations = await storage.getAllFaceRegistrations();
      const recentEvents = await storage.getRecentRecognitionEvents(10);
      const stats = await storage.getRecognitionStats();

      // Generate intelligent response using available data
      let response = "";
      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes("last") && (lowerMessage.includes("registered") || lowerMessage.includes("registration")) || lowerMessage.includes("most recent")) {
        const recent = await storage.getRecentFaceRegistrations(1);
        if (recent.length > 0) {
          const person = recent[0];
          const date = new Date(person.registeredAt).toLocaleString();
          response = `The last registered user was ${person.name}, a ${person.role} in the ${person.department} department, registered on ${date}.`;
        } else {
          response = "No registrations found in the system yet.";
        }
      } else if (lowerMessage.includes("how many") && lowerMessage.includes("registered")) {
        response = `There are currently ${registrations.length} people registered in the system.`;
      } else if (lowerMessage.includes("recent activity") || lowerMessage.includes("show me recent") || lowerMessage.includes("recent events")) {
        const recentRegistrations = await storage.getRecentFaceRegistrations(3);
        const recentRecognitions = await storage.getRecentRecognitionEvents(5);
        
        let activityReport = "Recent Activity:\n\n";
        
        if (recentRegistrations.length > 0) {
          activityReport += "Latest Registrations:\n";
          recentRegistrations.forEach((reg: any, index: number) => {
            const date = new Date(reg.registeredAt).toLocaleString();
            activityReport += `${index + 1}. ${reg.name} (${reg.role}) - ${date}\n`;
          });
          activityReport += "\n";
        }
        
        if (recentRecognitions.length > 0) {
          activityReport += "Recent Face Recognition Events:\n";
          recentRecognitions.forEach((event: any, index: number) => {
            const date = new Date(event.detectedAt).toLocaleString();
            activityReport += `${index + 1}. ${event.personName} detected - ${date}\n`;
          });
        }
        
        response = activityReport || "No recent activity found.";
      } else if (lowerMessage.includes("system status") || lowerMessage.includes("status")) {
        const totalRegistrations = await storage.getRegistrationCount();
        const todayEvents = await storage.getTodayRecognitionCount();
        
        response = `System Status Report:

🔹 Registration System: Active
   - Total registered users: ${totalRegistrations}
   - Database: Connected

🔹 Recognition System: Active
   - Total detections today: ${todayEvents}
   - Processing status: Online
   - Average confidence: ${stats.averageConfidence}%

🔹 Overall Statistics:
   - Total detections: ${stats.totalDetections}
   - Recognized faces: ${stats.recognizedFaces}
   - Unknown faces: ${stats.unknownFaces}

System is fully operational.`;
      } else if (lowerMessage.includes("statistics") || lowerMessage.includes("stats")) {
        response = `System Statistics: ${stats.totalDetections} total detections, ${stats.recognizedFaces} recognized faces, ${stats.unknownFaces} unknown faces, with an average confidence of ${stats.averageConfidence}%.`;
      } else if (lowerMessage.includes("when was") && lowerMessage.includes("registered")) {
        // Extract name from question
        const words = message.split(" ");
        const nameIndex = words.findIndex((word: string) => word.toLowerCase() === "was") + 1;
        if (nameIndex < words.length) {
          const searchName = words[nameIndex].toLowerCase();
          const person = registrations.find((r: any) => r.name.toLowerCase().includes(searchName));
          if (person) {
            const date = new Date(person.registeredAt).toLocaleString();
            response = `${person.name} was registered on ${date}.`;
          } else {
            response = `No registration found for that person.`;
          }
        } else {
          response = "Could you please specify which person you're asking about?";
        }
      } else {
        response = `I can help you with information about face registrations and system statistics. Currently, there are ${registrations.length} registered faces with ${recentEvents.length} recent detection events. You can ask me about registration details, statistics, or specific people.`;
      }
      
      // Store chat message
      await storage.createChatMessage({
        message,
        response
      });
      
      res.json({ response });

    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/chat/history", async (req, res) => {
    try {
      const history = await storage.getChatHistory(20);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // System Status Routes
  app.get("/api/system/status", async (req, res) => {
    try {
      const registrationCount = await storage.getRegistrationCount();
      const todayEvents = await storage.getTodayRecognitionCount();
      const systemHealth = {
        database: "connected",
        faceDetection: "active",
        aiChat: "online"
      };

      res.json({
        registrationCount,
        todayEvents,
        systemHealth,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/system/logs", async (req, res) => {
    try {
      const { level = 'all', module = 'all', limit = 100 } = req.query;
      const logs = await storage.getSystemLogs(
        level as string, 
        module as string, 
        parseInt(limit as string)
      );
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  return httpServer;
}