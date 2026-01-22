
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
  { id: 6, name: "Riley K.", gender: 'Male', experience: 45, status: 'pending' },
  { id: 7, name: "Sasha M.", gender: 'Female', experience: 75, status: 'pending' },
  { id: 8, name: "Dana B.", gender: 'Male', experience: 55, status: 'pending' }
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
  { message: "Algorithmic Bias occurs when historical prejudices are baked into training data.", position: "top-[15%] left-[20%]" },
  { message: "Adjust the Training Skew. High skew means the model will favor one gender over merit.", position: "top-[40%] left-[10%]" },
  { message: "Run the decision model and notice the 'Bias Index'. A high score indicates the model is ignoring experience in favor of proxy features.", position: "bottom-[20%] left-[30%]" }
];

const BiasSim: React.FC<Props> = ({ currentStep, adjustment, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [genderBias, setGenderBias] = useState(0.85);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);

  useEffect(() => { if (isTourActive) setActiveTourIndex(0); }, [isTourActive]);
  useEffect(() => { if (adjustment?.parameter === 'genderBias') { setGenderBias(adjustment.value); markInteraction(); } }, [adjustment]);

  useEffect(() => {
    setCandidates(INITIAL_CANDIDATES);
    setShowResults(false);
    setHasActuallyInteracted(currentStep === 0);
  }, [currentStep]);

  const markInteraction = () => { if (!hasActuallyInteracted) { setHasActuallyInteracted(true); onInteract?.(); } };

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
    if (biasIndex > 30) return { label: 'Proxy Bias Detected', color: 'text-rose-600', desc: 'Gender heavily outweighs merit in current decisions.' };
    return { label: 'Fair Protocol', color: 'text-emerald-600', desc: 'Decisions follow experience signals and meritocracy.' };
  }, [biasIndex]);

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
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Bias Index</div>
          <div className="text-2xl font-mono font-bold tabular-nums text-[#121212]">{biasIndex.toFixed(0)}</div>
        </div>
      </div>
      <div className="w-full mb-12 bg-[#FDFCFB] border border-black/5 p-10 shadow-inner">
        {currentStep === 0 ? (
          <div className="space-y-10">
             <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-[0.4em]">Historical Data Skew</label>
              <span className="text-[11px] font-mono font-bold text-[#121212] bg-white px-3 py-1 border border-black/5 rounded shadow-sm">{(genderBias * 100).toFixed(0)}% SKEW</span>
            </div>
            <input type="range" min="0.1" max="0.9" step="0.05" value={genderBias} onChange={(e) => { setGenderBias(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-1 appearance-none bg-black/10 accent-[#2A4D69] cursor-pointer" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 h-[320px] overflow-y-auto pr-4">
            {candidates.map(c => (
              <div key={c.id} className={`p-6 border text-sm flex justify-between items-center transition-all duration-500 ${showResults && c.status === 'hired' ? 'bg-emerald-50/20 border-emerald-500/30' : 'bg-white border-black/5'}`}>
                <div className="flex flex-col">
                  <div className="font-serif italic text-lg text-[#121212]">{c.name}</div>
                  <div className="text-[9px] font-mono uppercase tracking-widest text-[#AAA] mt-1">Experience Index: {c.experience}%</div>
                </div>
                {showResults && <span className={`font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-sm ${c.status === 'hired' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>{c.status}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
        {currentStep === 1 ? <button onClick={runModel} disabled={isProcessing} className="w-full py-5 text-[11px] font-bold uppercase tracking-[0.3em] bg-[#121212] text-white hover:bg-[#2A4D69] disabled:opacity-50 transition-all shadow-xl">{isProcessing ? 'Auditing Logic...' : 'Execute Decision Model'}</button> : <div className="p-8 border-2 border-dashed border-black/5 flex items-center justify-center text-[10px] font-mono text-[#AAA] uppercase tracking-widest">Awaiting Simulation Stage</div>}
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5 min-h-[140px] flex items-center">
          <p className="text-sm text-[#444] italic font-serif leading-relaxed">"{analysis.desc}"</p>
        </div>
      </div>
      <button onClick={onNext} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-5 font-bold uppercase tracking-[0.3em] text-xs transition-all shadow-xl ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
        {nextLabel || 'Advance Manuscript'}
      </button>
    </div>
  );
};

export default BiasSim;