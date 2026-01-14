
import React, { useState } from 'react';
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
      setAiResponse(null);
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
    <div className="min-h-screen bg-[#FDFCFB] text-[#121212] selection:bg-slate-900 selection:text-white flex flex-col">
      {/* Editorial Header */}
      <nav className="h-16 border-b border-black/5 flex items-center justify-between px-8 bg-[#FDFCFB] z-50 shrink-0">
        <div 
          className="flex items-center space-x-4 cursor-pointer" 
          onClick={() => setActiveLesson(null)}
        >
          <div className="w-8 h-8 bg-[#121212] flex items-center justify-center text-[#FDFCFB] text-xs font-mono font-bold tracking-tighter">DE</div>
          <span className="text-sm font-bold tracking-[0.2em] uppercase">DataExplaining</span>
        </div>
        
        <div className="flex items-center space-x-8">
          <button 
            onClick={() => setIsChatbotOpen(true)}
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#666] hover:text-[#121212] transition-colors flex items-center"
          >
            <span className="w-1.5 h-1.5 bg-[#2A4D69] rounded-full mr-2"></span>
            Reference Desk
          </button>
        </div>
      </nav>

      <main className="flex-grow overflow-hidden">
        {!activeLesson ? (
          <div className="max-w-6xl mx-auto px-8 py-24">
            <header className="mb-24 border-l border-black/10 pl-12 max-w-3xl">
              <h1 className="text-6xl font-serif italic mb-8 leading-tight">
                An Interactive <br/>Compendium of Models.
              </h1>
              <p className="text-xl text-[#666] font-normal leading-relaxed max-w-xl">
                A visual curriculum dedicated to the mathematical intuition behind modern algorithms. Precision tools for structural learning.
              </p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
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
          </div>
        ) : (
          <div className="flex h-full">
            {/* The Index (Table of Contents) */}
            <aside className="w-64 border-r border-black/5 flex flex-col bg-[#F9F8F6] shrink-0">
              <div className="p-8">
                <button 
                  onClick={() => setActiveLesson(null)}
                  className="mb-12 text-[9px] font-bold uppercase tracking-[0.3em] text-[#999] hover:text-[#121212] transition-colors flex items-center group"
                >
                  <svg className="w-3 h-3 mr-2 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                  Library Home
                </button>

                <div className="mb-12">
                  <span className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest block mb-1">Vol. {activeLesson.category}</span>
                  <h3 className="text-sm font-bold leading-tight font-serif">{activeLesson.title}</h3>
                </div>

                <div className="space-y-4">
                  {activeLesson.steps.map((s, idx) => {
                    const isActive = currentStep === idx;
                    const isCompleted = idx < currentStep;
                    return (
                      <button
                        key={idx}
                        onClick={() => { setCurrentStep(idx); setAiResponse(null); }}
                        className={`w-full text-left flex items-start py-1 transition-all ${isActive ? 'text-[#121212]' : 'text-[#999] hover:text-[#666]'}`}
                      >
                        <span className="font-mono text-[10px] mr-3 mt-1 leading-none w-4 shrink-0">
                          {isCompleted ? '✓' : (idx + 1).toString().padStart(2, '0')}
                        </span>
                        <span className={`text-xs font-bold leading-relaxed ${isActive ? 'border-b border-[#2A4D69]' : ''}`}>{s.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* The Manuscript (Text) */}
            <div className="w-[480px] shrink-0 border-r border-black/5 bg-white flex flex-col h-full shadow-[20px_0_40px_rgba(0,0,0,0.01)]">
              <div className="flex-grow p-12 overflow-y-auto">
                <div className="mb-16">
                  <div className="font-mono text-[10px] font-bold text-[#999] uppercase tracking-[0.4em] mb-4">Figure {(currentStep + 1).toString().padStart(2, '0')}</div>
                  <h2 className="text-4xl font-serif italic mb-8">{step?.title}</h2>
                  <div className="w-12 h-px bg-[#2A4D69]"></div>
                </div>
                
                <p className="text-[#333] leading-loose text-base mb-16 font-normal">
                  {step?.description}
                </p>

                <div className="pt-8 border-t border-black/5">
                  <button 
                    onClick={askAi}
                    className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#666] hover:text-[#2A4D69] transition-all inline-flex items-center"
                  >
                    Consult Reference Material
                    {isAiLoading && <span className="ml-2 flex space-x-0.5"><span className="w-0.5 h-0.5 bg-[#2A4D69] animate-pulse"></span><span className="w-0.5 h-0.5 bg-[#2A4D69] animate-pulse delay-75"></span></span>}
                  </button>

                  {showAiHelper && !isAiLoading && (
                    <div className="mt-6 bg-[#F9F8F6] p-6 text-sm text-[#444] leading-relaxed border-l border-[#2A4D69] font-normal italic">
                      "{aiResponse}"
                    </div>
                  )}
                </div>
              </div>

              <div className="p-12 bg-[#F9F8F6] border-t border-black/5">
                <button 
                  onClick={handleNextStep}
                  className="w-full bg-[#121212] text-[#FDFCFB] py-5 text-[11px] font-bold uppercase tracking-[0.4em] hover:bg-[#2A4D69] transition-all flex items-center justify-center group"
                >
                  {currentStep === activeLesson.steps.length - 1 ? 'Archive Unit' : step?.actionLabel || 'Advance Manuscript'}
                  <svg className="ml-4 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </button>
              </div>
            </div>

            {/* The Laboratory (Simulation) */}
            <div className="flex-grow flex items-center justify-center p-16 bg-[#FDFCFB] overflow-hidden relative">
               {/* Technical Background Details */}
               <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

               <div className="w-full h-full flex items-center justify-center relative">
                  <div className="w-full max-w-4xl p-8 bg-white border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] transition-all duration-700">
                    {activeLesson.id === 'linear-regression' && <RegressionSim showError={currentStep >= 2} />}
                    {activeLesson.id === 'gradient-descent' && <GradientDescentSim />}
                    {activeLesson.id === 'logistic-regression' && <LogisticSim />}
                    {activeLesson.id === 'overfitting' && <OverfittingSim />}
                    {activeLesson.id === 'clustering' && <ClusteringSim />}
                    {activeLesson.id === 'knn' && <KNNSim />}
                    {activeLesson.id === 'decision-trees' && <DecisionTreeSim />}
                    {activeLesson.id === 'random-forest' && <RandomForestSim />}
                    {activeLesson.id === 'svm' && <SVMSim />}
                    {activeLesson.id === 'cnn-filters' && <CNNSim />}
                    {activeLesson.id === 'neural-networks' && <NeuralNetSim />}
                    {activeLesson.id === 'pca' && <PCASim />}
                    {activeLesson.id === 'reinforcement-learning' && <ReinforcementSim />}
                    {activeLesson.id === 'algorithmic-bias' && <BiasSim step={currentStep} />}
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>

      <AiChatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
    </div>
  );
};

export default App;
