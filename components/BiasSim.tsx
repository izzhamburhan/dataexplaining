
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
  { id: 4, name: "Taylor L.", gender: 'Female', experience: 82, status: 'pending' }
];

interface Props {
  currentStep: number;
  adjustment?: { parameter: string; value: number } | null;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
}

const BiasSim: React.FC<Props> = ({ currentStep, adjustment, onInteract, onNext, nextLabel }) => {
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [genderBias, setGenderBias] = useState(0.8);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);

  useEffect(() => {
    if (adjustment?.parameter === 'genderBias') {
      setGenderBias(adjustment.value);
      markInteraction();
    }
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
    setShowResults(false);
    setTimeout(() => {
      setCandidates(prev => prev.map(c => {
        const genderScore = c.gender === 'Male' ? (genderBias * 100) : ((1 - genderBias) * 100);
        const finalScore = (c.experience * 0.3) + (genderScore * 0.7);
        return { ...c, status: finalScore > 50 ? 'hired' : 'rejected' };
      }));
      setIsProcessing(false);
      setShowResults(true);
      audioService.play('success');
    }, 1200);
  };

  const disparity = Math.abs(0.5 - genderBias) * 200;

  const analysis = useMemo(() => {
    if (disparity < 10) return { label: 'Equitable Distribution', color: 'text-emerald-600', desc: 'The training data is balanced. The model is forced to rely on merit-based features for prediction.' };
    if (disparity < 40) return { label: 'Mild Systemic Drift', color: 'text-amber-600', desc: 'A subtle preference for one group is emerging. This can compound over time into institutional bias.' };
    return { label: 'Systemic Disparity', color: 'text-rose-600', desc: 'The model has learned a strong proxy variable. Real merit is being overshadowed by historical prejudice.' };
  }, [disparity]);

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative">
      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Bias Index</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{disparity.toFixed(0).padStart(3, '0')}</div>
        </div>
      </div>

      <div className="w-full mb-12">
        {currentStep === 0 ? (
          <div className="space-y-8">
            <div className="relative h-24 bg-[#FDFCFB] border border-black/5 flex items-center justify-center overflow-hidden">
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
               <div className="flex space-x-2">{Array.from({ length: 40 }).map((_, i) => (<div key={i} className={`w-1 h-8 rotate-12 transition-colors duration-500 ${i < (genderBias * 40) ? 'bg-[#2A4D69]' : 'bg-[#E11D48]/30'}`} />))}</div>
            </div>
            <div className="bg-[#FDFCFB] border border-black/5 p-8">
                <div className="flex justify-between mb-4">
                  <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Historical Hiring Skew</label>
                  <span className="text-[10px] font-mono font-bold text-[#121212]">{genderBias > 0.5 ? 'Male Majority' : 'Female Majority'}</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={genderBias} onChange={(e) => { setGenderBias(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px bg-black/10 rounded-full appearance-none cursor-pointer accent-[#2A4D69]" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {candidates.map(c => (
              <div key={c.id} className={`p-6 border transition-all duration-500 ${c.status === 'hired' ? 'bg-[#F9F8F6] border-[#2A4D69]' : c.status === 'rejected' ? 'bg-white border-black/5 opacity-50' : 'bg-white border-black/5'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-serif italic text-lg mb-1">{c.name}</div>
                    <div className="font-mono text-[8px] font-bold text-[#CCC] uppercase tracking-widest">{c.gender} • EXP: {c.experience}%</div>
                  </div>
                  {c.status !== 'pending' && <span className={`font-mono text-[9px] font-bold uppercase tracking-widest ${c.status === 'hired' ? 'text-emerald-600' : 'text-rose-600'}`}>{c.status}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-6">
          {currentStep === 1 && (<button onClick={runModel} disabled={isProcessing} className={`w-full py-4 text-[10px] font-bold uppercase tracking-[0.3em] transition-all border ${isProcessing ? 'bg-transparent border-black/10 text-[#666]' : 'bg-[#121212] border-[#121212] text-white hover:bg-[#2A4D69]'}`}>{isProcessing ? 'Auditing Model...' : 'Execute Prediction'}</button>)}
          <div className="p-4 bg-[#F9F8F6] border border-black/5">
            <span className="font-mono text-[8px] font-bold text-[#CCC] uppercase tracking-widest block mb-2">Merit Proxy Weight</span>
            <div className="h-1 bg-black/5 rounded-full overflow-hidden"><div className="h-full bg-[#121212] transition-all duration-1000" style={{ width: '30%' }}></div></div>
          </div>
        </div>
        <div className="bg-[#F9F8F6] p-6 border-l-2 border-black/5">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#999] mb-3">Model Analysis</h5>
          <p className="text-xs text-[#444] leading-relaxed italic font-normal">"{analysis.desc}"</p>
        </div>
      </div>

      {/* NEXT STEP BUTTON AREA */}
      <div className={`w-full p-8 border-2 border-dashed border-[#A5C9FF]/50 transition-all duration-500 bg-[#F9FBFF]/30 mt-4 ${hasActuallyInteracted ? 'opacity-100' : 'opacity-0'}`}>
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

export default BiasSim;
