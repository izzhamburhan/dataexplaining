
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';
import { getMicroExplanation } from '../services/geminiService';
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
  { message: "In Phase 2, we introduce 'Historical Bias'. Watch how individual trees learn from flawed data.", position: "top-[40%] left-[30%]" },
  { message: "Even with a high consensus, the 'Wisdom of the Crowd' can become a 'Groupthink of Prejudice'.", position: "bottom-[20%] left-[20%]" }
];

const RandomForestSim: React.FC<Props> = ({ currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [votes, setVotes] = useState<('A' | 'B')[]>([]);
  const [biasSkew, setBiasSkew] = useState(0.5); 
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);
  const [geminiDesc, setGeminiDesc] = useState<string>('Syncing...');
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const debounceTimer = useRef<any>(null);

  const isIntro = currentStep === 0;
  const isBiasPhase = currentStep === 1;

  useEffect(() => { if (isTourActive) setActiveTourIndex(0); }, [isTourActive]);
  useEffect(() => { 
    setHasActuallyInteracted(isIntro); 
    setVotes([]);
  }, [currentStep, isIntro]);

  const markInteraction = () => { if (!hasActuallyInteracted) { setHasActuallyInteracted(true); onInteract?.(); } };

  const runForest = () => {
    audioService.play('blip');
    setIsRunning(true);
    setVotes([]);
    let count = 0;
    const baseProbability = 0.35; 
    const effectiveProb = isBiasPhase ? baseProbability + (biasSkew - 0.5) * 0.8 : baseProbability;
    const interval = setInterval(() => {
      const vote = Math.random() > effectiveProb ? 'A' : 'B';
      setVotes(prev => [...prev, vote]);
      count++;
      if (count >= 15) { clearInterval(interval); setIsRunning(false); audioService.play('success'); markInteraction(); }
    }, 60);
  };

  const stats = useMemo(() => {
    if (votes.length === 0) return { verdict: 'Pending', consensus: 0, impactGap: 0 };
    const aCount = votes.filter(v => v === 'A').length, bCount = votes.filter(v => v === 'B').length;
    return { verdict: aCount >= bCount ? 'Class A' : 'Class B', consensus: (Math.max(aCount, bCount) / 15) * 100, impactGap: isBiasPhase ? Math.abs(biasSkew - 0.5) * 100 : 0 };
  }, [votes, isBiasPhase, biasSkew]);

  const analysis = useMemo(() => {
    if (votes.length === 0) return { label: 'Ensemble Idle', color: 'text-slate-300', desc: 'Initialize voting protocol to observe collective intelligence.' };
    if (isBiasPhase && stats.impactGap > 30) return { label: 'Systemic Skew Detected', color: 'text-rose-600', desc: 'The forest has inherited training bias. Individual trees are over-weighting proxy features.' };
    return { label: stats.consensus > 85 ? 'Strong Consensus' : 'Divided Vote', color: stats.consensus > 85 ? 'text-emerald-600' : 'text-amber-600', desc: stats.consensus > 85 ? 'High confidence ensemble. The majority rules with absolute certainty.' : 'Balanced data signals. The forest is sensitive to noise.' };
  }, [votes, stats, isBiasPhase]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setIsGeminiLoading(true);
      const params = `Skew: ${biasSkew.toFixed(2)}, Consensus: ${stats.consensus.toFixed(0)}%, Status: ${analysis.label}`;
      const res = await getMicroExplanation("Random Forest", params);
      setGeminiDesc(res);
      setIsGeminiLoading(false);
    }, 1500);
    return () => clearTimeout(debounceTimer.current);
  }, [biasSkew, stats.consensus, analysis.label]);

  const handleTourNext = () => {
    audioService.play('click');
    if (activeTourIndex < TOUR_STEPS.length - 1) setActiveTourIndex(prev => prev + 1);
    else onTourClose?.();
  };

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-none flex flex-col items-center relative select-none transition-all duration-700">
      {isTourActive && <GuidanceTooltip message={TOUR_STEPS[activeTourIndex].message} position={TOUR_STEPS[activeTourIndex].position} onNext={handleTourNext} onClose={() => onTourClose?.()} isLast={activeTourIndex === TOUR_STEPS.length - 1} />}
      <div className="w-full flex justify-between items-end mb-10 border-b border-black/5 pb-6">
        <div><h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4><div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div></div>
        <div className="flex space-x-12 text-right"><div><div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Consensus</div><div className="text-2xl font-mono font-bold tabular-nums">{stats.consensus.toFixed(0)}%</div></div>{isBiasPhase && <div className="animate-in slide-in-from-right-4 duration-500"><div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-rose-300 mb-2">Bias Index</div><div className="text-2xl font-mono font-bold tabular-nums text-rose-600">{stats.impactGap.toFixed(0)}</div></div>}</div>
      </div>
      <div className="w-full grid grid-cols-5 gap-4 p-8 bg-[#F9F8F6] border border-black/5 mb-12 shadow-inner">{Array.from({ length: 15 }).map((_, i) => { const hasVoted = votes[i]; const isVoteA = votes[i] === 'A'; const isCompromised = isBiasPhase && !isRunning && votes[i] && (isVoteA ? biasSkew < 0.4 : biasSkew > 0.6); return (<div key={i} className={`h-24 border bg-white transition-all duration-300 flex flex-col items-center justify-center rounded-sm shadow-sm relative overflow-hidden ${hasVoted ? (isVoteA ? 'border-[#2A4D69] ring-2 ring-[#2A4D69]/5' : 'border-[#E11D48] ring-2 ring-[#E11D48]/5') : 'border-black/5 opacity-40'}`}>{isCompromised && <div className="absolute inset-0 bg-rose-500/5 animate-pulse pointer-events-none" />}<svg className={`w-8 h-8 mb-2 transition-transform duration-500 ${hasVoted ? (isVoteA ? 'text-[#2A4D69]' : 'text-[#E11D48]') : 'text-black/10'} ${isRunning ? 'animate-bounce' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M11 19V13H5L12 2L19 13H13V19H11Z" /></svg><span className={`font-mono text-[8px] font-bold tracking-widest ${hasVoted ? (isVoteA ? 'text-[#2A4D69]' : 'text-[#E11D48]') : 'text-black/10'}`}>{hasVoted ? (isBiasPhase ? (isVoteA ? 'APPROVED' : 'DENIED') : `TREE ${i+1}`) : 'IDLE'}</span>{isCompromised && <div className="absolute top-1 right-1 w-1 h-1 bg-rose-500 rounded-full" />}</div>); })}</div>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8 transition-all duration-700">
        <div className="space-y-8">{isBiasPhase ? (<div className="animate-in fade-in slide-in-from-bottom-2 duration-700"><div className="flex justify-between mb-3"><label className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest">Training Data Skew</label><span className="text-[10px] font-mono font-bold text-[#121212] bg-rose-50 px-3 py-1 border border-rose-100 rounded shadow-sm">{biasSkew < 0.4 ? 'Pro-Majority' : (biasSkew > 0.6 ? 'Heavy Denial' : 'Neutral')}</span></div><input type="range" min="0.1" max="0.9" step="0.05" value={biasSkew} onChange={(e) => { setBiasSkew(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); if(votes.length > 0) setVotes([]); }} className="w-full h-px bg-rose-100 rounded-full appearance-none cursor-pointer accent-rose-500" /></div>) : (<div className="bg-[#F9F8F6] p-6 border border-black/5 rounded"><h5 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#999] mb-2">Phase 1: Aggregation</h5><p className="text-[10px] text-[#666] leading-relaxed italic">Aggregation reduces the chance of any single outlier ruining the prediction.</p></div>)}<button onClick={runForest} disabled={isRunning} className="w-full py-5 bg-[#121212] text-white text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-[#2A4D69] transition-all disabled:opacity-50 shadow-xl">{isRunning ? 'Auditing Ensemble...' : (isBiasPhase ? 'Execute Biased Training' : 'Run Ensemble Protocol')}</button></div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5 min-h-[160px] flex flex-col justify-center">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#999] mb-3">Model Analysis</h5>
          <p className="text-xs text-[#444] italic font-serif leading-relaxed mb-4">"{analysis.desc}"</p>
          <div className="pt-4 border-t border-black/5">
            <span className="text-[8px] font-mono font-bold text-[#2A4D69] uppercase tracking-widest block mb-1">Neural Insight</span>
            <p className="text-[11px] text-[#2A4D69] font-serif italic">
              {isGeminiLoading ? 'Aggregating...' : `"${geminiDesc}"`}
            </p>
          </div>
        </div>
      </div>
      <button onClick={onNext} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 font-bold uppercase tracking-[0.3em] text-xs transition-all shadow-xl ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>{nextLabel || 'Advance Manuscript'}</button>
    </div>
  );
};

export default RandomForestSim;
