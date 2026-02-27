import express from "express";
import cors from "cors";
import { Communicate } from "edge-tts-universal";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/tts", async (req, res) => {
  try {
    const text = req.query.text;
    const voice = req.query.voice || "en-US-AvaMultilingualNeural";
    
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    res.set({
      'Content-Type': 'audio/mp3',
      'Transfer-Encoding': 'chunked'
    });

    const communicate = new Communicate(text, { voice });
    
    for await (const chunk of communicate.stream()) {
      if (chunk.type === "audio" && chunk.data) {
        res.write(chunk.data);
      }
    }
    
    return res.end();
  } catch (error) {
    console.error("TTS Proxy Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`TTS proxy server running on http://localhost:${PORT}`);
});
