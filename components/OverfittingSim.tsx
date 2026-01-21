
import React, { useState, useMemo, useEffect } from 'react';
import { audioService } from '../services/audioService';

const truthFn = (x: number) => Math.sin(x * 0.8) * 80 + 150;
const TRAIN_POINTS = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((x, i) => ({ x, y: truthFn(x) + (i % 2 === 0 ? 35 : -35) }));

interface Props {
  adjustment?: { parameter: string; value: number } | null;
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
}

const OverfittingSim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel }) => {
  const [complexity, setComplexity] = useState(1);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);

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
      points.push(`${(x / 10) * 100},${y / 3.5}`);
    }
    return points.join(' ');
  }, [complexity]);

  const analysis = useMemo(() => {
    if (complexity < 4) return { label: 'Underfitting', color: 'text-amber-600', desc: 'Too simple. The model is failing to recognize the curve in the training data.' };
    if (complexity < 8) return { label: 'Optimal Fit', color: 'text-emerald-600', desc: 'Capturing the structure. This level of complexity generalizes well to new data.' };
    return { label: 'Overfitting', color: 'text-rose-600', desc: 'Extreme memorization. The model is wiggling to hit noise rather than true patterns.' };
  }, [complexity]);

  return (
    <div className="bg-white p-6 border border-black/5 shadow-[0_20px_60px_rgba(0,0,0,0.03)] w-full max-w-2xl flex flex-col items-center">
      <div className="w-full flex justify-between items-end mb-4 border-b border-black/5 pb-2">
        <div>
          <h4 className="font-mono text-[8px] font-bold uppercase tracking-widest text-[#CCC] mb-1">Diagnostic Output</h4>
          <div className={`text-lg font-serif italic ${analysis.color}`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[8px] font-bold uppercase tracking-widest text-[#CCC] mb-1">Complexity Level</div>
          <div className="text-lg font-mono font-bold tabular-nums">P{complexity}</div>
        </div>
      </div>
      <div className="relative w-full h-[180px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-6 shadow-inner">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline points={modelPath} fill="none" stroke="currentColor" strokeWidth="1" className={`transition-all duration-300 ${analysis.color}`} />
        </svg>
        {TRAIN_POINTS.map((p, i) => <div key={i} className="absolute w-2 h-2 bg-[#121212] rotate-45" style={{ left: `${p.x * 10}%`, top: `${p.y / 3.5}%`, transform: 'translate(-50%, -50%) rotate(45deg)' }} />)}
      </div>
      <div className="w-full grid grid-cols-2 gap-8 items-start mb-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[8px] font-mono font-bold text-[#999] uppercase tracking-widest">Model Degree</label>
            <span className="text-[9px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">Deg. {complexity}</span>
          </div>
          <input type="range" min="1" max="15" step="1" value={complexity} onChange={(e) => { setComplexity(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px appearance-none bg-black/10 accent-[#2A4D69]" />
        </div>
        <div className="bg-[#F9F8F6] p-4 border-l-2 border-black/5 text-[11px] italic font-serif leading-relaxed">"{analysis.desc}"</div>
      </div>
      <button onClick={onNext} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-4 font-bold uppercase tracking-widest text-[9px] transition-all shadow-lg ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>Advance Manuscript</button>
    </div>
  );
};

export default OverfittingSim;
