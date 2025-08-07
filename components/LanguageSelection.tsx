import React from 'react';
import { LanguageOption, LANGUAGE_OPTIONS } from '../constants';
import { UserProfile, AppState } from '../types';
import { RobotIcon } from './icons/RobotIcon';

interface LanguageSelectionProps {
  profiles: UserProfile[];
  activeProfile: UserProfile | null;
  onSelectProfile: (id: string) => void;
  onCreateNewProfile: () => void;
  onSelectLanguage: (language: LanguageOption) => void;
  onUpdateLevel: (level: string) => void;
  onStart: () => void;
  onContinue: () => void;
}

const LanguageSelection: React.FC<LanguageSelectionProps> = ({
  profiles,
  activeProfile,
  onSelectProfile,
  onCreateNewProfile,
  onSelectLanguage,
  onUpdateLevel,
  onStart,
  onContinue,
}) => {
  const selectedLanguage = activeProfile?.selectedLanguageValue 
    ? LANGUAGE_OPTIONS.find(l => l.value === activeProfile.selectedLanguageValue)
    : null;
    
  const activeLanguageTrack = activeProfile && activeProfile.selectedLanguageValue
    ? activeProfile.languageTracks[activeProfile.selectedLanguageValue]
    : null;

  const handleStart = () => {
    if (activeProfile?.selectedLanguageValue) {
      onStart();
    }
  };
  
  const handleLevelChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateLevel(e.target.value);
  };

  const canContinue = !!activeLanguageTrack?.lastKnownState;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col md:flex-row">
      {/* Left Sidebar for User Profiles */}
      <div className="w-full md:w-64 bg-gray-800 p-4 border-r border-white/10 flex flex-col">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-3xl">👥</span> Users
        </h2>
        <div className="flex-grow space-y-2">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => onSelectProfile(profile.id)}
              className={`w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 border flex items-center justify-between ${
                activeProfile?.id === profile.id
                  ? 'bg-cyan-500 text-white shadow-lg border-cyan-400'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-white/10'
              }`}
            >
              <span>{profile.name}</span>
              {activeProfile?.id === profile.id && <span className="text-2xl" role="img" aria-label="Active Profile">🎯</span>}
            </button>
          ))}
        </div>
        <button
          onClick={onCreateNewProfile}
          className="w-full mt-4 px-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
        >
          + New User
        </button>
      </div>

      {/* Right Content Area for Language Selection */}
      <div className="flex-grow flex flex-col items-center justify-center p-4 relative">
        {canContinue && (
            <button
                onClick={onContinue}
                className="absolute top-6 right-6 px-5 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
                Continue {selectedLanguage?.label} Lesson ↪️
            </button>
        )}
        <div className="w-full max-w-2xl text-center">
          <div className="flex justify-center items-center mb-4">
            <RobotIcon className="w-24 h-24 text-cyan-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">AI Coding Tutor</h1>
          <p className="text-lg text-gray-400 mb-8">Your personal guide to mastering programming.</p>

          <div className="bg-gray-800 p-8 rounded-lg shadow-2xl border border-white/20">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Choose your language</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => onSelectLanguage(lang)}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 border border-white/10 ${
                      activeProfile?.selectedLanguageValue === lang.value
                        ? 'bg-cyan-500 text-white shadow-lg'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {lang.label} {lang.emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Describe your skill level</h2>
              <textarea
                value={activeLanguageTrack?.level || 'a complete beginner'}
                onChange={handleLevelChange}
                className="w-full p-4 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition border border-white/10"
                rows={3}
                placeholder="e.g., 'a complete beginner', 'I know the basics but struggle with loops', etc."
                disabled={!activeProfile?.selectedLanguageValue}
              />
            </div>

            <button
              onClick={handleStart}
              disabled={!activeProfile?.selectedLanguageValue}
              className="w-full py-4 bg-cyan-600 text-white font-bold text-lg rounded-lg hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg border border-white/20 flex items-center justify-center gap-2"
            >
              Start New Lesson {selectedLanguage ? selectedLanguage.emoji : '🚀'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelection;