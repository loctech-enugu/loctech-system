import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const openai = process.env.NEXT_PUBLIC_OPENAI_API_KEY
  ? new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  })
  : null;

const gemini = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY)
  : null;

export interface AIQuestionOptions {
  topic: string;
  difficulty?: "easy" | "medium" | "hard";
  type?: "mcq" | "true_false" | "essay";
  model?: "openai" | "gemini";
}

function parseJsonFromString(input: string) {
  try {
    // Remove markdown fences if present.
    const cleaned = input
      .replace(/^```json\s*/, "") // Remove starting ```json\n or ```json
      .replace(/```$/, "") // Remove ending ```
      .trim();

    // Some models add extra prose; parse the first valid JSON object block.
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const jsonCandidate =
      start !== -1 && end !== -1 && end > start
        ? cleaned.slice(start, end + 1)
        : cleaned;

    const parsed = JSON.parse(jsonCandidate);
    return parsed;
    /* eslint-disable-next-line */
  } catch (err) {
    throw new Error(`Failed to parse JSON`);
  }
}

/**
 * Generate a question using OpenAI or Gemini
 */
export async function generateQuestionWithAI(options: AIQuestionOptions) {
  const { topic, difficulty = "medium", type = "mcq", model = "openai" } = options;

  //   const prompt = `
  // You are a professional assessment designer creating general knowledge and reasoning questions
  // for a scholarship exam. The questions should test logical thinking, awareness, and comprehension —
  // not technical coding knowledge.

  // Generate one ${difficulty} level ${type} question about "${topic}".
  // The question can be multiple-choice or true/false.

  // If it's multiple-choice:
  // - Provide four options labeled A–D.
  // - Ensure only one correct answer.

  // If it's true/false:
  // - Provide only two options: ["True", "False"].

  // Keep the language clear, neutral, and suitable for a scholarship aptitude test for tech learners.

  // Respond strictly in structured JSON format as shown:
  // {
  //   "questionText": "...",
  //   "questionType": "multiple-choice" | "true-false",
  //   "difficulty": "${difficulty}",
  //   "category": "${topic}",
  //   "options": ["A", "B", "C", "D"],
  //   "correctAnswer": "..."
  // }
  // `;
  const prompt = `
You are an expert assessment designer for an IT training institute.

Generate one ${difficulty} ${type} question for the topic: "${topic}".

The question should be practical and relevant to IT learners (software, networking, data, cybersecurity, cloud, web, troubleshooting, workplace tech communication).

Rules:
- Write clear, concise English suitable for students and junior professionals.
- For "mcq": provide exactly 4 options, plain text only (no A/B/C/D prefixes), with one correct answer that exactly matches one option.
- For "true_false": provide options exactly as ["True", "False"] and set correctAnswer to either "True" or "False".
- For "essay": provide an open-ended question, set options to [], and provide a short model answer in correctAnswer.
- Keep explanation brief (1-2 sentences).
- Output valid JSON only, with no markdown fences, no commentary, and no trailing commas.

Return this exact shape:
{
  "questionText": "string",
  "type": "mcq" | "true_false" | "essay",
  "difficulty": "easy" | "medium" | "hard",
  "options": ["string"],
  "correctAnswer": "string",
  "explanation": "string",
  "tags": ["string"]
}`;

  try {
    if (model === "openai" && openai) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });
      const response = completion.choices[0].message?.content?.trim();
      const formatted = parseJsonFromString(response || "{}");
      return formatted;
    }

    if (model === "gemini" && gemini) {
      const aiModel = gemini.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
      const result = await aiModel.generateContent(prompt);
      const text = result.response.text();
      const formatted = parseJsonFromString(text);

      return formatted;
    }

    throw new Error("No valid AI model available or API key missing.");
  } catch (error) {
    console.error("AI generation error:", error);
    throw new Error("Failed to generate question with AI.");
  }
}
