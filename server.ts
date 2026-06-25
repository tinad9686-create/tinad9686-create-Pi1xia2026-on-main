import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Gemini
  const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY || "dummy",
      httpOptions: {
          headers: {
              'User-Agent': 'aistudio-build'
          }
      }
  });

  app.use(express.json());

  // API Route
  app.post("/api/process-audio", upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
          return res.status(400).json({ error: "No audio file uploaded" });
      }

      const mimeType = req.file.mimetype || "audio/webm";
      const base64Audio = req.file.buffer.toString("base64");

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: {
          parts: [
            { text: "The user is venting about a rough day playing. Acknowledge their effort, encourage them briefly, and give one hype sentence to get them ready for a 5-minute training session.\n\nRespond purely in JSON format: {\"message\": \"your hype message\", \"position\": \"baseline\" | \"kitchen\"} where position is 'baseline' if they complained about lobs/drives or deep shots, or 'kitchen' if they complained about nets/dinks/speed-ups. Default to 'baseline'. Do not include markdown blocks." },
            {
              inlineData: {
                mimeType,
                data: base64Audio
              }
            }
          ]
        }
      });

      let jsonResp = { message: response.text, position: "baseline" };
      try {
        const textStr = response.text || "{}";
        const cleanJson = textStr.replace(/```json/g, '').replace(/```/g, '').trim();
        jsonResp = JSON.parse(cleanJson);
      } catch(e) {
        // fallback
      }

      res.json({ success: true, message: jsonResp.message, position: jsonResp.position || "baseline" });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
