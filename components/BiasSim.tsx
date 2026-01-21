
import React, { useState, useEffect, useMemo } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

interface Candidate {
  id: number;
  name: string;
  gender: 'Male' | 'Female';
  experience: number;
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

const BiasSim: React.FC<Props> = ({ currentStep, adjustment, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [genderBias, setGenderBias] = useState(0.85);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);

  useEffect(() => {
    if (adjustment?.parameter === 'genderBias') { setGenderBias(adjustment.value); markInteraction(); }
  }, [adjustment]);

  useEffect(() => {
    setCandidates(INITIAL_CANDIDATES);
    setShowResults(false);
    setHasActuallyInteracted(currentStep === 0);
  }, [currentStep]);

  const markInteraction = () => {
    if (!hasActuallyInteracted) { setHasActuallyInteracted(true); onInteract?.(); }
  };

  const runModel = () => {
    audioService.play('blip');
    markInteraction();
    setIsProcessing(true);
    setTimeout(() => {
      setCandidates(prev => prev.map(c => {
        const gs = c.gender === 'Male' ? (genderBias * 100) : ((1 - genderBias) * 100);
        return { ...c, status: (c.experience * 0.3 + gs * 0.7) > 50 ? 'hired' : 'rejected' };
      }));
      setIsProcessing(false); setShowResults(true); audioService.play('success');
    }, 1000);
  };

  const biasIndex = Math.abs(0.5 - genderBias) * 200;
  const analysis = useMemo(() => {
    if (biasIndex > 30) return { label: 'Proxy Bias Detected', color: 'text-rose-600', desc: 'Gender heavily outweighs merit.' };
    return { label: 'Fair Protocol', color: 'text-emerald-600', desc: 'Decisions follow experience signals.' };
  }, [biasIndex]);

  return (
    <div className="bg-white p-6 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative">
      <div className="w-full flex justify-between items-end mb-4 border-b border-black/5 pb-3">
        <div>
          <h4 className="font-mono text-[8px] font-bold uppercase tracking-widest text-[#CCC] mb-1">Diagnostic Output</h4>
          <div className={`text-xl font-serif italic ${analysis.color}`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[8px] font-bold uppercase tracking-widest text-[#CCC] mb-1">Bias Index</div>
          <div className="text-xl font-mono font-bold tabular-nums">{biasIndex.toFixed(0)}</div>
        </div>
      </div>
      <div className="w-full mb-6 bg-[#FDFCFB] border border-black/5 p-6">
        {currentStep === 0 ? (
          <div className="space-y-6">
            <span className="font-mono text-[9px] text-[#999] uppercase tracking-widest">Training Skew Slider</span>
            <input type="range" min="0.1" max="0.9" step="0.05" value={genderBias} onChange={(e) => { setGenderBias(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px appearance-none bg-black/10 accent-[#2A4D69]" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 h-[180px] overflow-y-auto pr-2">
            {candidates.map(c => (
              <div key={c.id} className={`p-3 border text-[11px] flex justify-between items-center ${showResults && c.status === 'hired' ? 'bg-[#F9F8F6] border-emerald-500/20' : 'bg-white border-black/5 opacity-80'}`}>
                <div><div className="font-serif italic">{c.name}</div><div className="text-[7px] font-mono uppercase text-[#AAA]">Exp: {c.experience}%</div></div>
                {showResults && <span className={`font-mono text-[7px] font-bold uppercase ${c.status === 'hired' ? 'text-emerald-600' : 'text-rose-600'}`}>{c.status}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="w-full grid grid-cols-2 gap-8 mb-6">
        {currentStep === 1 ? <button onClick={runModel} disabled={isProcessing} className="w-full py-4 text-[9px] font-bold uppercase tracking-widest bg-[#121212] text-white hover:bg-[#2A4D69] disabled:opacity-50 transition-all">{isProcessing ? 'Auditing...' : 'Run Decision Model'}</button> : <div />}
        <div className="bg-[#F9F8F6] p-4 border-l-2 border-black/5 text-[11px] italic font-serif">"{analysis.desc}"</div>
      </div>
      <button onClick={onNext} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-4 font-bold uppercase tracking-widest text-[10px] transition-all shadow-lg ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
        {nextLabel || 'Advance Manuscript'}
      </button>
    </div>
  );
};

export default BiasSim;
