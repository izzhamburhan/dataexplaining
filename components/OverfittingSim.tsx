
import React, { useState, useMemo, useEffect } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

const truthFn = (x: number) => Math.sin(x * 0.8) * 80 + 150;
const TRAIN_POINTS = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((x, i) => ({ x, y: truthFn(x) + (i % 2 === 0 ? 35 : -35) }));

interface Props {
  adjustment?: { parameter: string; value: number } | null;
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isTourActive?: boolean;
  onTourClose?: () => void;
}

const TOUR_STEPS = [
  { message: "Complexity Level determines the 'Degree' of the mathematical function we use to fit the data.", position: "top-[10%] left-[20%]" },
  { message: "Low degree models (Underfitting) are too rigid and miss the curve entirely.", position: "top-[40%] left-[10%]" },
  { message: "Extreme complexity (Overfitting) memorizes the noise, resulting in an erratic, wobbly line that won't work in the real world.", position: "bottom-[20%] left-[30%]" }
];

const OverfittingSim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [complexity, setComplexity] = useState(1);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);

  useEffect(() => { if (isTourActive) setActiveTourIndex(0); }, [isTourActive]);
  useEffect(() => { if (adjustment?.parameter === 'complexity') { setComplexity(Math.round(adjustment.value)); markInteraction(); } }, [adjustment]);
  useEffect(() => { setHasActuallyInteracted(currentStep === 0); }, [currentStep]);

  const markInteraction = () => { if (!hasActuallyInteracted) { setHasActuallyInteracted(true); onInteract?.(); } };

  const modelPath = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 100; i++) {
      const x = (i / 100) * 10;
      let y = 0;
      if (complexity < 4) { y = 150 + (x - 5) * (complexity - 1) * 8; }
      else if (complexity < 8) { const blend = (complexity - 3) / 5; y = (1 - blend) * (150 + (x - 5) * 15) + blend * truthFn(x); }
      else {
        const overfit = (complexity - 7) / 8;
        let wobble = Math.sin(x * complexity * 1.1) * (overfit * 50);
        let pull = 0;
        TRAIN_POINTS.forEach(p => { const dist = Math.abs(x - p.x); if (dist < 0.8) pull += (p.y - (truthFn(x) + wobble)) * (Math.pow(1 - dist / 0.8, 3) * overfit); });
        y = truthFn(x) + wobble + pull;
      }
      points.push(`${(x / 10) * 100},${y / 2.5}`); // Adjusted divisor for better scale in taller box
    }
    return points.join(' ');
  }, [complexity]);

  const analysis = useMemo(() => {
    if (complexity < 4) return { label: 'Underfitting', color: 'text-amber-600', desc: 'Too simple. The model is failing to recognize the curve in the training data.' };
    if (complexity < 8) return { label: 'Optimal Fit', color: 'text-emerald-600', desc: 'Capturing the structure. This level of complexity generalizes well to new data.' };
    return { label: 'Overfitting', color: 'text-rose-600', desc: 'Extreme memorization. The model is wiggling to hit noise rather than true patterns.' };
  }, [complexity]);

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
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Model Parameter Count</div>
          <div className="text-2xl font-mono font-bold tabular-nums">P{complexity}</div>
        </div>
      </div>
      <div className="relative w-full h-[320px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Subtle grid lines */}
          <g stroke="#F0F0F0" strokeWidth="0.2">
            {Array.from({length: 11}).map((_, i) => (
              <React.Fragment key={i}>
                <line x1={i * 10} y1="0" x2={i * 10} y2="100" />
                <line x1="0" y1={i * 10} x2="100" y2={i * 10} />
              </React.Fragment>
            ))}
          </g>
          <polyline points={modelPath} fill="none" stroke="currentColor" strokeWidth="1.2" className={`transition-all duration-300 ${analysis.color}`} />
        </svg>
        {TRAIN_POINTS.map((p, i) => <div key={i} className="absolute w-3 h-3 bg-[#121212] rotate-45 border border-white/50 shadow-sm" style={{ left: `${p.x * 10}%`, top: `${p.y / 2.5}%`, transform: 'translate(-50%, -50%) rotate(45deg)' }} />)}
      </div>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-8">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Architectural Complexity</label>
            <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-3 py-1 border border-black/5 rounded shadow-sm">Deg. {complexity}</span>
          </div>
          <input type="range" min="1" max="15" step="1" value={complexity} onChange={(e) => { setComplexity(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-1 appearance-none bg-black/10 accent-[#2A4D69] cursor-pointer" />
        </div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5 min-h-[140px] flex items-center">
          <p className="text-sm text-[#444] italic font-serif leading-relaxed">"{analysis.desc}"</p>
        </div>
      </div>
      <button onClick={onNext} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-5 font-bold uppercase tracking-[0.3em] text-xs transition-all shadow-xl ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>Advance Manuscript</button>
    </div>
  );
};

export default OverfittingSim;
