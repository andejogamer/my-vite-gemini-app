
export interface LanguageOption {
  value: string;
  label: string;
  emoji: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: "javascript", label: "JavaScript", emoji: "📜" },
  { value: "python", label: "Python", emoji: "🐍" },
  { value: "java", label: "Java", emoji: "☕️" },
  { value: "csharp", label: "C#", emoji: "✨" },
  { value: "go", label: "Go", emoji: "🐹" },
  { value: "html", label: "HTML", emoji: "📄" },
];

export const GEMINI_MODEL = 'gemini-2.5-flash';