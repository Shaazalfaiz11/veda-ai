import { Request, Response } from "express";
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY!,
});

const TUTOR_SYSTEM_PROMPT = `You are an enthusiastic, patient, and encouraging English language tutor named "Veda Tutor". 

Your role:
- Help students improve their English speaking, grammar, vocabulary, and pronunciation
- Keep responses conversational, short (2-4 sentences max), and encouraging
- Correct mistakes gently and explain why something is wrong
- Use simple language appropriate for learners
- Ask follow-up questions to keep the conversation going
- If the student seems stuck, give hints or suggest topics to discuss
- Occasionally compliment good English usage to boost confidence
- You can discuss any topic but always focus on improving the student's English

Speaking style:
- Speak naturally like a friendly teacher
- Use short sentences that are easy to follow when spoken aloud
- Avoid complex formatting, bullet points, or markdown — just plain conversational text
- Be warm and patient, never condescending`;

export const chatWithTutor = async (req: Request, res: Response) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "No message provided" });
    }

    // Set up SSE headers for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: TUTOR_SYSTEM_PROMPT },
      ...history.slice(-10).map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    const stream = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 200,
      temperature: 0.8,
      messages,
      stream: true,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ token: content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true, fullResponse })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error("Tutor chat error:", error);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: "AI service error" })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ success: false, message: "AI service error" });
    }
  }
};

// POST /api/tutor/speak — Convert text to natural speech using Edge Neural TTS
export const speakText = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: "No text provided" });
    }

    const { MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts");
    const tts = new MsEdgeTTS();
    
    // en-IN-NeerjaNeural — natural Indian English female voice
    await tts.setMetadata("en-IN-NeerjaNeural", OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(text);
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
      audioStream.on("end", () => resolve());
      audioStream.on("error", (err: Error) => reject(err));
    });

    const audioBuffer = Buffer.concat(chunks);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audioBuffer.length.toString());
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(audioBuffer);
  } catch (error) {
    console.error("TTS error:", error);
    res.status(500).json({ success: false, message: "TTS failed" });
  }
};
