
import React, { useState, useMemo, useEffect } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

interface Props {
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
}

const RandomForestSim: React.FC<Props> = ({ currentStep = 0, onInteract, onNext, nextLabel }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [votes, setVotes] = useState<('Apple' | 'Orange')[]>([]);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);

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
        setVotes(prev => [...prev, Math.random() > 0.4 ? 'Apple' : 'Orange']);
        count++;
        if (count >= 15) {
            clearInterval(interval);
            setIsRunning(false);
            audioService.play('success');
            markInteraction();
        }
    }, 100);
  };

  const stats = useMemo(() => {
    if (votes.length === 0) return { verdict: 'Pending', consensus: 0 };
    const appleCount = votes.filter(v => v === 'Apple').length;
    const orangeCount = votes.filter(v => v === 'Orange').length;
    return { verdict: appleCount > orangeCount ? 'Apple' : 'Orange', consensus: (Math.max(appleCount, orangeCount) / 15) * 100 };
  }, [votes]);

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative">
      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className="text-2xl font-serif italic text-emerald-600">Ensemble Voting Analysis</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Consensus Rate</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{stats.consensus.toFixed(0)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 w-full mb-12">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className={`h-16 flex flex-col items-center justify-center border transition-all duration-300 ${votes[i] ? (votes[i] === 'Apple' ? 'bg-[#F9F8F6] border-[#2A4D69]' : 'bg-[#F9F8F6] border-[#E11D48]') : 'bg-transparent border-black/5'}`}>
            <div className={`w-1.5 h-1.5 rotate-45 mb-2 ${votes[i] ? (votes[i] === 'Apple' ? 'bg-[#2A4D69]' : 'bg-[#E11D48]') : 'bg-black/5'}`} />
          </div>
        ))}
      </div>

      <button onClick={runForest} disabled={isRunning} className={`w-full max-w-sm py-4 text-[10px] font-bold uppercase tracking-[0.3em] transition-all border ${isRunning ? 'bg-transparent border-black/10 text-[#666]' : 'bg-[#121212] border-[#121212] text-white hover:bg-[#2A4D69]'}`}>{isRunning ? 'Processing Trees...' : 'Execute Classification'}</button>

      {/* NEXT STEP BUTTON AREA */}
      <div className={`w-full p-8 border-2 border-dashed border-[#A5C9FF]/50 transition-all duration-500 bg-[#F9FBFF]/30 mt-12 ${hasActuallyInteracted ? 'opacity-100' : 'opacity-0'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); onNext?.(); }}
          className="w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 px-10 font-bold uppercase tracking-[0.3em] text-sm transition-all shadow-xl flex items-center justify-center group"
        >
          {nextLabel || 'Advance Manuscript'}
          <svg className="ml-4 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </button>
      </div>
    </div>
  );
};

export default RandomForestSim;
