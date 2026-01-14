
import React, { useState, useEffect } from 'react';
import { LESSONS } from './constants';
import { Lesson, LessonStep } from './types';
import LessonCard from './components/LessonCard';
import RegressionSim from './components/RegressionSim';
import BiasSim from './components/BiasSim';
import OverfittingSim from './components/OverfittingSim';
import ClusteringSim from './components/ClusteringSim';
import KNNSim from './components/KNNSim';
import DecisionTreeSim from './components/DecisionTreeSim';
import SVMSim from './components/SVMSim';
import NeuralNetSim from './components/NeuralNetSim';
import PCASim from './components/PCASim';
import GradientDescentSim from './components/GradientDescentSim';
import LogisticSim from './components/LogisticSim';
import RandomForestSim from './components/RandomForestSim';
import CNNSim from './components/CNNSim';
import ReinforcementSim from './components/ReinforcementSim';
import AiChatbot from './components/AiChatbot';
import { getGeminiExplanation } from './services/geminiService';

const App: React.FC = () => {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const step: LessonStep | undefined = activeLesson?.steps[currentStep];

  const handleNextStep = () => {
    if (activeLesson && currentStep < activeLesson.steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setAiResponse(null); // Clear previous AI help
    } else {
      setActiveLesson(null);
      setCurrentStep(0);
    }
  };

  const askAi = async () => {
    if (!activeLesson || !step) return;
    setIsAiLoading(true);
    setShowAiHelper(true);
    const response = await getGeminiExplanation(activeLesson.title, step.description);
    setAiResponse(response);
    setIsAiLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveLesson(null)}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">D</div>
            <span className="text-xl font-bold tracking-tight">DataExplaining</span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-600">
            <a href="#" className="hover:text-blue-600">Catalog</a>
            <a href="#" className="hover:text-blue-600">Playground</a>
            <button 
              onClick={() => setIsChatbotOpen(true)}
              className="hover:text-blue-600 font-bold flex items-center"
            >
              <span className="mr-1.5">Ask AI</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {!activeLesson ? (
          <section className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                Master Data Science, <span className="text-blue-600">Interactively.</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                No dry textbooks or long videos. Learn ML models by breaking them, building them, and seeing how they work under the hood.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {LESSONS.map((lesson) => (
                <LessonCard 
                  key={lesson.id} 
                  lesson={lesson} 
                  onClick={() => {
                    setActiveLesson(lesson);
                    setCurrentStep(0);
                  }} 
                />
              ))}
            </div>
          </section>
        ) : (
          <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
            {/* Sidebar Navigation */}
            <aside className="hidden lg:block w-72 bg-gray-50 border-r border-gray-200 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
              <div className="p-6">
                <button 
                  onClick={() => setActiveLesson(null)}
                  className="text-gray-500 flex items-center text-xs font-bold uppercase tracking-wider mb-8 hover:text-blue-600 transition-colors"
                >
                  <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                  </svg>
                  Exit Lesson
                </button>

                <div className="mb-6">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">{activeLesson.category}</span>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">{activeLesson.title}</h3>
                </div>

                <div className="space-y-1">
                  {activeLesson.steps.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentStep(idx);
                        setAiResponse(null);
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-start space-x-3 group ${
                        currentStep === idx 
                        ? 'bg-white shadow-sm border border-gray-200 ring-2 ring-blue-500/10' 
                        : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 transition-colors ${
                        currentStep === idx ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500 group-hover:bg-gray-300'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className={`text-sm font-bold leading-tight ${currentStep === idx ? 'text-gray-900' : 'text-gray-500'}`}>
                          {s.title}
                        </p>
                        {currentStep === idx && (
                          <div className="w-full h-1 bg-blue-100 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-blue-500 animate-in slide-in-from-left duration-1000" style={{ width: '100%' }}></div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Content Column */}
            <div className="w-full lg:w-96 xl:w-[450px] bg-white border-r border-gray-200 p-8 flex flex-col h-[calc(100vh-64px)] overflow-y-auto">
              <div className="flex-grow">
                <div className="lg:hidden mb-6 flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                   <button onClick={() => setActiveLesson(null)} className="text-blue-600 font-bold text-xs">Back</button>
                   <span className="text-[10px] font-black uppercase text-gray-400">Step {currentStep + 1} of {activeLesson.steps.length}</span>
                </div>
                
                <div className="mb-6">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Active Step</span>
                  <h2 className="text-3xl font-bold mt-2 leading-tight">{step?.title}</h2>
                </div>
                
                <p className="text-gray-700 leading-relaxed text-lg mb-8">
                  {step?.description}
                </p>

                <div className="flex space-x-3 mb-8">
                  <button 
                    onClick={askAi}
                    className="flex-1 bg-gray-50 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 15.657a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM6.464 14.95a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 011.414-1.414l.707.707z" />
                    </svg>
                    Explain this simply
                  </button>
                </div>

                {showAiHelper && (
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-800 uppercase">AI Explainer</span>
                      <button onClick={() => setShowAiHelper(false)} className="text-blue-400 hover:text-blue-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    {isAiLoading ? (
                      <div className="flex space-x-2 items-center justify-center py-4">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                      </div>
                    ) : (
                      <p className="text-sm text-blue-900 leading-relaxed italic">
                        "{aiResponse}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-100 mt-auto">
                <button 
                  onClick={handleNextStep}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center group"
                >
                  {currentStep === activeLesson.steps.length - 1 ? 'Finish Lesson' : step?.actionLabel || 'Continue'}
                  <svg className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Right Column: Interaction */}
            <div className="flex-grow bg-gray-100 flex items-center justify-center p-6 md:p-12 relative overflow-hidden h-[calc(100vh-64px)]">
               {/* Decorative background elements */}
               <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-200 rounded-full opacity-30 blur-3xl pointer-events-none"></div>
               <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-200 rounded-full opacity-30 blur-3xl pointer-events-none"></div>

               <div className="z-10 w-full flex justify-center h-full items-center">
                  <div className="w-full max-w-4xl transform scale-90 md:scale-100 origin-center">
                    {/* Dynamic Interactive Component Rendering */}
                    {activeLesson.id === 'linear-regression' && (
                      <RegressionSim showError={currentStep >= 2} />
                    )}

                    {activeLesson.id === 'gradient-descent' && (
                      <GradientDescentSim />
                    )}

                    {activeLesson.id === 'logistic-regression' && (
                      <LogisticSim />
                    )}

                    {activeLesson.id === 'overfitting' && (
                      <OverfittingSim />
                    )}

                    {activeLesson.id === 'clustering' && (
                      <ClusteringSim />
                    )}

                    {activeLesson.id === 'knn' && (
                      <KNNSim />
                    )}

                    {activeLesson.id === 'decision-trees' && (
                      <DecisionTreeSim />
                    )}

                    {activeLesson.id === 'random-forest' && (
                      <RandomForestSim />
                    )}

                    {activeLesson.id === 'svm' && (
                      <SVMSim />
                    )}

                    {activeLesson.id === 'cnn-filters' && (
                      <CNNSim />
                    )}

                    {activeLesson.id === 'neural-networks' && (
                      <NeuralNetSim />
                    )}

                    {activeLesson.id === 'pca' && (
                      <PCASim />
                    )}

                    {activeLesson.id === 'reinforcement-learning' && (
                      <ReinforcementSim />
                    )}

                    {activeLesson.id === 'algorithmic-bias' && (
                      <BiasSim step={currentStep} />
                    )}
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button for AI Chatbot */}
      {!isChatbotOpen && (
        <button 
          onClick={() => setIsChatbotOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 transition-all hover:scale-110 active:scale-95 z-[90]"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
        </button>
      )}

      {/* AI Chatbot Component */}
      <AiChatbot 
        isOpen={isChatbotOpen} 
        onClose={() => setIsChatbotOpen(false)} 
      />

      {/* Footer - Only show on home screen */}
      {!activeLesson && (
        <footer className="bg-white border-t border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <p>© 2024 DataExplaining. Empowering the next generation of data scientists.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-blue-600">Privacy</a>
              <a href="#" className="hover:text-blue-600">Terms</a>
              <a href="#" className="hover:text-blue-600">Github</a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
