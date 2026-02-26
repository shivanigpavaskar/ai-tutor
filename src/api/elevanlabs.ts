/// <reference types="node" />

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ElevenLabs API key missing" });
  }

  const response = await fetch(
    "https://api.elevenlabs.io/v1/text-to-speech/kdUY91gH5xyDHapxlthT",
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        output_format: "mp3_44100_128",
        voice_settings: {
          stability: 0.35,
          similarity_boost: 0.85,
        },
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    return res.status(500).send(err);
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());

  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(audioBuffer);
}
