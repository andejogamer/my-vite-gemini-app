import { GoogleGenAI, Type, GenerateContentResponse, Chat as GeminiChat } from "@google/genai";
import { Lesson, QuizQuestion, MasteryReport, ChatMessage, VocabDefinition } from '../types';
import { GEMINI_MODEL } from '../constants';

// This is a re-export to avoid circular dependencies if Chat type is used in App.tsx
export type Chat = GeminiChat;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const lessonSchema = {
  type: Type.OBJECT,
  properties: {
    topic: { type: Type.STRING },
    lessonContent: { type: Type.STRING },
    learningObjectives: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    codeExamples: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            code: { type: Type.STRING }
        },
        required: ["title", "code"]
      },
    },
    keyVocabulary: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ["topic", "lessonContent", "learningObjectives", "codeExamples", "keyVocabulary"],
};

export async function generateLesson(language: string, userLevel: string): Promise<Lesson> {
  const prompt = `You are a master curriculum developer for software engineering. Create a single, introductory lesson plan for the ${language} programming language. The student describes their level as: "${userLevel}". The lesson should be a foundational topic (e.g., "Variables and Data Types" or "Basic Functions"). The output must be a JSON object adhering to the specified schema.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: lessonSchema,
    },
  });

  const text = response.text.trim();
  return JSON.parse(text) as Lesson;
}

export async function generateNextLesson(language: string, previousLessonTopic: string): Promise<Lesson> {
  const prompt = `You are a master curriculum developer for software engineering. A student has just completed a lesson on "${previousLessonTopic}" in ${language}. Create the next logical lesson plan that builds on that knowledge. The lesson should be a single, focused topic. The output must be a JSON object adhering to the specified schema.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: lessonSchema,
    },
  });

  const text = response.text.trim();
  return JSON.parse(text) as Lesson;
}

export function createChatSession(language: string, lesson: Lesson, userLevel: string): GeminiChat {
    const systemInstruction = `You are a friendly and expert programming teacher specializing in ${language}. Your goal is to deliver a structured lesson based on the provided content.

**Your Core Task:**
- Teach the lesson content provided below in a conversational, step-by-step manner.

**Teaching Flow:**
1.  Start with a friendly and warm greeting. Introduce yourself as their AI coding teacher for ${language}, acknowledge their skill level of "${userLevel}", and introduce the lesson topic.
2.  Present the lesson content in small, digestible parts. Explain a concept fully.
3.  After explaining a concept, pause and ask the user if they understand or have any questions before proceeding.
4.  Continue this pattern until you have covered all the lesson content.
5.  Once the lesson is complete, explicitly offer a choice: revisit parts of the lesson, answer final questions, or start the "mastery check" (the quiz).
6.  If the user asks to start the quiz, respond ONLY with the exact phrase: "OK, let's start the quiz!".

**Lesson Content to Teach:**
"${lesson.lessonContent}"
`;
    
    return ai.chats.create({
        model: GEMINI_MODEL,
        config: { systemInstruction },
    });
}

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        shouldReveal: { type: Type.BOOLEAN },
        exampleTitle: { type: Type.STRING }
    },
    required: ["shouldReveal"]
};

interface AnalysisResult {
    shouldReveal: boolean;
    exampleTitle?: string;
}

export async function analyzeForRevealedContent(
    teacherMessage: string, 
    codeExamples: Array<{ title: string; code: string }>,
    alreadyRevealedTitles: string[]
): Promise<string | null> {
    const availableExamples = codeExamples.filter(ex => !alreadyRevealedTitles.includes(ex.title));

    if (availableExamples.length === 0) {
        return null; // No new examples to reveal
    }

    const prompt = `You are an intelligent observer AI. Your task is to analyze a teacher's message and determine if it discusses a concept that directly corresponds to one of the provided code examples.

You will be given the teacher's latest message and a list of available code example titles that have not been shown yet.

- If the message's topic matches one of the code examples, you must respond with a JSON object where "shouldReveal" is true and "exampleTitle" is the exact title of the matching example.
- If the message does NOT directly discuss any of the code examples, respond with a JSON object where "shouldReveal" is false. Do not include "exampleTitle".
- Only identify one example per message. Pick the most relevant one.

Teacher's Message:
"${teacherMessage}"

Available Code Example Titles:
${JSON.stringify(availableExamples.map(e => e.title))}
`;

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
            },
        });
    
        const text = response.text.trim();
        const result = JSON.parse(text) as AnalysisResult;
    
        if (result.shouldReveal && result.exampleTitle) {
            // Final check to ensure the AI didn't hallucinate a title
            if (availableExamples.some(ex => ex.title === result.exampleTitle)) {
                return result.exampleTitle;
            }
        }
    } catch (e) {
        console.error("Error analyzing content for reveal:", e);
        return null; // Don't block the app on an analysis error
    }

    return null;
}


const quizSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            questionText: { type: Type.STRING },
            relatedObjective: { type: Type.STRING },
            options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "An array of multiple-choice options, ONLY if the question is multiple-choice. Otherwise, this should be omitted."
            }
        },
        required: ["questionText", "relatedObjective"],
    }
};

export async function generateQuiz(learningObjectives: string[], conversation: ChatMessage[]): Promise<QuizQuestion[]> {
    const prompt = `You are an expert quiz creator. Based on the following learning objectives and conversation history, generate a JSON array of 4 distinct quiz questions to test understanding. Ensure questions cover different objectives.

    **IMPORTANT**: If a question is multiple-choice (e.g., it asks "Which of the following..."), you MUST provide an array of strings in the "options" field for that question. For open-ended questions, omit the "options" field.
    
    Learning Objectives:
    ${learningObjectives.join('\n- ')}
    
    Conversation History:
    ${JSON.stringify(conversation.slice(-10))}
    
    The output must be a JSON array adhering to the specified schema.`;

    const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: quizSchema,
        },
    });

    const text = response.text.trim();
    return JSON.parse(text) as QuizQuestion[];
}

export interface EvaluationResult {
    isCorrect: boolean;
    feedback: string;
    masteryScore: number;
}

const evaluationSchema = {
    type: Type.OBJECT,
    properties: {
        isCorrect: { type: Type.BOOLEAN },
        feedback: { type: Type.STRING },
        masteryScore: { type: Type.NUMBER },
    },
    required: ["isCorrect", "feedback", "masteryScore"],
};

export async function evaluateAnswer(objective: string, question: string, answer: string): Promise<EvaluationResult> {
    const prompt = `You are a strict but fair evaluator. Your job is to determine if a student's answer correctly addresses the question and demonstrates mastery of the learning objective. Respond with a JSON object.
    
    - Learning Objective: "${objective}"
    - Question: "${question}"
    - Student's Answer: "${answer}"
    
    Evaluate the answer. The response must be a JSON object with:
    1. "isCorrect": a boolean.
    2. "feedback": a string explaining why the answer is right or wrong. If wrong, provide a hint without giving the direct answer.
    3. "masteryScore": a number from 1 (no understanding) to 10 (full mastery).`;

    const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: evaluationSchema,
        },
    });

    const text = response.text.trim();
    return JSON.parse(text) as EvaluationResult;
}

const masteryReportSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            objective: {
                type: Type.STRING,
                description: "The learning objective being evaluated."
            },
            finalScore: {
                type: Type.NUMBER,
                description: "The calculated mastery score for this objective, from 1 to 10."
            },
            misconceptions: {
                type: Type.STRING,
                description: "A summary of what the student got wrong for this objective. 'None' if all answers were correct."
            },
        },
        required: ["objective", "finalScore", "misconceptions"],
    }
};


export async function generateMasteryReport(
    quizResults: { objective: string; score: number, isCorrect: boolean }[]
): Promise<MasteryReport> {
    const prompt = `You are an analyst who summarizes a student's performance into a mastery report. Based on the provided quiz performance data, create a final mastery report. 
    
    For each objective, calculate an average score. For misconceptions, summarize what the student got wrong for that objective. If all answers for an objective were correct, the misconception should be "None".
    
    The report must be a JSON array of objects. Each object should represent one learning objective and contain "objective", "finalScore", and "misconceptions" properties.

    Quiz Performance Data:
    ${JSON.stringify(quizResults)}
    `;

    const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: masteryReportSchema,
        },
    });

    const text = response.text.trim();
    return JSON.parse(text) as MasteryReport;
}

const vocabDefinitionSchema = {
    type: Type.OBJECT,
    properties: {
        word: { type: Type.STRING },
        definition: { type: Type.STRING },
        example: { type: Type.STRING },
    },
    required: ["word", "definition", "example"],
};

export async function getVocabDefinition(word: string, language: string): Promise<VocabDefinition> {
    const prompt = `You are a helpful dictionary AI. Define the programming term "${word}" in the context of the ${language} language.
    
    Your response must be a JSON object with three properties:
    1. "word": The vocabulary word itself.
    2. "definition": A clear and concise definition of the term.
    3. "example": A simple, illustrative code snippet showing how the term is used in ${language}.`;

    const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: vocabDefinitionSchema,
        },
    });

    const text = response.text.trim();
    return JSON.parse(text) as VocabDefinition;
}