
import React, { useState, useMemo, useEffect } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

const TRUE_POINTS = Array.from({ length: 40 }, (_, i) => {
  const x = (i / 39) * 10;
  const y = Math.sin(x) * 100 + 200;
  return { x, y };
});

const TRAIN_POINTS = TRUE_POINTS.map(p => ({
  x: p.x,
  y: p.y + (Math.random() - 0.5) * 80 
})).filter((_, i) => i % 2 === 0);

const TEST_POINTS = TRUE_POINTS.map(p => ({
  x: p.x,
  y: p.y + (Math.random() - 0.5) * 80 
})).filter((_, i) => i % 2 !== 0);

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

  useEffect(() => {
    if (adjustment?.parameter === 'complexity') { setComplexity(Math.round(adjustment.value)); markInteraction(); }
  }, [adjustment]);

  useEffect(() => {
    setHasActuallyInteracted(currentStep === 0);
  }, [currentStep]);

  const markInteraction = () => {
    if (!hasActuallyInteracted) {
      setHasActuallyInteracted(true);
      onInteract?.();
    }
  };

  const modelPath = useMemo(() => {
    const points = [];
    for (let x = 0; x <= 10; x += 0.2) {
      let y = Math.sin(x) * 100 + 200;
      if (complexity === 1) y = 200 - (x - 5) * 15; 
      else if (complexity > 5) {
        y += Math.sin(x * complexity * 0.8) * (complexity * 12);
      }
      points.push(`${(x / 10) * 100}% ${y / 4}%`);
    }
    return points.join(', ');
  }, [complexity]);

  const trainLoss = Math.max(2, 55 - complexity * 5.5);
  const valLoss = complexity < 6 ? 60 - complexity * 6 : 25 + Math.pow(complexity - 6, 1.8) * 3;

  const analysis = useMemo(() => {
    if (complexity < 3) return { label: 'High Bias (Underfit)', color: 'text-amber-600', desc: 'The model is too rigid to see the underlying pattern.' };
    if (complexity <= 6) return { label: 'Optimal Generalization', color: 'text-emerald-600', desc: 'The model captures the trend without memorizing the noise.' };
    return { label: 'High Variance (Overfit)', color: 'text-rose-600', desc: 'The model is hallucinating patterns in random noise.' };
  }, [complexity]);

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative">
      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Complexity Index</div>
          <div className="text-2xl font-mono font-bold tabular-nums">P{complexity}</div>
        </div>
      </div>

      <div className="relative w-full h-[320px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-8 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <polyline points={modelPath} fill="none" stroke="#2A4D69" strokeWidth="2.5" strokeLinecap="round" className="transition-all duration-500" />
        </svg>
        {TRAIN_POINTS.map((p, i) => (
           <div key={`tr-${i}`} className="absolute w-2 h-2 bg-[#121212] rotate-45" style={{ left: `${(p.x / 10) * 100}%`, top: `${p.y / 4}%`, transform: 'translate(-50%, -50%) rotate(45deg)' }} />
        ))}
        {TEST_POINTS.map((p, i) => (
           <div key={`ts-${i}`} className="absolute w-1.5 h-1.5 border border-[#121212] rounded-full opacity-30" style={{ left: `${(p.x / 10) * 100}%`, top: `${p.y / 4}%`, transform: 'translate(-50%, -50%)' }} />
        ))}
      </div>

      {/* Loss Curves Plot */}
      <div className="w-full h-24 flex items-end justify-between space-x-1 mb-12 border-b border-l border-black/5 p-4 bg-[#F9F8F6]/30">
        <div className="absolute -left-2 top-0 bottom-0 flex flex-col justify-between py-4 pointer-events-none">
           <span className="font-mono text-[6px] text-[#CCC] rotate-[-90deg]">LOSS</span>
        </div>
        <div className="w-full h-full relative">
           <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 15 100">
             {/* Train Loss Path */}
             <path d={Array.from({length: 16}).map((_, i) => `${i},${100 - (Math.max(2, 55 - i * 5.5))}`).join(' L ').replace(/^0/, 'M 0')} fill="none" stroke="#121212" strokeWidth="1" strokeDasharray="2,1" opacity="0.2" />
             {/* Val Loss Path */}
             <path d={Array.from({length: 16}).map((_, i) => `${i},${100 - (i < 6 ? 60 - i * 6 : 25 + Math.pow(i - 6, 1.8) * 3)}`).join(' L ').replace(/^0/, 'M 0')} fill="none" stroke="#E11D48" strokeWidth="1.5" className="transition-all duration-500" />
             {/* Current Position Marker */}
             <circle cx={complexity} cy={100 - valLoss} r="2" fill="#E11D48" className="transition-all duration-500" />
           </svg>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-8">
          <div>
            <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest block mb-4">Polynomial Complexity: {complexity}</label>
            <input type="range" min="1" max="15" step="1" value={complexity} onChange={(e) => { setComplexity(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px bg-black/10 appearance-none cursor-pointer accent-[#2A4D69]" />
          </div>
          <div className="flex space-x-8">
             <div>
                <span className="block font-mono text-[8px] font-bold text-[#CCC] uppercase mb-1">Training Loss</span>
                <span className="text-xl font-mono font-bold tabular-nums">{trainLoss.toFixed(1)}</span>
             </div>
             <div>
                <span className="block font-mono text-[8px] font-bold text-[#CCC] uppercase mb-1">Validation Loss</span>
                <span className={`text-xl font-mono font-bold tabular-nums ${complexity > 6 ? 'text-rose-600' : ''}`}>{valLoss.toFixed(1)}</span>
             </div>
          </div>
        </div>
        <div className="bg-[#F9F8F6] p-6 border-l-2 border-black/5">
          <p className="text-xs text-[#444] leading-relaxed italic">"Notice the red curve in the small plot. As complexity increases, training error drops, but the validation error eventually begins to skyrocket. This is the Overfitting Trap."</p>
        </div>
      </div>

      <div className={`w-full p-8 border-2 border-dashed border-[#A5C9FF]/50 transition-all duration-500 bg-[#F9FBFF]/30 mt-4 ${hasActuallyInteracted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <button onClick={onNext} className="w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 px-10 font-bold uppercase tracking-[0.3em] text-sm transition-all shadow-xl flex items-center justify-center group">
          {nextLabel || 'Advance Manuscript'}
          <svg className="ml-4 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </button>
      </div>
    </div>
  );
};

export default OverfittingSim;
