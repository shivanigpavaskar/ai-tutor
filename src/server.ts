import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post("/api/tts/elevenlabs", async (req: Request, res: Response) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("ElevenLabs API key missing in .env");
    return res.status(500).json({ error: "ElevenLabs API key missing" });
  }
console.log(process.env.ELEVENLABS_API_KEY);
  try {
    const response = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/kdUY91gH5xyDHapxlthT", // Updated voice ID from user request
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          output_format: "mp3_44100_128", // Requested output format
          voice_settings: {
            speed: 0.35, // Slower speaking rate
            stability: 0.5,
            similarity_boost: 0.8,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", errorText);
      return res.status(response.status).send(errorText);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(buffer);
  } catch (error) {
    console.error("Error calling ElevenLabs API:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// D-ID Streaming API Proxy
// ==========================================
const DID_API_URL = "https://api.d-id.com";

app.post("/api/did/create-stream", async (req: Request, res: Response) => {
  const apiKey = process.env.DID_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "D-ID API key missing" });

  try {
    const { source_url } = req.body;
    const response = await fetch(`${DID_API_URL}/talks/streams`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_url:
          source_url ||
          "https://d-id-public-bucket.s3.amazonaws.com/or-roman.jpg",
      }),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error("D-ID Create Stream Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/did/submit-answer", async (req: Request, res: Response) => {
  const apiKey = process.env.DID_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "D-ID API key missing" });

  try {
    const { streamId, sessionId, answer } = req.body;
    const response = await fetch(
      `${DID_API_URL}/talks/streams/${streamId}/sdp`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answer, session_id: sessionId }),
      },
    );
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error("D-ID Submit Answer Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/did/ice-candidate", async (req: Request, res: Response) => {
  const apiKey = process.env.DID_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "D-ID API key missing" });

  try {
    const { streamId, sessionId, candidate } = req.body;
    const response = await fetch(
      `${DID_API_URL}/talks/streams/${streamId}/ice`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ candidate, session_id: sessionId }),
      },
    );
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error("D-ID ICE Candidate Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/did/talk", async (req: Request, res: Response) => {
  const apiKey = process.env.DID_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "D-ID API key missing" });

  try {
    const { streamId, sessionId, text } = req.body;
    const response = await fetch(`${DID_API_URL}/talks/streams/${streamId}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        script: {
          type: "text",
          input: text,
          provider: { type: "microsoft", voice_id: "en-US-JennyNeural" },
        },
        driver_url: "bank://lively/",
        config: {
          stitch: true,
        },
        session_id: sessionId,
      }),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error("D-ID Talk Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/did/destroy-stream", async (req: Request, res: Response) => {
  const apiKey = process.env.DID_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "D-ID API key missing" });

  try {
    const { streamId, sessionId } = req.body;
    const response = await fetch(`${DID_API_URL}/talks/streams/${streamId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error("D-ID Destroy Stream Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
