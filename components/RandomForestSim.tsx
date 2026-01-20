
import React, { useState, useMemo, useEffect } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

interface Props {
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isTourActive?: boolean;
  onTourClose?: () => void;
}

const TOUR_STEPS = [
  { message: "Random Forests use a 'Committee' of Decision Trees. Each tree is trained on a slightly different perspective of the data.", position: "top-[15%] left-[25%]" },
  { message: "Each tree icon represents an individual model. Watch them 'Vote' A or B as the ensemble runs.", position: "top-[40%] left-[45%]" },
  { message: "The final prediction is the majority result. This prevents one 'weird' tree from ruining the whole model.", position: "bottom-[30%] left-[20%]" }
];

const RandomForestSim: React.FC<Props> = ({ currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [votes, setVotes] = useState<('A' | 'B')[]>([]);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);

  useEffect(() => {
    if (isTourActive) setActiveTourIndex(0);
  }, [isTourActive]);

  useEffect(() => {
    setHasActuallyInteracted(currentStep === 0);
  }, [currentStep]);

  const markInteraction = () => {
    if (!hasActuallyInteracted) {
      setHasActuallyInteracted(true);
      onInteract?.();
    }
  };

  const runForest = () => {
    audioService.play('blip');
    setIsRunning(true);
    setVotes([]);
    let count = 0;
    const interval = setInterval(() => {
      // Skewed probability to make it look like a discovery
      const vote = Math.random() > 0.35 ? 'A' : 'B';
      setVotes(prev => [...prev, vote]);
      count++;
      if (count >= 15) {
        clearInterval(interval);
        setIsRunning(false);
        audioService.play('success');
        markInteraction();
      }
    }, 120);
  };

  const stats = useMemo(() => {
    if (votes.length === 0) return { verdict: 'Pending', consensus: 0 };
    const aCount = votes.filter(v => v === 'A').length, bCount = votes.filter(v => v === 'B').length;
    return { verdict: aCount >= bCount ? 'Class A' : 'Class B', consensus: (Math.max(aCount, bCount) / 15) * 100 };
  }, [votes]);

  const analysis = useMemo(() => {
    if (votes.length === 0) return { label: 'Ensemble Idle', color: 'text-slate-300', desc: 'Execute the forest protocol to initiate the voting process. 15 individual trees will be trained.' };
    if (stats.consensus > 85) return { label: 'High Consensus', color: 'text-emerald-600', desc: 'The committee is in strong agreement. The ensemble has successfully smoothed out individual variance.' };
    return { label: 'Divided Committee', color: 'text-amber-600', desc: 'The trees are split. This suggests high noise in the training data, but the majority vote remains stable.' };
  }, [votes, stats]);

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
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Consensus Rate</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{stats.consensus.toFixed(0)}%</div>
        </div>
      </div>
      
      <div className="w-full grid grid-cols-5 gap-6 p-10 bg-[#F9F8F6] border border-black/5 mb-12 relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className={`h-24 border bg-white transition-all duration-300 flex flex-col items-center justify-center rounded shadow-sm ${votes[i] ? (votes[i] === 'A' ? 'border-[#2A4D69] scale-100' : 'border-[#E11D48] scale-100') : 'border-black/5 scale-95 opacity-40'}`}>
            <svg className={`w-8 h-8 mb-2 transition-colors ${votes[i] ? (votes[i] === 'A' ? 'text-[#2A4D69]' : 'text-[#E11D48]') : 'text-black/10'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M11 19V13H5L12 2L19 13H13V19H11Z" />
            </svg>
            {votes[i] && <span className={`font-mono text-[9px] font-bold uppercase ${votes[i] === 'A' ? 'text-[#2A4D69]' : 'text-[#E11D48]'}`}>Vote {votes[i]}</span>}
          </div>
        ))}
        {votes.length > 0 && (
          <div className="col-span-5 mt-10 pt-10 border-t border-black/10 flex justify-center items-center space-x-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="text-center">
                <span className="text-[10px] font-mono text-[#999] uppercase tracking-[0.3em] block mb-3">Ensemble Verdict</span>
                <div className={`text-4xl font-serif italic ${stats.verdict === 'Class A' ? 'text-[#2A4D69]' : 'text-[#E11D48]'}`}>{stats.verdict}</div>
             </div>
             <div className="h-12 w-px bg-black/10"></div>
             <div className="flex space-x-8">
                <div className="text-center">
                   <span className="text-[8px] font-mono text-[#AAA] uppercase block mb-1">Votes A</span>
                   <span className="text-xl font-mono font-bold text-[#2A4D69]">{votes.filter(v => v === 'A').length}</span>
                </div>
                <div className="text-center">
                   <span className="text-[8px] font-mono text-[#AAA] uppercase block mb-1">Votes B</span>
                   <span className="text-xl font-mono font-bold text-[#E11D48]">{votes.filter(v => v === 'B').length}</span>
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-6">
          <button onClick={runForest} disabled={isRunning} className="w-full py-5 bg-[#121212] text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-[#2A4D69] transition-all disabled:opacity-50">
            {isRunning ? 'Auditing Committee...' : 'Synthesize Ensemble'}
          </button>
          <p className="text-[10px] text-[#666] leading-relaxed italic">By aggregating the results of many diverse trees, Random Forest avoids the trap of individual model error.</p>
        </div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#999] mb-4">Model intuition</h5>
          <p className="text-sm text-[#444] leading-relaxed italic font-serif">"{analysis.desc}"</p>
        </div>
      </div>

      <div className={`w-full p-8 border-2 border-dashed border-[#A5C9FF]/50 transition-all duration-500 bg-[#F9FBFF]/30 mt-4 ${hasActuallyInteracted ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={onNext} className="w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 px-10 font-bold uppercase tracking-[0.3em] text-sm transition-all shadow-xl flex items-center justify-center group">
          {nextLabel || 'Advance Manuscript'}
        </button>
      </div>
    </div>
  );
};

export default RandomForestSim;
