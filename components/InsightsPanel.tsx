
import React from 'react';
import { Lesson } from '../types';

interface InsightsPanelProps {
  lesson: Lesson | null;
  revealedCodeExampleTitles: string[];
  onSelectVocab: (vocab: string) => void;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ lesson, revealedCodeExampleTitles, onSelectVocab }) => {
  if (!lesson) {
    return (
        <div className="h-full flex flex-col items-center justify-center p-6 bg-gray-800 rounded-lg text-gray-500">
            <span className="text-5xl animate-pulse">✨</span>
            <p className="mt-4">Waiting for lesson to begin...</p>
        </div>
    );
  }

  const revealedCodeExamples = lesson.codeExamples.filter(ex => 
    revealedCodeExampleTitles.includes(ex.title)
  );

  return (
    <div className="h-full overflow-y-auto p-6 bg-gray-800 rounded-lg text-white scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
      <div className="flex items-center mb-6">
        <span className="text-4xl mr-3">✨</span>
        <h2 className="text-3xl font-bold">Lesson Insights: {lesson.topic}</h2>
      </div>

      <div className="mb-6 p-4 rounded-lg border border-white/10">
        <h3 className="text-xl font-semibold mb-3 border-b-2 border-cyan-500 pb-2 flex items-center"><span className="text-2xl mr-2">🎯</span>Learning Objectives</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-300">
          {lesson.learningObjectives.map((obj, i) => (
            <li key={i}>{obj}</li>
          ))}
        </ul>
      </div>

      <div className="mb-6 p-4 rounded-lg border border-white/10">
        <h3 className="text-xl font-semibold mb-3 border-b-2 border-cyan-500 pb-2 flex items-center"><span className="text-2xl mr-2">📚</span>Key Vocabulary</h3>
        <div className="flex flex-wrap gap-2">
          {lesson.keyVocabulary.map((vocab, i) => (
            <button 
                key={i} 
                onClick={() => onSelectVocab(vocab)}
                className="bg-gray-700 text-cyan-300 px-3 py-1 rounded-full text-sm font-medium hover:bg-cyan-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-colors duration-200"
            >
              {vocab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-lg border border-white/10">
        <h3 className="text-xl font-semibold mb-3 border-b-2 border-cyan-500 pb-2 flex items-center"><span className="text-2xl mr-2">💻</span>Code Examples</h3>
        {revealedCodeExamples.length > 0 ? (
          <div className="space-y-4">
            {revealedCodeExamples.map((ex, i) => (
              <div key={i} className="bg-gray-900 rounded-lg overflow-hidden border border-white/10 animate-fade-in">
                  <p className="px-4 py-2 text-gray-300 font-semibold">{ex.title}</p>
                  <pre className="p-4 bg-black text-sm text-white overflow-x-auto">
                      <code>{ex.code}</code>
                  </pre>
              </div>
            ))}
          </div>
        ) : (
            <p className="text-gray-400 italic">Code examples will appear here as the lesson progresses.</p>
        )}
      </div>
    </div>
  );
};

export default InsightsPanel;