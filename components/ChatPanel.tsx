import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MessageAuthor, AppState, Lesson, QuizQuestion } from '../types';
import { LanguageOption } from '../constants';
import Spinner from './Spinner';
import { RobotIcon } from './icons/RobotIcon';
import { UserIcon } from './icons/UserIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface ChatPanelProps {
  conversation: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  appState: AppState;
  onExit: () => void;
  language: LanguageOption | null;
  lesson: Lesson | null;
  currentQuestion?: QuizQuestion;
  onOpenPractice: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ conversation, onSendMessage, isLoading, appState, onExit, language, lesson, currentQuestion, onOpenPractice }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const getAuthorInfo = (author: MessageAuthor) => {
    switch(author){
        case MessageAuthor.TEACHER:
            return { name: "Teacher AI", icon: <RobotIcon className="w-6 h-6 text-cyan-400" />, color: "text-cyan-400", align: "items-start", bg: "bg-gray-700" };
        case MessageAuthor.BACKGROUND:
            return { name: "Quiz Master", icon: <SparklesIcon className="w-6 h-6 text-green-400" />, color: "text-green-400", align: "items-start", bg: "bg-gray-700" };
        case MessageAuthor.USER:
            return { name: "You", icon: <UserIcon className="w-6 h-6 text-blue-400" />, color: "text-blue-400", align: "items-end", bg: "bg-blue-900/50" };
    }
  }

  const hasOptions = appState === AppState.QUIZ && currentQuestion?.options && currentQuestion.options.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 p-3 px-4 border-b border-white/10 flex justify-between items-center">
        <div className="overflow-hidden">
          <h2 className="font-bold text-lg truncate text-white">{language?.label} {language?.emoji}</h2>
          <p className="text-sm text-gray-400 truncate">{lesson?.topic}</p>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={onOpenPractice}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                aria-label="Open practice sandbox"
            >
                Practice 💻
            </button>
            <button
              onClick={onExit}
              className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-red-500 transition-colors flex items-center gap-2"
              aria-label="Exit to main menu"
            >
              Exit 🚪
            </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 pr-2">
        <div className="flex flex-col space-y-4">
          {conversation.map((msg, index) => {
             const { name, icon, color, align, bg } = getAuthorInfo(msg.author);
            return (
              <div key={index} className={`flex flex-col ${align}`}>
                <div className="flex items-center space-x-2">
                    <span className="flex-shrink-0">{icon}</span>
                    <span className={`font-bold ${color}`}>{name}</span>
                </div>
                <div className={`mt-1 max-w-xl p-3 rounded-lg ${bg} border border-white/10`}>
                  <p className="text-white whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start items-center space-x-3 p-4">
               <RobotIcon className="w-6 h-6 text-cyan-400" />
               <Spinner />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="flex-shrink-0 p-4 border-t border-white/20">
        {hasOptions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 animate-fade-in">
                {currentQuestion.options?.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => onSendMessage(option)}
                        disabled={isLoading}
                        className="p-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-cyan-600 disabled:bg-gray-500 transition-colors text-left flex items-start gap-2"
                    >
                        <span className="font-bold text-cyan-400">{String.fromCharCode(65 + index)}.</span>
                        <span>{option}</span>
                    </button>
                ))}
            </div>
        )}
        <div className="flex items-center bg-gray-700 rounded-lg p-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={appState === AppState.LESSON ? 'Ask a question or type "quiz"...' : hasOptions ? 'Select an option above or type your answer...' : 'Type your answer...'}
            className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none resize-none"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputText.trim()}
            className="ml-2 px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            Send ✉️
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;