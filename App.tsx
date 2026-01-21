
import React, { useState, useEffect } from 'react';
import { LESSONS } from './constants';
import { Lesson, LessonStep, UserContext } from './types';
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
import ImageGenerator from './components/ImageGenerator';
import PersonalizationModal from './components/PersonalizationModal';
import { getGeminiExplanation, getRecommendedModel } from './services/geminiService';
import { audioService } from './services/audioService';

interface AiResponse {
  explanation: string;
  suggestions: { label: string; parameter: string; value: number }[];
}

const InfoModal: React.FC<{ 
  isOpen: boolean; 
  type: 'about' | 'contact' | null; 
  onClose: () => void 
}> = ({ isOpen, type, onClose }) => {
  if (!isOpen || !type) return null;

  const content = {
    about: {
      title: "About the Compendium",
      body: "DataExplaining is an interactive curriculum dedicated to the visual intuition of machine intelligence. We believe that the mathematical bedrock of AI is best understood through tactile simulation and clear, non-abstract analogies. Each 'Manuscript' in our library is designed to reveal the structural logic behind a specific algorithm."
    },
    contact: {
      title: "Contact & Inquiries",
      body: "For editorial feedback, collaboration inquiries, or technical support regarding the Manuscript Library, please reach out to our desk. Our current protocol favors asynchronous correspondence to maintain the focus of our researchers."
    }
  };

  const active = content[type];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#121212]/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white max-w-md w-full p-10 shadow-2xl border border-black/5 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
        <span className="font-mono text-[10px] font-bold text-[#CCC] uppercase tracking-[0.4em] block mb-2">Protocol: {type.toUpperCase()}</span>
        <h3 className="text-2xl font-serif italic text-[#121212] mb-6">{active.title}</h3>
        <p className="text-sm text-[#666] leading-loose italic mb-8">{active.body}</p>
        <button onClick={onClose} className="w-full py-4 bg-[#121212] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#2A4D69] transition-all">Dismiss</button>
      </div>
    </div>
  );
};

const Footer: React.FC<{ onOpenInfo: (type: 'about' | 'contact') => void }> = ({ onOpenInfo }) => (
  <footer className="py-8 border-t border-black/5">
    <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
      <div className="flex items-center space-x-4">
        <span className="text-[7px] font-mono font-bold text-[#CCC] uppercase tracking-[0.3em]">© 2025 DataExplaining ● All Rights Reserved</span>
      </div>
      <div className="flex items-center space-x-12">
        <button 
          onClick={() => onOpenInfo('about')}
          className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#999] hover:text-[#121212] transition-colors"
        >
          About
        </button>
        <div className="w-1 h-1 bg-black/5 rotate-45"></div>
        <button 
          onClick={() => onOpenInfo('contact')}
          className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#999] hover:text-[#121212] transition-colors"
        >
          Contact
        </button>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-[7px] font-mono font-bold text-[#CCC] uppercase tracking-[0.3em]">Platform Protocol v1.4.2</span>
      </div>
    </div>
  </footer>
);

const App: React.FC = () => {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [aiData, setAiData] = useState<AiResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [activeAdjustment, setActiveAdjustment] = useState<{ parameter: string; value: number } | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);

  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
  const [recommendation, setRecommendation] = useState<{ lessonId: string, reason: string } | null>(null);
  const [isPersonalizationOn, setIsPersonalizationOn] = useState(true);

  const [infoModalType, setInfoModalType] = useState<'about' | 'contact' | null>(null);

  const step: LessonStep | undefined = activeLesson?.steps[currentStep];

  useEffect(() => {
    setHasInteracted(false);
    setIsTourActive(false);
    if (currentStep === 0) {
      const timer = setTimeout(() => setHasInteracted(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, activeLesson?.id]);

  useEffect(() => {
    setAiData(null);
    setShowAiHelper(false);
  }, [activeLesson?.id]);

  useEffect(() => {
    const fetchRecommendation = async () => {
      if (userContext && isPersonalizationOn) {
        const lessonTitles = LESSONS.map(l => l.title);
        const rec = await getRecommendedModel(lessonTitles, userContext);
        if (rec) setRecommendation(rec);
      } else {
        setRecommendation(null);
      }
    };
    fetchRecommendation();
  }, [userContext, isPersonalizationOn]);

  const handleNextStep = () => {
    audioService.play('click');
    if (activeLesson && currentStep < activeLesson.steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setActiveAdjustment(null);
    } else {
      setActiveLesson(null);
      setCurrentStep(0);
    }
  };

  const handleInteract = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      audioService.play('success');
    }
  };

  const askAi = async () => {
    if (!activeLesson || !step) return;
    audioService.play('blip');
    setIsAiLoading(true);
    setShowAiHelper(true);
    const params = ['slope', 'intercept', 'lr', 'threshold', 'bias', 'k', 'splitVal', 'complexity', 'w1', 'w2', 'angle', 'genderBias'];
    const data = await getGeminiExplanation(activeLesson.title, step.description, params);
    setAiData(data);
    setIsAiLoading(false);
  };

  const applyAdjustment = (param: string, val: number) => {
    handleInteract();
    setActiveAdjustment({ parameter: param, value: val });
    setTimeout(() => setActiveAdjustment(null), 100);
  };

  const startLesson = (lesson: Lesson) => {
    audioService.play('blip');
    setActiveLesson(lesson);
    setCurrentStep(0);
  };

  const commonProps = {
    onInteract: handleInteract,
    adjustment: activeAdjustment,
    currentStep: currentStep,
    onNext: handleNextStep,
    nextLabel: step?.actionLabel,
    isTourActive: isTourActive,
    onTourClose: () => setIsTourActive(false)
  };

  const activeUserContext = isPersonalizationOn ? userContext : null;

  const handleOpenInfo = (type: 'about' | 'contact') => {
    audioService.play('click');
    setInfoModalType(type);
  };

  return (
    <div className="h-screen bg-[#FDFCFB] text-[#121212] flex flex-col overflow-hidden">
      <nav className="h-14 border-b border-black/5 flex items-center justify-between px-6 bg-[#FDFCFB]/90 backdrop-blur-md z-[100] shrink-0">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveLesson(null)}>
          <div className="w-7 h-7 bg-[#121212] flex items-center justify-center text-[#FDFCFB] text-[10px] font-mono font-bold">DE</div>
          <span className="text-xs font-bold tracking-[0.2em] uppercase">DataExplaining</span>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4 border-r border-black/5 pr-6">
            <button 
              onClick={() => setIsPersonalizationOpen(true)}
              className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#666] hover:text-[#121212] transition-colors flex items-center"
            >
              <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              {userContext ? 'Profile' : 'Personalize'}
            </button>
          </div>
          <button onClick={() => setIsChatbotOpen(true)} className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#666] hover:text-[#121212]">
            Reference Desk
          </button>
        </div>
      </nav>

      <main className="flex-grow flex overflow-hidden">
        {!activeLesson ? (
          <div className="w-full overflow-y-auto">
            <div className="max-w-6xl mx-auto px-8 py-12">
              <header className="mb-12 border-l border-black/10 pl-10 max-w-4xl">
                <h1 className="text-5xl font-serif italic mb-4 leading-tight">An Interactive <br/>Compendium of Models.</h1>
                <p className="text-base text-[#666] leading-relaxed max-w-xl">A visual curriculum dedicated to the mathematical intuition behind modern algorithms.</p>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                {LESSONS.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} onClick={() => startLesson(lesson)} />
                ))}
              </div>
            </div>
            <Footer onOpenInfo={handleOpenInfo} />
          </div>
        ) : (
          <div className="flex w-full overflow-hidden">
            <aside className="w-56 border-r border-black/5 bg-[#F9F8F6] shrink-0 p-5 flex flex-col">
              <button onClick={() => setActiveLesson(null)} className="mb-6 text-[8px] font-bold uppercase tracking-[0.3em] text-[#999] hover:text-[#121212] flex items-center">
                <svg className="w-2.5 h-2.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                Library Home
              </button>
              <div className="mb-6">
                <span className="text-[8px] font-mono font-bold text-[#999] uppercase tracking-widest block mb-1">Vol. {activeLesson.category}</span>
                <h3 className="text-xs font-bold font-serif">{activeLesson.title}</h3>
              </div>
              <div className="space-y-2 flex-grow overflow-y-auto pr-2">
                {activeLesson.steps.map((s, idx) => (
                  <button key={idx} onClick={() => setCurrentStep(idx)} className={`w-full text-left py-1 text-[10px] font-bold transition-all border-l-2 pl-3 ${currentStep === idx ? 'text-[#121212] border-[#2A4D69] bg-white/50' : 'text-[#999] border-transparent hover:text-[#666]'}`}>
                    <span className="font-mono text-[8px] mr-1.5">{idx < currentStep ? '✓' : (idx + 1).toString().padStart(2, '0')}</span>
                    {s.title}
                  </button>
                ))}
              </div>
            </aside>

            <div className="w-[340px] shrink-0 border-r border-black/5 bg-white overflow-y-auto">
              <div className="p-8 flex flex-col h-full min-h-0">
                <div className="flex-grow">
                  <div className="mb-6">
                    <span className="font-mono text-[9px] text-[#999] uppercase tracking-[0.4em] mb-1.5 block">Figure {(currentStep + 1).toString().padStart(2, '0')}</span>
                    <h2 className="text-2xl font-serif italic mb-3">{step?.title}</h2>
                    <div className="w-8 h-px bg-[#2A4D69]"></div>
                  </div>
                  <p className="text-[#333] text-[13px] leading-relaxed mb-6 italic">{step?.description}</p>
                  <button onClick={askAi} className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#666] hover:text-[#2A4D69] flex items-center">
                    Consult References
                    {isAiLoading && <span className="ml-1.5 animate-pulse">...</span>}
                  </button>
                  {showAiHelper && aiData && (
                    <div className="mt-3 bg-[#F9F8F6] p-4 text-[11px] italic border-l border-[#2A4D69] space-y-2">
                      <p>"{aiData.explanation}"</p>
                      <div className="flex flex-wrap gap-1.5">
                        {aiData.suggestions.map((s, idx) => (
                          <button key={idx} onClick={() => applyAdjustment(s.parameter, s.value)} className="px-1.5 py-0.5 bg-white border border-black/5 text-[7px] font-bold uppercase tracking-widest text-[#2A4D69] hover:bg-[#2A4D69] hover:text-white transition-all">
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeLesson && <ImageGenerator modelName={activeLesson.title} userContext={activeUserContext} />}
                </div>
                <div className="mt-8 pt-4 border-t border-black/5 text-[7px] font-mono text-[#CCC] uppercase tracking-widest flex justify-between shrink-0">
                  <span>© DE-LIB-2025</span>
                  <span>MS {activeLesson.id.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="flex-grow flex items-center justify-center p-4 bg-[#FDFCFB] overflow-y-auto">
               <div className="w-full max-w-2xl">
                  {activeLesson.id === 'linear-regression' && <RegressionSim {...commonProps} showError={currentStep >= 2} />}
                  {activeLesson.id === 'gradient-descent' && <GradientDescentSim {...commonProps} />}
                  {activeLesson.id === 'logistic-regression' && <LogisticSim {...commonProps} />}
                  {activeLesson.id === 'knn' && <KNNSim {...commonProps} />}
                  {activeLesson.id === 'decision-trees' && <DecisionTreeSim {...commonProps} />}
                  {activeLesson.id === 'random-forest' && <RandomForestSim {...commonProps} />}
                  {activeLesson.id === 'svm' && <SVMSim {...commonProps} />}
                  {activeLesson.id === 'cnn-filters' && <CNNSim {...commonProps} />}
                  {activeLesson.id === 'overfitting' && <OverfittingSim {...commonProps} />}
                  {activeLesson.id === 'neural-networks' && <NeuralNetSim {...commonProps} />}
                  {activeLesson.id === 'clustering' && <ClusteringSim {...commonProps} />}
                  {activeLesson.id === 'pca' && <PCASim {...commonProps} />}
                  {activeLesson.id === 'reinforcement-learning' && <ReinforcementSim {...commonProps} />}
                  {activeLesson.id === 'algorithmic-bias' && <BiasSim {...commonProps} />}
               </div>
            </div>
          </div>
        )}
      </main>

      <AiChatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
      <PersonalizationModal 
        isOpen={isPersonalizationOpen} 
        initialData={userContext}
        onClose={() => setIsPersonalizationOpen(false)}
        onSave={(data) => { setUserContext(data); setIsPersonalizationOn(true); }}
        onClear={() => { setUserContext(null); setIsPersonalizationOn(false); setRecommendation(null); }}
      />
      <InfoModal 
        isOpen={infoModalType !== null} 
        type={infoModalType} 
        onClose={() => setInfoModalType(null)} 
      />
    </div>
  );
};

export default App;
