const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID;

export const generateSpeech = async (text: string) => {
  if (!text) throw new Error("Text required");

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
