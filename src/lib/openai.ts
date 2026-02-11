import Groq from "groq-sdk";

/**
 * Create Groq client safely at runtime
 * (Prevents Vercel build crash)
 */
function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set in environment variables");
  }

  return new Groq({ apiKey });
}

/* =========================================================
   TRANSLATE TEXT
========================================================= */
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const groq = getGroqClient();

  const langMap: Record<string, string> = {
    en: "English",
    hi: "Hindi",
  };

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a professional medical translator specializing in English-Hindi translation. Provide accurate translations while preserving medical terminology. Only provide the translation, no explanations or extra text.",
      },
      {
        role: "user",
        content: `Translate the following ${langMap[sourceLang]} text to ${langMap[targetLang]}:\n\n${text}`,
      },
    ],
    temperature: 0.3,
  });

  return response.choices[0].message.content?.trim() || text;
}

/* =========================================================
   TRANSCRIBE AUDIO
========================================================= */
export async function transcribeAudio(
  audioBuffer: Buffer
): Promise<string> {
  const groq = getGroqClient();

  try {
    const uint8Array = new Uint8Array(audioBuffer);
    const blob = new Blob([uint8Array], { type: "audio/webm" });
    const file = new File([blob], "audio.webm", {
      type: "audio/webm",
    });

    const response = await groq.audio.transcriptions.create({
      file: file,
      model: "whisper-large-v3",
    });

    return response.text;
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error("Failed to transcribe audio");
  }
}

/* =========================================================
   GENERATE SUMMARY
========================================================= */
export async function generateSummary(
  messages: Array<{
    role: string;
    originalText: string;
    translatedText: string | null;
  }>
): Promise<{
  summary: string;
  medicalHighlights: {
    symptoms: string[];
    diagnoses: string[];
    medications: string[];
    followUp: string[];
  };
}> {
  const groq = getGroqClient();

  const conversationText = messages
    .map((m) => `${m.role}: ${m.originalText}`)
    .join("\n\n");

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a medical AI assistant that analyzes doctor-patient conversations. Always respond with valid JSON only, no markdown, no backticks, no extra text.",
      },
      {
        role: "user",
        content: `Analyze this doctor-patient conversation and return ONLY a JSON object with this exact structure:
{
  "summary": "Brief overview of the consultation",
  "medicalHighlights": {
    "symptoms": ["symptom1", "symptom2"],
    "diagnoses": ["diagnosis1"],
    "medications": ["medication1"],
    "followUp": ["action1", "action2"]
  }
}

Conversation:
${conversationText}`,
      },
    ],
    temperature: 0.5,
  });

  const text =
    response.choices[0].message.content?.trim() || "{}";

  const cleaned = text
    .replace(/^```json\n?/, "")
    .replace(/^```\n?/, "")
    .replace(/\n?```$/, "");

  return JSON.parse(cleaned);
}
