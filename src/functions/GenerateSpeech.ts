import axios from "axios";

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

const openaiService = axios.create({
  baseURL: "https://api.openai.com/v1/audio",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
});

export const generateSpeech = async (text: string) => {
  try {
    const response = await openaiService.post(
      "/speech",
      {
        model: "tts-1",
        input: text,
        voice: "shimmer",
        speed: 1.1,
      },
      {
        responseType: "blob",
      }
    );

    return URL.createObjectURL(response.data);
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};
