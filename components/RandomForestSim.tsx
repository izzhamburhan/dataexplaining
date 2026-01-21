
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

const RandomForestSim: React.FC<Props> = ({ currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [votes, setVotes] = useState<('A' | 'B')[]>([]);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);

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

  return (
    <div className="bg-white p-6 border border-black/5 shadow-[0_20px_60px_rgba(0,0,0,0.03)] w-full max-w-3xl flex flex-col items-center relative">
      <div className="w-full flex justify-between items-end mb-6 border-b border-black/5 pb-3">
        <div>
          <h4 className="font-mono text-[8px] font-bold uppercase tracking-widest text-[#CCC] mb-1">Diagnostic Output</h4>
          <div className={`text-lg font-serif italic ${analysis.color}`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[8px] font-bold uppercase tracking-widest text-[#CCC] mb-1">Consensus</div>
          <div className="text-lg font-mono font-bold tabular-nums">{stats.consensus.toFixed(0)}%</div>
        </div>
      </div>
      
      <div className="w-full grid grid-cols-5 gap-3 p-6 bg-[#F9F8F6] border border-black/5 mb-6 shadow-inner">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className={`h-14 border bg-white transition-all duration-200 flex flex-col items-center justify-center rounded-sm shadow-sm ${votes[i] ? (votes[i] === 'A' ? 'border-[#2A4D69]' : 'border-[#E11D48]') : 'border-black/5 opacity-40'}`}>
            <svg className={`w-5 h-5 mb-1 ${votes[i] ? (votes[i] === 'A' ? 'text-[#2A4D69]' : 'text-[#E11D48]') : 'text-black/10'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M11 19V13H5L12 2L19 13H13V19H11Z" /></svg>
            <span className={`font-mono text-[7px] font-bold ${votes[i] === 'A' ? 'text-[#2A4D69]' : 'text-[#E11D48]'}`}>{votes[i] || '•'}</span>
          </div>
        ))}
      </div>

      <div className="w-full grid grid-cols-2 gap-8 items-center mb-6">
        <div className="space-y-4">
          <button onClick={runForest} disabled={isRunning} className="w-full py-4 bg-[#121212] text-white text-[9px] font-bold uppercase tracking-widest hover:bg-[#2A4D69] transition-all disabled:opacity-50">
            {isRunning ? 'Auditing...' : 'Run Ensemble'}
          </button>
          <p className="text-[9px] text-[#666] leading-tight italic">Wisdom of the crowd avoids individual tree errors.</p>
        </div>
        <div className="bg-[#F9F8F6] p-4 border-l-2 border-black/5">
          <p className="text-[11px] text-[#444] italic font-serif">"{analysis.desc}"</p>
        </div>
      </div>

      <button onClick={onNext} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-4 font-bold uppercase tracking-widest text-[10px] transition-all shadow-lg ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
        {nextLabel || 'Advance Manuscript'}
      </button>
    </div>
  );
};

export default RandomForestSim;
