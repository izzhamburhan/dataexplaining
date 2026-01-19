
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
  { x: 120, y: 150 }, { x: 150, y: 160 }, { x: 180, y: 190 },
  { x: 210, y: 220 }, { x: 240, y: 230 }, { x: 270, y: 270 },
  { x: 300, y: 290 }, { x: 330, y: 320 }, { x: 360, y: 330 },
  { x: 200, y: 200 }, { x: 260, y: 260 }
];

const PCASim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel }) => {
  const [angle, setAngle] = useState(0);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);

  useEffect(() => {
    if (adjustment?.parameter === 'angle') { setAngle(adjustment.value); markInteraction(); }
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

  const centerX = 240, centerY = 240;
  const rad = (angle - 45) * (Math.PI / 180);

  const varianceData = useMemo(() => {
    let sumSqDist = 0;
    const projected = POINTS.map(p => {
      const dx = p.x - centerX, dy = p.y - centerY;
      const dot = dx * Math.cos(rad) + dy * Math.sin(rad);
      sumSqDist += dot * dot;
      return { ...p, dot, projX: centerX + dot * Math.cos(rad), projY: centerY + dot * Math.sin(rad) };
    });
    const capture = Math.min(100, (sumSqDist / 38000) * 100);
    return { projected, capture };
  }, [rad]);

  const analysis = useMemo(() => {
    const cap = varianceData.capture;
    if (cap > 90) return { label: 'Principal Feature Locked', color: 'text-emerald-600', desc: 'The axis is perfectly aligned with the data\'s maximum variance.' };
    if (cap > 50) return { label: 'Information Drift', color: 'text-amber-600', desc: 'The axis captures some structure, but significant variance is still being ignored.' };
    return { label: 'Inefficient Projection', color: 'text-rose-600', desc: 'The current axis ignores the primary direction of the data spread.' };
  }, [varianceData.capture]);

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative">
      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Variance Capture</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{varianceData.capture.toFixed(1)}%</div>
        </div>
      </div>

      <div className="relative w-full h-[380px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-6 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
        <svg className="absolute inset-0 w-full h-full">
          <line x1={centerX - Math.cos(rad) * 400} y1={centerY - Math.sin(rad) * 400} x2={centerX + Math.cos(rad) * 400} y2={centerY + Math.sin(rad) * 400} stroke="#121212" strokeWidth="0.5" strokeDasharray="6" className="opacity-20 transition-all duration-300" />
          
          {varianceData.projected.map((p, i) => (
            <g key={i} className="transition-all duration-300">
               <line x1={p.x} y1={p.y} x2={p.projX} y2={p.projY} stroke="#CCC" strokeWidth="0.5" strokeDasharray="2" />
               <circle cx={p.x} cy={p.y} r="3" fill="#CCC" opacity="0.4" />
               <circle cx={p.projX} cy={p.projY} r="3" fill="#2A4D69" className="transition-all duration-300" />
            </g>
          ))}
        </svg>
      </div>

      <div className="w-full h-12 bg-[#F9F8F6] border border-black/5 relative flex items-center mb-12 overflow-hidden shadow-inner px-12">
        <div className="absolute inset-y-0 left-0 w-12 bg-white/50 z-10 flex items-center justify-center font-mono text-[8px] text-[#CCC] uppercase rotate-[-90deg]">1D MAP</div>
        <div className="w-full h-px bg-black/10 absolute left-12 right-12 top-1/2"></div>
        <div className="relative w-full h-full">
          {varianceData.projected.map((p, i) => (
            <div 
              key={`proj-${i}`} 
              className="absolute w-1.5 h-4 bg-[#2A4D69] transition-all duration-300 border border-white/50" 
              style={{ left: `${50 + (p.dot / 250) * 50}%`, top: '50%', transform: 'translate(-50%, -50%)' }} 
            />
          ))}
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-6">
          <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest block mb-4">Principal Axis Rotation: {angle}°</label>
          <input type="range" min="0" max="180" value={angle} onChange={(e) => { setAngle(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px bg-black/10 appearance-none cursor-pointer accent-[#2A4D69]" />
        </div>
        <div className="bg-[#F9F8F6] p-6 border-l-2 border-black/5">
          <p className="text-xs text-[#444] leading-relaxed italic">"{analysis.desc}"</p>
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

export default PCASim;
