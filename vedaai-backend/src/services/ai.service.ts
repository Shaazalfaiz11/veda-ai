import OpenAI from "openai"
import { Types } from "mongoose"
import { LLMTimeoutError } from "../utils/errors"
import { LLMTimeoutError } from "../utils/errors"

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey:  process.env.GROQ_API_KEY!,
})

export interface Question {
  _id?:       string
  text:       string
  difficulty: "easy" | "medium" | "hard"
  marks:      number
  type:       "mcq" | "short" | "long"
  options?:   string[]
}

export interface Section {
  title:       string
  instruction: string
  questions:   Question[]
}

export const buildPrompt = (assignment: any): string => `
You are an expert exam paper generator for academic institutions.

Generate a structured question paper with these requirements:
- Subject: ${assignment.subject}
- Topic: ${assignment.topic}
- Total Marks: ${assignment.totalMarks}
- Allowed Question Types: ${assignment.questionTypes.join(", ")}
- Instructions: ${assignment.instructions}

Rules:
1. Create exactly 4 sections: Section A (Easy ~30%), Section B (Medium ~50%), Section C (Hard ~20%), and a final section titled "Answer Key".
2. Total marks across sections A, B, C MUST equal exactly ${assignment.totalMarks}. The Answer Key section should have 0 marks.
3. The "Answer Key" section MUST contain brief, concise answers for EVERY question generated in sections A, B, and C. It should not be excessively long.
4. MCQ questions MUST include an "options" array with exactly 4 strings.
5. Short answer: 2-5 marks | Long answer: 5-10 marks | MCQ: 1 mark
6. Only use question types from: ${assignment.questionTypes.join(", ")}

Return ONLY a valid JSON array. No markdown. No explanation. No code fences.

[
  {
    "title": "Section A",
    "instruction": "Attempt all questions",
    "questions": [
      {
        "text": "Question here",
        "type": "mcq",
        "difficulty": "easy",
        "marks": 1,
        "options": ["Option A", "Option B", "Option C", "Option D"]
      }
    ]
  },
  {
    "title": "Answer Key",
    "instruction": "Answers for teachers",
    "questions": [
      {
        "text": "1. Answer to Q1\\n2. Answer to Q2 (Option B)\\n3. Brief explanation for Q3",
        "type": "short",
        "difficulty": "medium",
        "marks": 0
      }
    ]
  }
]
`.trim()

const parseAndValidate = (raw: string): Section[] => {
  const cleaned = raw.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim()

  let parsed: any
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/)
    if (!match) throw new Error("AI returned non-JSON response")
    parsed = JSON.parse(match[0])
  }

  if (!Array.isArray(parsed)) throw new Error("AI response is not an array")

  return parsed.map((section: any, i: number) => ({
    title:       section.title ?? `Section ${String.fromCharCode(65 + i)}`,
    instruction: section.instruction ?? "Attempt all questions",
    questions: (section.questions ?? []).map((q: any) => ({
      _id:        new Types.ObjectId().toString(),
      text:       q.text ?? "Question text missing",
      difficulty: ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : "medium",
      marks:      Number(q.marks) || 1,
      type:       q.type ?? "short",
      ...(q.options ? { options: q.options } : {}),
    })),
  }))
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const generateWithAI = async (
  prompt: string
): Promise<Section[]> => {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 30000);

  try {
    const response = await client.chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      max_tokens:  4096,
      temperature: 0.7,
      messages: [
        {
          role:    "system",
          content: "You are an exam paper generator. Always respond with valid JSON only. No markdown, no explanation.",
        },
        { role: "user", content: prompt },
      ],
    }, { signal: abortController.signal as any });

    const raw = response.choices[0]?.message?.content ?? "";
    console.log(`✅ Groq response received (${raw.length} chars)`);
    return parseAndValidate(raw);
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new LLMTimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const generateSingleQuestionWithAI = async (
  assignment: any,
  oldQuestion: Question
): Promise<Question> => {
  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), 30000)

  const prompt = `
You are an expert exam paper generator for academic institutions.

Regenerate a SINGLE question for this context:
- Subject: ${assignment.subject}
- Topic: ${assignment.topic}
- Original Question (DO NOT return the same question): "${oldQuestion.text}"
- Question Type MUST BE: ${oldQuestion.type}
- Difficulty MUST BE: ${oldQuestion.difficulty}
- Marks MUST BE: ${oldQuestion.marks}

Rules:
1. Return exactly ONE question.
2. Provide a completely different text for the question than the original.
3. Keep the exact same difficulty, type, and marks.
4. If it is an MCQ, provide exactly 4 options.
5. Return ONLY a valid JSON object. No markdown, no explanations, no arrays.

Example format:
{
  "text": "New regenerated question here",
  "type": "${oldQuestion.type}",
  "difficulty": "${oldQuestion.difficulty}",
  "marks": ${oldQuestion.marks},
  "options": ["Opt A", "Opt B", "Opt C", "Opt D"]
}
  `.trim()

  try {
    const response = await client.chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      max_tokens:  500,
      temperature: 0.8,
      messages: [
        {
          role:    "system",
          content: "You are an exam paper generator. Always respond with valid JSON only. No markdown, no explanation.",
        },
        { role: "user", content: prompt },
      ],
    }, { signal: abortController.signal as any })

    const raw = response.choices[0]?.message?.content ?? ""
    let cleaned = raw.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim()
    
    // In case the AI still wraps it in an array
    if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
      const arr = JSON.parse(cleaned)
      cleaned = JSON.stringify(arr[0])
    }
    
    const parsed = JSON.parse(cleaned)

    if (!parsed.text || !parsed.type || !parsed.difficulty || !parsed.marks) {
      throw new Error("Invalid question format from AI")
    }

    return parsed as Question
  } catch (error: any) {
    if (error.name === "AbortError") throw new LLMTimeoutError()
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}