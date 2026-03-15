import express from "express";
import { createServer as createViteServer } from "vite";
import { Server } from "socket.io";
import http from "http";
import path from "path";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;

  // In-memory chat storage (last 50 messages)
  const messages: { id: string; user: string; text: string; timestamp: number; color: string }[] = [];

  io.on("connection", (socket) => {
    io.emit("online_count", io.engine.clientsCount);

    // Send existing messages to new client
    socket.emit("init_messages", messages);

    socket.on("request_messages", () => {
      socket.emit("init_messages", messages);
    });

    socket.on("send_message", (data) => {
      let text = data.text;
      
      // Normalize text to catch basic leetspeak bypasses
      const normalizedText = text.toLowerCase()
        .replace(/@/g, 'a')
        .replace(/!/g, 'i')
        .replace(/1/g, 'i')
        .replace(/0/g, 'o')
        .replace(/3/g, 'e')
        .replace(/\$/g, 's');

      const blockedWords = [
        "nigger", "niggas", "nigga", "niggers",
        "faggot", "faggots", "fag", "fags", "fagot", "fagots",
        "dyke", "dykes",
        "tranny", "trannies",
        "chink", "chinks",
        "spic", "spics",
        "gook", "gooks",
        "kike", "kikes"
      ];
      
      const containsSlur = blockedWords.some(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(normalizedText);
      });

      if (containsSlur) {
        text = "no bad word lil bro say something nicer";
      }

      const newMessage = {
        id: Math.random().toString(36).substring(2, 9),
        user: data.user || "Anonymous",
        text: text,
        timestamp: Date.now(),
        color: data.color || "#9333ea"
      };
      
      messages.push(newMessage);
      if (messages.length > 50) {
        messages.shift();
      }
      
      io.emit("new_message", newMessage);
    });

    socket.on("disconnect", () => {
      io.emit("online_count", io.engine.clientsCount);
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
