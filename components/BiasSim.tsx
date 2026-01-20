
import React, { useState, useEffect, useMemo } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

interface Candidate {
  id: number;
  name: string;
  gender: 'Male' | 'Female';
  experience: number; // Merit score
  status: 'pending' | 'hired' | 'rejected';
}

const INITIAL_CANDIDATES: Candidate[] = [
  { id: 1, name: "Alex P.", gender: 'Male', experience: 65, status: 'pending' },
  { id: 2, name: "Jordan S.", gender: 'Female', experience: 95, status: 'pending' },
  { id: 3, name: "Casey R.", gender: 'Male', experience: 30, status: 'pending' },
  { id: 4, name: "Taylor L.", gender: 'Female', experience: 82, status: 'pending' },
  { id: 5, name: "Morgan J.", gender: 'Female', experience: 88, status: 'pending' },
  { id: 6, name: "Riley K.", gender: 'Male', experience: 45, status: 'pending' }
];

interface Props {
  currentStep: number;
  adjustment?: { parameter: string; value: number } | null;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isTourActive?: boolean;
  onTourClose?: () => void;
}

const TOUR_STEPS = [
  { message: "Algorithmic bias occurs when historical human prejudices are encoded into training data.", position: "top-[20%] left-[30%]" },
  { message: "Adjust the 'Gender Skew' slider to simulate a biased historical hiring record where one group was unfairly preferred.", position: "top-[50%] left-[10%]" },
  { message: "The 'Bias Index' measures how much the model prioritizes gender over actual professional merit (Experience).", position: "top-[10%] right-[10%]" }
];

const BiasSim: React.FC<Props> = ({ currentStep, adjustment, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [genderBias, setGenderBias] = useState(0.85); // 0.85 = high bias towards male in training data
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);

  useEffect(() => {
    if (isTourActive) setActiveTourIndex(0);
  }, [isTourActive]);

  useEffect(() => {
    if (adjustment?.parameter === 'genderBias') { setGenderBias(adjustment.value); markInteraction(); }
  }, [adjustment]);

  useEffect(() => {
    setCandidates(INITIAL_CANDIDATES);
    setShowResults(false);
    setHasActuallyInteracted(currentStep === 0);
  }, [currentStep]);

  const markInteraction = () => {
    if (!hasActuallyInteracted) {
      setHasActuallyInteracted(true);
      onInteract?.();
    }
  };

  const runModel = () => {
    audioService.play('blip');
    markInteraction();
    setIsProcessing(true);
    setTimeout(() => {
      setCandidates(prev => prev.map(c => {
        // Model logic: weight experience at 30% and gender (proxy for historical preference) at 70%
        const genderScore = c.gender === 'Male' ? (genderBias * 100) : ((1 - genderBias) * 100);
        const finalScore = (c.experience * 0.3) + (genderScore * 0.7);
        return { ...c, status: finalScore > 50 ? 'hired' : 'rejected' };
      }));
      setIsProcessing(false);
      setShowResults(true);
      audioService.play('success');
    }, 1500);
  };

  const biasIndex = Math.abs(0.5 - genderBias) * 200;

  const analysis = useMemo(() => {
    if (!showResults && !isProcessing) return { label: 'Data Ingestion Phase', color: 'text-slate-300', desc: 'Adjust the historical bias in the training set before executing the automated decision protocol.' };
    if (biasIndex < 15) return { label: 'Meritocratic Alignment', color: 'text-emerald-600', desc: 'The model decisions are largely based on individual merit. Systematic disparity is negligible.' };
    return { label: 'Systemic Proxy Bias', color: 'text-rose-600', desc: 'The model has learned a proxy for historical prejudice. Candidates with high merit are being rejected due to systemic skew.' };
  }, [biasIndex, showResults, isProcessing]);

  const handleTourNext = () => {
    audioService.play('click');
    if (activeTourIndex < TOUR_STEPS.length - 1) setActiveTourIndex(prev => prev + 1);
    else onTourClose?.();
  };

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative">
      {isTourActive && (
        <GuidanceTooltip message={TOUR_STEPS[activeTourIndex].message} position={TOUR_STEPS[activeTourIndex].position} onNext={handleTourNext} onClose={() => onTourClose?.()} isLast={activeTourIndex === TOUR_STEPS.length - 1} />
      )}
      
      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic transition-colors duration-500 ${analysis.color}`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Systemic Bias Index</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{biasIndex.toFixed(0).padStart(3, '0')}</div>
        </div>
      </div>

      <div className="w-full mb-12">
        <div className="bg-[#FDFCFB] border border-black/5 p-10">
          {currentStep === 0 ? (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-[#999] uppercase tracking-widest">Historical Skew: {genderBias < 0.5 ? 'Favors Female' : 'Favors Male'}</span>
                  <div className="flex space-x-4">
                    <div className="w-3 h-3 bg-[#E11D48]" /> <span className="text-[10px] font-mono text-[#E11D48] uppercase">Bias Present</span>
                  </div>
               </div>
               <input type="range" min="0.1" max="0.9" step="0.05" value={genderBias} onChange={(e) => { setGenderBias(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px appearance-none bg-black/10 rounded-full cursor-pointer accent-[#2A4D69]" />
               <div className="flex justify-between font-mono text-[8px] text-[#CCC] uppercase tracking-[0.2em]">
                  <span>100% Female Preference</span>
                  <span>50/50 Neutral</span>
                  <span>100% Male Preference</span>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {candidates.map(c => (
                <div key={c.id} className={`p-6 border transition-all duration-700 relative overflow-hidden flex items-center justify-between ${showResults ? (c.status === 'hired' ? 'bg-[#F9F8F6] border-emerald-500/30' : 'bg-white border-rose-500/10 opacity-60') : 'bg-white border-black/5'}`}>
                  <div>
                    <div className="font-serif italic text-lg mb-1">{c.name}</div>
                    <div className="flex items-center space-x-3">
                       <span className="font-mono text-[8px] text-[#999] uppercase tracking-widest">{c.gender}</span>
                       <div className="w-1 h-1 bg-black/10 rounded-full" />
                       <span className="font-mono text-[8px] text-[#2A4D69] font-bold uppercase tracking-widest">Experience: {c.experience}%</span>
                    </div>
                  </div>
                  {showResults && (
                    <div className={`font-mono text-[10px] font-bold uppercase tracking-widest ${c.status === 'hired' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {c.status}
                    </div>
                  )}
                  {/* Merit Indicator vs Decision */}
                  {showResults && c.experience > 80 && c.status === 'rejected' && (
                    <div className="absolute top-0 right-0 p-1 bg-rose-600 text-white text-[6px] font-bold uppercase tracking-widest">Merit Rejected</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
        <div className="flex flex-col justify-center">
          {currentStep === 1 && (
            <button onClick={runModel} disabled={isProcessing} className="w-full py-4 text-[10px] font-bold uppercase tracking-[0.3em] bg-[#121212] text-white hover:bg-[#2A4D69] disabled:opacity-50 transition-all">
              {isProcessing ? 'Auditing Historical Protocols...' : 'Execute Prediction Algorithm'}
            </button>
          )}
          {currentStep === 0 && (
            <p className="text-[10px] text-[#666] leading-relaxed italic">The slider determines the 'ground truth' of your training set. If the training data shows a bias, the model will identify it as a pattern to be replicated.</p>
          )}
        </div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#999] mb-4">Model intuition</h5>
          <p className="text-sm text-[#444] leading-relaxed italic font-serif">
            "{analysis.desc}"
          </p>
        </div>
      </div>

      <div className={`w-full p-8 border-2 border-dashed border-[#A5C9FF]/50 transition-all duration-500 bg-[#F9FBFF]/30 mt-4 ${hasActuallyInteracted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <button onClick={(e) => { e.stopPropagation(); onNext?.(); }} className="w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 px-10 font-bold uppercase tracking-[0.3em] text-sm transition-all shadow-xl flex items-center justify-center group">
          {nextLabel || 'Advance Manuscript'}
        </button>
      </div>
    </div>
  );
};

export default BiasSim;
