
import React from 'react';
import { MasteryReport } from '../types';

interface ResultsScreenProps {
  report: MasteryReport | null;
  onRevisit: () => void;
  onNext: () => void;
}

const MasteryBar: React.FC<{ score: number }> = ({ score }) => {
    const width = `${score * 10}%`;
    const colorClass = score > 7 ? 'bg-green-500' : score > 4 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div className="w-full bg-gray-600 rounded-full h-4">
            <div className={`${colorClass} h-4 rounded-full`} style={{ width }}></div>
        </div>
    );
};


const ResultsScreen: React.FC<ResultsScreenProps> = ({ report, onRevisit, onNext }) => {
  if (!report) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <p>Generating your report...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-gray-800 rounded-lg shadow-2xl p-8 border border-white/20">
        <h1 className="text-4xl font-bold text-center text-white mb-6">🏆 Quiz Results 🏆</h1>
        
        <div className="space-y-6">
          {report.map((item, index) => (
            <div key={index} className="bg-gray-700 p-4 rounded-lg border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">{item.objective}</h3>
              <div className="flex items-center gap-4 mb-2">
                 <div className="w-full">
                    <MasteryBar score={item.finalScore} />
                 </div>
                 <span className="font-bold text-lg text-white">{item.finalScore}/10</span>
              </div>
              {item.misconceptions !== 'None' && (
                <div className="text-sm text-yellow-300 bg-yellow-900/50 p-2 rounded">
                  <strong>Note:</strong> {item.misconceptions}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col md:flex-row justify-center gap-4">
          <button onClick={onRevisit} className="px-8 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500 transition-colors flex items-center justify-center gap-2">
            🔄 Revisit Lesson
          </button>
          <button onClick={onNext} className="px-8 py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2">
            Continue to Next Lesson ▶️
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;