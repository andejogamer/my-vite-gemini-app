
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, ChatMessage, Lesson, QuizQuestion, MessageAuthor, VocabDefinition, UserProfile, LanguageTrack } from './types';
import { LanguageOption, LANGUAGE_OPTIONS } from './constants';
import * as geminiService from './services/geminiService';
import LanguageSelection from './components/LanguageSelection';
import MainLayout from './components/MainLayout';
import ChatPanel from './components/ChatPanel';
import InsightsPanel from './components/InsightsPanel';
import ResultsScreen from './components/ResultsScreen';
import Spinner from './components/Spinner';
import Modal from './components/Modal';
import CodeEditor from './components/CodeEditor';

const LOCAL_STORAGE_KEY = 'ai-coding-tutor-profiles';

const createNewLanguageTrack = (level: string = 'a complete beginner'): LanguageTrack => ({
  level,
  lastKnownState: null,
  conversation: [],
  lesson: null,
  quiz: [],
  currentQuestionIndex: 0,
  quizAnswers: [],
  masteryReport: null,
  revealedCodeExampleTitles: [],
});

const createNewProfile = (name: string, id: string): UserProfile => ({
  id,
  name,
  appState: AppState.LANGUAGE_SELECTION,
  selectedLanguageValue: null,
  languageTracks: {},
});


export default function App() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  
  const [selectedVocab, setSelectedVocab] = useState<VocabDefinition | null>(null);
  const [isVocabModalOpen, setIsVocabModalOpen] = useState(false);
  const [isVocabLoading, setIsVocabLoading] = useState(false);

  const chatSessionRef = useRef<geminiService.Chat | null>(null);

  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const selectedLanguageOption = activeProfile?.selectedLanguageValue ? LANGUAGE_OPTIONS.find(l => l.value === activeProfile.selectedLanguageValue) : null;
  const activeLanguageTrack = activeProfile && activeProfile.selectedLanguageValue ? activeProfile.languageTracks[activeProfile.selectedLanguageValue] : null;

  // Load profiles from localStorage on initial mount
  useEffect(() => {
    try {
      const savedProfiles = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedProfiles) {
        const parsedProfiles = JSON.parse(savedProfiles);
        setProfiles(parsedProfiles);
        const lastActiveId = localStorage.getItem(`${LOCAL_STORAGE_KEY}-active`);
        setActiveProfileId(lastActiveId && parsedProfiles.some((p: UserProfile) => p.id === lastActiveId) ? lastActiveId : parsedProfiles[0]?.id || null);
      } else {
        const defaultProfile = createNewProfile('User 1', 'user-1');
        setProfiles([defaultProfile]);
        setActiveProfileId(defaultProfile.id);
      }
    } catch (error) {
      console.error("Failed to load profiles from local storage:", error);
      const defaultProfile = createNewProfile('User 1', 'user-1');
      setProfiles([defaultProfile]);
      setActiveProfileId(defaultProfile.id);
    }
  }, []);

  // Save profiles to localStorage whenever they change
  useEffect(() => {
    if (profiles.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profiles));
    }
    if(activeProfileId) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}-active`, activeProfileId);
    }
  }, [profiles, activeProfileId]);

  // Re-initialize chat session when language or lesson changes
  useEffect(() => {
    if (activeProfile && (activeProfile.appState === AppState.LESSON || activeProfile.appState === AppState.QUIZ) && activeLanguageTrack?.lesson && selectedLanguageOption) {
      chatSessionRef.current = geminiService.createChatSession(
        selectedLanguageOption.value,
        activeLanguageTrack.lesson,
        activeLanguageTrack.level
      );
    } else {
      chatSessionRef.current = null;
    }
  }, [activeProfile?.appState, activeLanguageTrack?.lesson, selectedLanguageOption]);


  const updateActiveProfile = useCallback((updates: Partial<UserProfile>) => {
    if (!activeProfileId) return;
    setProfiles(prevProfiles =>
      prevProfiles.map(p =>
        p.id === activeProfileId ? { ...p, ...updates } : p
      )
    );
  }, [activeProfileId]);
  
  const updateActiveLanguageTrack = useCallback((updates: Partial<LanguageTrack>) => {
    if (!activeProfileId) return;
    setProfiles(prevProfiles =>
      prevProfiles.map(p => {
        if (p.id !== activeProfileId || !p.selectedLanguageValue) {
          return p;
        }
  
        const langValue = p.selectedLanguageValue;
        const currentTrack = p.languageTracks[langValue] || createNewLanguageTrack();
        const updatedTrack = { ...currentTrack, ...updates };
  
        return {
          ...p,
          languageTracks: {
            ...p.languageTracks,
            [langValue]: updatedTrack,
          },
        };
      })
    );
  }, [activeProfileId]);

  const handleSelectLanguage = useCallback((lang: LanguageOption) => {
      if (!activeProfile) return;
      const existingTrack = activeProfile.languageTracks[lang.value];
      if (!existingTrack) {
          const newTrack = createNewLanguageTrack();
          updateActiveProfile({
              selectedLanguageValue: lang.value,
              languageTracks: { ...activeProfile.languageTracks, [lang.value]: newTrack }
          });
      } else {
          updateActiveProfile({ selectedLanguageValue: lang.value });
      }
  }, [activeProfile, updateActiveProfile]);

  const handleUpdateLevel = useCallback((level: string) => {
    updateActiveLanguageTrack({ level });
  }, [updateActiveLanguageTrack]);

  const startNewLesson = useCallback(async () => {
    if (!activeProfile || !selectedLanguageOption) return;
    
    setIsLoading(true);

    const initialTrackState: Partial<LanguageTrack> = {
        conversation: [],
        lesson: null,
        masteryReport: null,
        quiz: [],
        quizAnswers: [],
        currentQuestionIndex: 0,
        revealedCodeExampleTitles: [],
        lastKnownState: null,
    };
    updateActiveLanguageTrack(initialTrackState);

    try {
      const initialLesson = await geminiService.generateLesson(selectedLanguageOption.value, activeLanguageTrack?.level || 'a complete beginner');
      chatSessionRef.current = geminiService.createChatSession(selectedLanguageOption.value, initialLesson, activeLanguageTrack?.level || 'a complete beginner');
      
      const response = await chatSessionRef.current.sendMessage({ message: "Begin the lesson." });
      const welcomeMessage: ChatMessage = { author: MessageAuthor.TEACHER, text: response.text };

      updateActiveLanguageTrack({
        lesson: initialLesson,
        conversation: [welcomeMessage],
      });
      updateActiveProfile({ appState: AppState.LESSON });

    } catch (error) {
      console.error("Failed to start new lesson:", error);
      updateActiveLanguageTrack({ conversation: [{ author: MessageAuthor.TEACHER, text: "Sorry, I encountered an error setting up the lesson. Please try again." }]});
    } finally {
      setIsLoading(false);
    }
  }, [activeProfile, selectedLanguageOption, activeLanguageTrack, updateActiveLanguageTrack, updateActiveProfile]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!chatSessionRef.current || !activeLanguageTrack?.lesson) return;
    
    const userMessage: ChatMessage = { author: MessageAuthor.USER, text };
    updateActiveLanguageTrack({ conversation: [...activeLanguageTrack.conversation, userMessage] });
    
    setIsLoading(true);
    try {
      const response = await chatSessionRef.current.sendMessage({ message: text });
      const teacherText = response.text;
      
      let currentConversation = [...activeLanguageTrack.conversation, userMessage];

      if (teacherText) {
          const teacherResponse: ChatMessage = { author: MessageAuthor.TEACHER, text: teacherText };
          currentConversation = [...currentConversation, teacherResponse];
          updateActiveLanguageTrack({ conversation: currentConversation });
      } else {
          setIsLoading(false);
          return;
      }

      if (teacherText.includes("OK, let's start the quiz!")) {
        try {
          const generatedQuiz = await geminiService.generateQuiz(activeLanguageTrack.lesson.learningObjectives, currentConversation);
          
          const firstQuestion = generatedQuiz[0];
          let questionTextWithOptions = firstQuestion.questionText;
          if (firstQuestion.options && firstQuestion.options.length > 0) {
              questionTextWithOptions += '\n\n' + firstQuestion.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n');
          }

          const quizStartMessage: ChatMessage = {
            author: MessageAuthor.BACKGROUND,
            text: `Great! Let's test your knowledge. Here is the first one:\n\n${questionTextWithOptions}`
          };
          updateActiveLanguageTrack({
            quiz: generatedQuiz,
            conversation: [...currentConversation, quizStartMessage],
            quizAnswers: generatedQuiz.map(q => ({ question: q.questionText, answer: '', objective: q.relatedObjective, evaluation: null })),
          });
          updateActiveProfile({ appState: AppState.QUIZ });
        } catch (error) {
          console.error("Failed to generate quiz:", error);
          updateActiveLanguageTrack({
              conversation: [...currentConversation, { author: MessageAuthor.BACKGROUND, text: "I had trouble creating the quiz. Let's continue the lesson for now." }],
          });
          updateActiveProfile({ appState: AppState.LESSON });
        } finally {
          setIsLoading(false);
        }
        return;
      }
      
      const revealedTitle = await geminiService.analyzeForRevealedContent(
        teacherText,
        activeLanguageTrack.lesson.codeExamples,
        activeLanguageTrack.revealedCodeExampleTitles
      );

      if (revealedTitle) {
          updateActiveLanguageTrack({ revealedCodeExampleTitles: [...new Set([...activeLanguageTrack.revealedCodeExampleTitles, revealedTitle])] });
      }
      
    } catch (error) {
      console.error("Failed to get teacher response:", error);
      updateActiveLanguageTrack({ conversation: [...activeLanguageTrack.conversation, { author: MessageAuthor.TEACHER, text: "I'm having a little trouble responding right now. Can you try asking again?" }]});
    } finally {
        setIsLoading(false);
    }
  }, [activeLanguageTrack, updateActiveLanguageTrack, updateActiveProfile]);

  const handleQuizAnswer = useCallback(async (answer: string) => {
    if (!activeLanguageTrack) return;
    const { quiz, quizAnswers, currentQuestionIndex, conversation } = activeLanguageTrack;

    const currentQuizAnswer = quizAnswers[currentQuestionIndex];
    const updatedAnswers = [...quizAnswers];
    updatedAnswers[currentQuestionIndex] = { ...currentQuizAnswer, answer };
    
    const userAnswerMessage: ChatMessage = { author: MessageAuthor.USER, text: answer };
    let newConversation = [...conversation, userAnswerMessage];
    updateActiveLanguageTrack({ quizAnswers: updatedAnswers, conversation: newConversation });
    
    setIsLoading(true);

    try {
        const evaluation = await geminiService.evaluateAnswer(
            currentQuizAnswer.objective,
            quiz[currentQuestionIndex].questionText,
            answer
        );

        updatedAnswers[currentQuestionIndex].evaluation = evaluation;

        let feedbackText = `${evaluation.isCorrect ? 'Correct!' : 'Not quite.'} ${evaluation.feedback}`;
        const feedbackMessage: ChatMessage = { author: MessageAuthor.BACKGROUND, text: feedbackText };
        newConversation = [...newConversation, feedbackMessage];

        if (currentQuestionIndex < quiz.length - 1) {
            const nextQuestionIndex = currentQuestionIndex + 1;
            const nextQuestion = quiz[nextQuestionIndex];
            let nextQuestionText = nextQuestion.questionText;
            if (nextQuestion.options && nextQuestion.options.length > 0) {
                nextQuestionText += `\n\n${nextQuestion.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}`;
            }

            const nextQuestionMessage: ChatMessage = {
                author: MessageAuthor.BACKGROUND,
                text: `Next question:\n\n${nextQuestionText}`
            };
            newConversation = [...newConversation, nextQuestionMessage];
            updateActiveLanguageTrack({ conversation: newConversation, quizAnswers: updatedAnswers, currentQuestionIndex: nextQuestionIndex });
        } else {
            const report = await geminiService.generateMasteryReport(updatedAnswers.map(a => ({ objective: a.objective, score: a.evaluation?.masteryScore ?? 1, isCorrect: a.evaluation?.isCorrect ?? false })));
            const quizEndMessage: ChatMessage = {
                author: MessageAuthor.BACKGROUND,
                text: "That's the end of the quiz! Here is a summary of your performance."
            };
            newConversation = [...newConversation, quizEndMessage];
            updateActiveLanguageTrack({ masteryReport: report, conversation: newConversation });
            updateActiveProfile({ appState: AppState.RESULTS });
        }
    } catch (error) {
        console.error("Failed to evaluate answer:", error);
        newConversation = [...newConversation, { author: MessageAuthor.BACKGROUND, text: "I had trouble evaluating that answer. Let's move to the next question." }];
        if (currentQuestionIndex < quiz.length - 1) {
          updateActiveLanguageTrack({ conversation: newConversation, currentQuestionIndex: currentQuestionIndex + 1 });
        } else {
          updateActiveLanguageTrack({ conversation: newConversation });
          updateActiveProfile({ appState: AppState.RESULTS });
        }
    } finally {
        setIsLoading(false);
    }
  }, [activeLanguageTrack, updateActiveLanguageTrack, updateActiveProfile]);
  
  const handleRevisitLesson = useCallback(() => {
    if (!activeLanguageTrack) return;
    const revisitMessage: ChatMessage = {
        author: MessageAuthor.TEACHER,
        text: "Alright, let's go over that lesson again. Looking at your quiz results, you might want to focus on a few areas. What would you like to review first?"
    };
    updateActiveLanguageTrack({
        quiz: [],
        quizAnswers: [],
        currentQuestionIndex: 0,
        conversation: [...activeLanguageTrack.conversation, revisitMessage]
    });
    updateActiveProfile({ appState: AppState.LESSON });
  }, [activeLanguageTrack, updateActiveLanguageTrack, updateActiveProfile]);

  const handleNextLesson = useCallback(async () => {
     if (!activeLanguageTrack || !selectedLanguageOption || !activeLanguageTrack.lesson) return;
     
     setIsLoading(true);
     const nextLessonPrepMessage: ChatMessage = {
        author: MessageAuthor.TEACHER,
        text: "Great work! Let's prepare your next lesson..."
     };
     
     updateActiveLanguageTrack({
        conversation: [nextLessonPrepMessage],
        masteryReport: null,
        quiz: [],
        quizAnswers: [],
        currentQuestionIndex: 0,
        revealedCodeExampleTitles: [],
     });
     updateActiveProfile({ appState: AppState.LESSON });

     try {
        const nextLesson = await geminiService.generateNextLesson(selectedLanguageOption.value, activeLanguageTrack.lesson.topic);
        chatSessionRef.current = geminiService.createChatSession(selectedLanguageOption.value, nextLesson, "a student who has just completed the previous topic");

        const response = await chatSessionRef.current.sendMessage({ message: "Begin the lesson." });
        const welcomeMessage: ChatMessage = { author: MessageAuthor.TEACHER, text: response.text };
        
        updateActiveLanguageTrack({ lesson: nextLesson, conversation: [welcomeMessage] });
     } catch (error) {
        console.error("Failed to start next lesson:", error);
        updateActiveLanguageTrack({ conversation: [{ author: MessageAuthor.TEACHER, text: "Sorry, I encountered an error setting up the next lesson. Please try again." }]});
     } finally {
        setIsLoading(false);
     }
  }, [activeLanguageTrack, selectedLanguageOption, updateActiveLanguageTrack, updateActiveProfile]);
  
  const handleExitToMenu = useCallback(() => {
    if (!activeProfile) return;
    updateActiveLanguageTrack({ lastKnownState: activeProfile.appState });
    updateActiveProfile({ appState: AppState.LANGUAGE_SELECTION });
  }, [activeProfile, updateActiveProfile, updateActiveLanguageTrack]);

  const handleContinue = useCallback(() => {
    if (!activeLanguageTrack?.lastKnownState) return;
    updateActiveProfile({ appState: activeLanguageTrack.lastKnownState });
    updateActiveLanguageTrack({ lastKnownState: null });
  }, [activeLanguageTrack, updateActiveProfile, updateActiveLanguageTrack]);

  const handleSelectProfile = (id: string) => setActiveProfileId(id);

  const handleConfirmCreateProfile = () => {
    const newId = `user-${profiles.length + 1}`;
    const newProfile = createNewProfile(`User ${profiles.length + 1}`, newId);
    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newId);
    setIsNewUserModalOpen(false);
  };
  
  const handleVocabSelect = useCallback(async (word: string) => {
    if (!selectedLanguageOption) return;
    setIsVocabLoading(true);
    setIsVocabModalOpen(true);
    setSelectedVocab(null);
    try {
        const definition = await geminiService.getVocabDefinition(word, selectedLanguageOption.value);
        setSelectedVocab(definition);
    } catch (error) {
        console.error("Failed to get vocab definition:", error);
        setSelectedVocab({ word, definition: "Could not load definition.", example: "Please try again." });
    } finally {
        setIsVocabLoading(false);
    }
  }, [selectedLanguageOption]);

  const handleCloseVocabModal = () => setIsVocabModalOpen(false);

  if (!activeProfile || (isLoading && !activeLanguageTrack?.lesson)) {
    return <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900"><Spinner /><p className="mt-4 text-lg">Loading AI Tutor...</p></div>;
  }

  const renderContent = () => {
    switch (activeProfile.appState) {
      case AppState.LANGUAGE_SELECTION:
        return (
          <LanguageSelection
            profiles={profiles}
            activeProfile={activeProfile}
            onSelectProfile={handleSelectProfile}
            onCreateNewProfile={() => setIsNewUserModalOpen(true)}
            onSelectLanguage={handleSelectLanguage}
            onUpdateLevel={handleUpdateLevel}
            onStart={startNewLesson}
            onContinue={handleContinue}
          />
        );
      case AppState.LESSON:
      case AppState.QUIZ:
        if (!activeLanguageTrack || !selectedLanguageOption) {
            // This should not happen if logic is correct, but it's a safe fallback.
            handleExitToMenu();
            return <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900"><Spinner /><p className="mt-4 text-lg">Returning to menu...</p></div>;
        }
        const currentQuestion = activeProfile.appState === AppState.QUIZ && activeLanguageTrack?.quiz.length > 0
            ? activeLanguageTrack.quiz[activeLanguageTrack.currentQuestionIndex]
            : undefined;

        return (
          <MainLayout>
            <ChatPanel
              conversation={activeLanguageTrack.conversation}
              onSendMessage={activeProfile.appState === AppState.LESSON ? handleSendMessage : handleQuizAnswer}
              isLoading={isLoading}
              appState={activeProfile.appState}
              onExit={handleExitToMenu}
              language={selectedLanguageOption}
              lesson={activeLanguageTrack.lesson}
              currentQuestion={currentQuestion}
              onOpenPractice={() => setIsPracticeModalOpen(true)}
            />
            <InsightsPanel 
              lesson={activeLanguageTrack.lesson}
              revealedCodeExampleTitles={activeLanguageTrack.revealedCodeExampleTitles} 
              onSelectVocab={handleVocabSelect}
            />
          </MainLayout>
        );
       case AppState.RESULTS:
            if (!activeLanguageTrack) return <div>Error: No active track for results.</div>;
            return <ResultsScreen report={activeLanguageTrack.masteryReport} onRevisit={handleRevisitLesson} onNext={handleNextLesson} />;
      default:
        return <div>Error: Unknown application state.</div>;
    }
  };

  return (
    <div className="h-screen w-screen font-sans">
      {renderContent()}
      {isVocabModalOpen && (
          <Modal title={isVocabLoading ? 'Loading Definition...' : `Define: ${selectedVocab?.word}`} onClose={handleCloseVocabModal}>
              {isVocabLoading ? (
                  <div className="flex justify-center items-center h-48"><Spinner /></div>
              ) : selectedVocab && (
                  <div>
                      <h3 className="text-3xl font-bold text-cyan-400 mb-4">{selectedVocab.word}</h3>
                      <p className="text-lg text-gray-300 mb-6">{selectedVocab.definition}</p>
                      <div>
                          <h4 className="font-semibold text-lg mb-2 text-white">Example:</h4>
                          <pre className="p-4 bg-gray-900 text-sm text-white rounded-lg overflow-x-auto border border-white/10"><code>{selectedVocab.example}</code></pre>
                      </div>
                  </div>
              )}
          </Modal>
      )}
      {isPracticeModalOpen && selectedLanguageOption && (
        <Modal title="Practice Sandbox" onClose={() => setIsPracticeModalOpen(false)} size="4xl">
            <div className="h-[70vh] flex flex-col">
                <CodeEditor language={selectedLanguageOption.value} />
            </div>
        </Modal>
      )}
      {isNewUserModalOpen && (
        <Modal title="Create New User?" onClose={() => setIsNewUserModalOpen(false)}>
            <p className="text-lg text-gray-300 mb-6">Are you sure you want to create a new user profile? This will create a new save slot.</p>
            <div className="flex justify-end gap-4">
                <button onClick={() => setIsNewUserModalOpen(false)} className="px-6 py-2 bg-gray-600 font-semibold rounded-lg hover:bg-gray-500 transition-colors">Cancel</button>
                <button onClick={handleConfirmCreateProfile} className="px-6 py-2 bg-cyan-600 font-semibold rounded-lg hover:bg-cyan-700 transition-colors">Confirm</button>
            </div>
        </Modal>
      )}
    </div>
  );
}
