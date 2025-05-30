import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { insertFaceRegistrationSchema, insertRecognitionEventSchema, insertChatMessageSchema, insertSystemLogSchema } from "@shared/schema";
import { spawn } from "child_process";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer });
  
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
        message: `Face registration failed: ${error.message}`,
        module: "face_registration",
        metadata: { error: error.message }
      });
      
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/registrations", async (req, res) => {
    try {
      const registrations = await storage.getAllFaceRegistrations();
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/registrations/recent", async (req, res) => {
    try {
      const recentRegistrations = await storage.getRecentFaceRegistrations(10);
      res.json(recentRegistrations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Face Detection and Encoding Route
  app.post("/api/detect-face", async (req, res) => {
    try {
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ error: "Image data is required" });
      }

      // Call Python face recognition service
      const pythonService = spawn('python3', [
        path.join(process.cwd(), 'python_service', 'face_recognition_service.py'),
        'detect_and_encode'
      ]);

      let result = '';
      let error = '';

      pythonService.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonService.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonService.stdin.write(JSON.stringify({ imageData }));
      pythonService.stdin.end();

      pythonService.on('close', (code) => {
        if (code === 0) {
          try {
            const faceData = JSON.parse(result);
            res.json(faceData);
          } catch (parseError) {
            res.status(500).json({ error: "Failed to parse face detection result" });
          }
        } else {
          res.status(500).json({ error: error || "Face detection failed" });
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Live Recognition Routes
  app.post("/api/recognize-faces", async (req, res) => {
    try {
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ error: "Image data is required" });
      }

      // Get all registered faces
      const registrations = await storage.getAllFaceRegistrations();
      
      // Call Python recognition service
      const pythonService = spawn('python3', [
        path.join(process.cwd(), 'python_service', 'face_recognition_service.py'),
        'recognize_faces'
      ]);

      let result = '';
      let error = '';

      pythonService.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonService.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonService.stdin.write(JSON.stringify({ 
        imageData, 
        knownFaces: registrations.map(r => ({
          id: r.id,
          name: r.name,
          encoding: r.faceEncoding
        }))
      }));
      pythonService.stdin.end();

      pythonService.on('close', async (code) => {
        if (code === 0) {
          try {
            const recognitionResults = JSON.parse(result);
            
            // Log recognition events
            for (const result of recognitionResults.detections) {
              await storage.createRecognitionEvent({
                personId: result.personId || null,
                personName: result.name || "Unknown",
                confidence: result.confidence.toString(),
                isRecognized: result.personId ? 1 : 0
              });
            }
            
            res.json(recognitionResults);
          } catch (parseError) {
            res.status(500).json({ error: "Failed to parse recognition result" });
          }
        } else {
          res.status(500).json({ error: error || "Face recognition failed" });
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Recognition Statistics Routes
  app.get("/api/recognition-stats", async (req, res) => {
    try {
      const stats = await storage.getRecognitionStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/recognition-events/recent", async (req, res) => {
    try {
      const events = await storage.getRecentRecognitionEvents(50);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Chat and RAG Routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Get relevant data for RAG context
      const registrations = await storage.getAllFaceRegistrations();
      const recentEvents = await storage.getRecentRecognitionEvents(100);
      const stats = await storage.getRecognitionStats();

      // Call Python RAG service
      const pythonService = spawn('python3', [
        path.join(process.cwd(), 'python_service', 'rag_engine.py')
      ]);

      let result = '';
      let error = '';

      pythonService.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonService.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonService.stdin.write(JSON.stringify({
        message,
        context: {
          registrations,
          recentEvents,
          stats
        }
      }));
      pythonService.stdin.end();

      pythonService.on('close', async (code) => {
        if (code === 0) {
          try {
            const response = JSON.parse(result);
            
            // Store chat message
            await storage.createChatMessage({
              message,
              response: response.answer
            });
            
            res.json({ response: response.answer });
          } catch (parseError) {
            res.status(500).json({ error: "Failed to parse RAG response" });
          }
        } else {
          res.status(500).json({ error: error || "RAG query failed" });
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/chat/history", async (req, res) => {
    try {
      const history = await storage.getChatHistory(20);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // System Status Routes
  app.get("/api/system/status", async (req, res) => {
    try {
      const registrationCount = await storage.getRegistrationCount();
      const todayEvents = await storage.getTodayRecognitionCount();
      const systemHealth = {
        database: "connected",
        pythonService: "active",
        ragEngine: "online"
      };

      res.json({
        registrationCount,
        todayEvents,
        systemHealth,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
    }
  });

  // WebSocket handling for real-time chat
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', async (data) => {
      try {
        const { type, payload } = JSON.parse(data.toString());
        
        if (type === 'chat_message') {
          // Handle real-time chat message
          const response = await fetch(`http://localhost:5000/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: payload.message })
          });
          
          const result = await response.json();
          
          ws.send(JSON.stringify({
            type: 'chat_response',
            payload: {
              message: payload.message,
              response: result.response,
              timestamp: new Date().toISOString()
            }
          }));
        }
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          payload: { error: error.message }
        }));
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}
