
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
  { message: "A Random Forest is an 'Ensemble' method—it uses multiple Decision Trees to reach a verdict.", position: "top-[20%] left-[10%]" },
  { message: "Each square represents a single tree in the forest. Some might be wrong, but their collective vote is highly reliable.", position: "top-[40%] left-[30%]" },
  { message: "The final prediction is based on the majority vote. This avoids the high variance of a single tree.", position: "bottom-[20%] left-[20%]" }
];

const RandomForestSim: React.FC<Props> = ({ currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [votes, setVotes] = useState<('A' | 'B')[]>([]);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);

  useEffect(() => { if (isTourActive) setActiveTourIndex(0); }, [isTourActive]);
  useEffect(() => { setHasActuallyInteracted(currentStep === 0); }, [currentStep]);

  const markInteraction = () => { if (!hasActuallyInteracted) { setHasActuallyInteracted(true); onInteract?.(); } };

  const runForest = () => {
    audioService.play('blip');
    setIsRunning(true);
    setVotes([]);
    let count = 0;
    const interval = setInterval(() => {
      const vote = Math.random() > 0.35 ? 'A' : 'B';
      setVotes(prev => [...prev, vote]);
      count++;
      if (count >= 15) {
        clearInterval(interval);
        setIsRunning(false);
        audioService.play('success');
        markInteraction();
      }
    }, 80);
  };

  const stats = useMemo(() => {
    if (votes.length === 0) return { verdict: 'Pending', consensus: 0 };
    const aCount = votes.filter(v => v === 'A').length, bCount = votes.filter(v => v === 'B').length;
    return { verdict: aCount >= bCount ? 'Class A' : 'Class B', consensus: (Math.max(aCount, bCount) / 15) * 100 };
  }, [votes]);

  const analysis = useMemo(() => {
    if (votes.length === 0) return { label: 'Ensemble Idle', color: 'text-slate-300', desc: 'Initialize voting protocol.' };
    return { label: stats.consensus > 85 ? 'Strong Consensus' : 'Divided Vote', color: stats.consensus > 85 ? 'text-emerald-600' : 'text-amber-600', desc: stats.consensus > 85 ? 'High confidence ensemble.' : 'Balanced data signals.' };
  }, [votes, stats]);

  const handleTourNext = () => {
    audioService.play('click');
    if (activeTourIndex < TOUR_STEPS.length - 1) setActiveTourIndex(prev => prev + 1);
    else onTourClose?.();
  };

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-none flex flex-col items-center relative select-none transition-all duration-700">
      {isTourActive && (
        <GuidanceTooltip 
          message={TOUR_STEPS[activeTourIndex].message}
          position={TOUR_STEPS[activeTourIndex].position}
          onNext={handleTourNext}
          onClose={() => onTourClose?.()}
          isLast={activeTourIndex === TOUR_STEPS.length - 1}
        />
      )}
      <div className="w-full flex justify-between items-end mb-10 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Consensus</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{stats.consensus.toFixed(0)}%</div>
        </div>
      </div>
      
      <div className="w-full grid grid-cols-5 gap-6 p-10 bg-[#F9F8F6] border border-black/5 mb-12 shadow-inner">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className={`h-24 border bg-white transition-all duration-300 flex flex-col items-center justify-center rounded-sm shadow-sm ${votes[i] ? (votes[i] === 'A' ? 'border-[#2A4D69] ring-2 ring-[#2A4D69]/5' : 'border-[#E11D48] ring-2 ring-[#E11D48]/5') : 'border-black/5 opacity-40'}`}>
            <svg className={`w-8 h-8 mb-2 ${votes[i] ? (votes[i] === 'A' ? 'text-[#2A4D69]' : 'text-[#E11D48]') : 'text-black/10'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M11 19V13H5L12 2L19 13H13V19H11Z" /></svg>
            <span className={`font-mono text-[9px] font-bold tracking-widest ${votes[i] === 'A' ? 'text-[#2A4D69]' : 'text-[#E11D48]'}`}>{votes[i] || '•'}</span>
          </div>
        ))}
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-8">
        <div className="space-y-6">
          <button onClick={runForest} disabled={isRunning} className="w-full py-5 bg-[#121212] text-white text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-[#2A4D69] transition-all disabled:opacity-50 shadow-xl">
            {isRunning ? 'Auditing Ensemble...' : 'Run Ensemble Protocol'}
          </button>
          <p className="text-[10px] text-[#999] leading-relaxed italic uppercase tracking-widest font-mono">Wisdom of the crowd avoids individual tree errors through variance reduction.</p>
        </div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5">
          <p className="text-sm text-[#444] italic font-serif leading-relaxed">"{analysis.desc}"</p>
        </div>
      </div>

      <button onClick={onNext} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-5 font-bold uppercase tracking-[0.3em] text-xs transition-all shadow-xl ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
        {nextLabel || 'Advance Manuscript'}
      </button>
    </div>
  );
};

export default RandomForestSim;
