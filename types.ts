import { LanguageOption } from './constants';
import * as geminiService from './services/geminiService';

export enum AppState {
    LANGUAGE_SELECTION,
    LESSON,
    QUIZ,
    RESULTS,
}

export enum MessageAuthor {
    USER = 'user',
    TEACHER = 'teacher',
    BACKGROUND = 'background',
}

export interface ChatMessage {
    author: MessageAuthor;
    text: string;
}

export interface Lesson {
    topic: string;
    lessonContent: string;
    learningObjectives: string[];
    codeExamples: Array<{ title: string; code: string }>;
    keyVocabulary: string[];
}

export interface QuizQuestion {
    questionText: string;
    relatedObjective: string;
    options?: string[];
}

export interface MasteryReportRecord {
    objective: string;
    finalScore: number;
    misconceptions: string;
}

export type MasteryReport = MasteryReportRecord[];

export interface VocabDefinition {
    word: string;
    definition: string;
    example: string;
}

export interface LanguageTrack {
    level: string;
    conversation: ChatMessage[];
    lesson: Lesson | null;
    quiz: QuizQuestion[];
    currentQuestionIndex: number;
    quizAnswers: Array<{ question: string; answer: string; objective: string; evaluation: geminiService.EvaluationResult | null }>;
    masteryReport: MasteryReport | null;
    revealedCodeExampleTitles: string[];
    lastKnownState: AppState | null; // To remember state when exiting to menu
}

export interface UserProfile {
    id: string;
    name: string;
    appState: AppState; // The single, global state of what the user is currently viewing.
    // The language currently selected in the menu, which dictates which track is active for operations.
    selectedLanguageValue: string | null;
    languageTracks: Record<string, LanguageTrack>; // key is language.value, e.g., "javascript"
}