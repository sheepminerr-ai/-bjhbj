import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { ParsedFile } from "../utils/fileParser";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface GeneratedSite {
  title: string;
  summary: string;
  steps: Step[];
}

export type StepType = 'explanation' | 'quiz' | 'practice' | 'illustration';

export interface Step {
  id: string;
  title: string;
  type: StepType;
  content: string;
  quiz?: Quiz;
  practice?: Practice;
  illustrationPrompt?: string;
}

export interface Quiz {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Practice {
  problem: string;
  hints: string[];
  solution: string;
}

export async function generateLearningModule(
  problemDescription: string,
  solutionDescription: string,
  files: ParsedFile[]
): Promise<GeneratedSite> {
  const parts: any[] = [];

  let promptText = `You are an expert tutor and a master of pedagogy. Your goal is to take a problem and/or its solution, break it down into its fundamental components ("molecules"), and create a highly comprehensive, step-by-step interactive learning module to teach the user how to deeply understand it and solve similar problems.

You MUST be extremely detailed. Do not hesitate to create dozens of steps if necessary. The goal is deep, fundamental understanding, not just a quick answer. Use abundant examples, analogies, and interactive elements.

`;

  if (problemDescription) {
    promptText += `Problem Description:\n${problemDescription}\n\n`;
  }
  if (solutionDescription) {
    promptText += `Provided Solution:\n${solutionDescription}\n\n`;
  }

  for (const file of files) {
    if (file.type === 'text') {
      promptText += `File Content (${file.name}):\n${file.content}\n\n`;
    } else if (file.type === 'inlineData') {
      parts.push({
        inlineData: {
          data: file.content,
          mimeType: file.mimeType || 'application/octet-stream',
        },
      });
    }
  }

  promptText += `Create a structured learning module with the following requirements:
1. Start with a clear title and a summary of what the user will learn.
2. Break the learning process into many logical, bite-sized steps. Do not rush.
3. Use various tools (step types) to teach. You MUST use a rich mix of these:
   - 'explanation': Deeply explain the concepts, formulas, and logic using Markdown (including math formulas if applicable). Provide real-world analogies and multiple examples.
   - 'quiz': Create multiple-choice questions to test understanding of the current step. Use these frequently to ensure active learning.
   - 'practice': Generate a new, similar problem for the user to solve, with hints and a step-by-step solution.
   - 'illustration': Provide a detailed prompt for an AI image generator to create a helpful visual aid or diagram for the concept. Use this when a visual representation would aid understanding.
4. Ensure the progression is highly logical, starting from the most basic fundamental understanding and slowly building up to advanced application.
5. Do not be afraid to generate 10, 20, or even more steps if the topic requires it. The more thorough and interactive, the better.
6. The language of the module should be Russian.

Output the result as a JSON object matching the provided schema.`;

  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: { parts },
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Title of the learning module" },
          summary: { type: Type.STRING, description: "Brief summary of what will be learned" },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "Unique identifier for the step" },
                title: { type: Type.STRING, description: "Title of the step" },
                type: { type: Type.STRING, description: "One of: explanation, quiz, practice, illustration" },
                content: { type: Type.STRING, description: "Markdown content for the step. Use this for explanations, or to introduce a quiz/practice." },
                quiz: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswerIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING, description: "Explanation of the correct answer" }
                  },
                },
                practice: {
                  type: Type.OBJECT,
                  properties: {
                    problem: { type: Type.STRING, description: "A new similar problem to solve" },
                    hints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    solution: { type: Type.STRING, description: "Step-by-step solution to the practice problem" }
                  },
                },
                illustrationPrompt: { type: Type.STRING, description: "Prompt for an AI image generator to create a visual aid" }
              },
              required: ["id", "title", "type", "content"]
            }
          }
        },
        required: ["title", "summary", "steps"]
      }
    }
  });

  const jsonStr = response.text?.trim() || "{}";
  try {
    return JSON.parse(jsonStr) as GeneratedSite;
  } catch (e) {
    console.error("Failed to parse JSON", jsonStr);
    throw new Error("Failed to parse the generated learning module.");
  }
}

export async function generateIllustration(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: prompt,
        },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Failed to generate image.");
}
