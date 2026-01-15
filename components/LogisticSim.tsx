
import React, { useState, useMemo, useEffect } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

interface Props {
  adjustment?: { parameter: string; value: number } | null;
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
}

const POINTS = [
  { x: -8, y: 0 }, { x: -6, y: 0 }, { x: -4, y: 0 }, { x: -3, y: 0 },
  { x: 2, y: 1 }, { x: 4, y: 1 }, { x: 6, y: 1 }, { x: 9, y: 1 },
  { x: -1, y: 1 }, { x: 1, y: 0 } // Outliers
];

const LogisticSim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel }) => {
  const [threshold, setThreshold] = useState(0.5);
  const [bias, setBias] = useState(0);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);

  useEffect(() => {
    if (adjustment?.parameter === 'threshold') { setThreshold(adjustment.value); markInteraction(); }
    if (adjustment?.parameter === 'bias') { setBias(adjustment.value); markInteraction(); }
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

  const sigmoid = (x: number) => 1 / (1 + Math.exp(-(x + bias)));

  const accuracy = useMemo(() => {
    const correct = POINTS.filter(p => {
      const prob = sigmoid(p.x);
      const prediction = prob >= threshold ? 1 : 0;
      return prediction === p.y;
    }).length;
    return (correct / POINTS.length) * 100;
  }, [bias, threshold]);

  const analysis = useMemo(() => {
    if (accuracy > 85) return { label: 'Optimal Separation', color: 'text-emerald-600', desc: 'The S-curve effectively partitions the probability space.' };
    return { label: 'Boundary Conflict', color: 'text-amber-600', desc: 'The current bias/threshold results in significant misclassification.' };
  }, [accuracy]);

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative">
      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Accuracy</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{accuracy.toFixed(0)}%</div>
        </div>
      </div>

      <div className="relative w-full h-[300px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="absolute inset-0 flex pointer-events-none opacity-10">
           <div className="flex-1 bg-rose-500" style={{ opacity: 1 - threshold }}></div>
           <div className="flex-1 bg-emerald-500" style={{ opacity: threshold }}></div>
        </div>
        
        <svg className="absolute inset-0 w-full h-full" viewBox="-12 -0.1 24 1.2" preserveAspectRatio="none">
            <path d={Array.from({ length: 101 }).map((_, i) => { const x = (i / 4.16) - 12; const y = sigmoid(x); return `${i === 0 ? 'M' : 'L'} ${x} ${1 - y}`; }).join(' ')} fill="none" stroke="#2A4D69" strokeWidth="0.08" className="transition-all duration-300" />
            <line x1="-12" y1={1 - threshold} x2="12" y2={1 - threshold} stroke="#E11D48" strokeWidth="0.02" strokeDasharray="0.1" className="opacity-40" />
            
            {POINTS.map((p, i) => {
              const prob = sigmoid(p.x);
              const isCorrect = (prob >= threshold ? 1 : 0) === p.y;
              return (
                <g key={i} transform={`translate(${p.x}, ${1 - p.y})`}>
                  <circle r="0.25" fill={isCorrect ? "#121212" : "#E11D48"} className="opacity-80" />
                  <line x1="0" y1="0" x2="0" y2={p.y - (1 - prob)} stroke="#CCC" strokeWidth="0.01" strokeDasharray="0.05" />
                </g>
              );
            })}
        </svg>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Decision Threshold</label>
              <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{threshold.toFixed(2)}</span>
            </div>
            <input type="range" min="0.1" max="0.9" step="0.01" value={threshold} onChange={(e) => { setThreshold(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px bg-black/10 rounded-full appearance-none cursor-pointer accent-[#E11D48]" />
          </div>
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Bias Shift (β0)</label>
              <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{bias.toFixed(1)}</span>
            </div>
            <input type="range" min="-6" max="6" step="0.2" value={bias} onChange={(e) => { setBias(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px bg-black/10 rounded-full appearance-none cursor-pointer accent-[#2A4D69]" />
          </div>
        </div>
        <div className="bg-[#F9F8F6] p-6 border-l-2 border-black/5">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#999] mb-3">Model Analysis</h5>
          <p className="text-xs text-[#444] leading-relaxed italic font-normal">"{analysis.desc}"</p>
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

export default LogisticSim;
