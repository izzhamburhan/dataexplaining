
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

const CLUSTER_A = [
  { x: 100, y: 100 }, { x: 140, y: 120 }, { x: 80, y: 160 }, { x: 120, y: 200 }, { x: 160, y: 80 }
];
const CLUSTER_B = [
  { x: 340, y: 280 }, { x: 380, y: 320 }, { x: 420, y: 260 }, { x: 360, y: 220 }, { x: 400, y: 360 }
];

const SVMSim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel }) => {
  const [slope, setSlope] = useState(1);
  const [margin, setMargin] = useState(40);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);

  useEffect(() => {
    if (adjustment?.parameter === 'slope') { setSlope(adjustment.value); markInteraction(); }
    if (adjustment?.parameter === 'margin') { setMargin(adjustment.value); markInteraction(); }
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

  const supportVectors = useMemo(() => {
    return [...CLUSTER_A, ...CLUSTER_B].filter(p => {
      const dist = Math.abs(p.y - (slope * (p.x - 250) + 225));
      return Math.abs(dist - margin) < 18;
    });
  }, [slope, margin]);

  const marginQuality = useMemo(() => {
    const isOverlapping = [...CLUSTER_A, ...CLUSTER_B].some(p => {
        const dist = Math.abs(p.y - (slope * (p.x - 250) + 225));
        return dist < margin - 5;
    });
    return isOverlapping ? 'Compromised' : 'Optimal';
  }, [slope, margin]);

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative">
      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic ${marginQuality === 'Optimal' ? 'text-emerald-600' : 'text-rose-600'} transition-colors duration-500`}>{marginQuality} Separation</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Support Vectors</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{supportVectors.length.toString().padStart(2, '0')}</div>
        </div>
      </div>

      <div className="relative w-full h-[380px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-[inset_0_2px_10_rgba(0,0,0,0.02)]">
        <svg className="absolute inset-0 w-full h-full">
           <defs>
            <pattern id="marginPattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#121212" strokeWidth="0.5" opacity="0.05" />
            </pattern>
          </defs>
          
          <g transform="translate(250, 225)">
             {/* Margin Fill Zone */}
             <rect 
               x="-300" y={-margin} width="600" height={margin * 2} 
               fill="url(#marginPattern)" 
               transform={`skewY(${Math.atan(slope) * (180/Math.PI)})`}
               className="transition-all duration-300"
             />

             {/* Decision Boundary */}
             <line x1="-300" y1={-300 * slope} x2="300" y2={300 * slope} stroke="#121212" strokeWidth="1.5" />
             {/* Margins */}
             <line x1="-300" y1={-300 * slope - margin} x2="300" y2={300 * slope - margin} stroke="#2A4D69" strokeWidth="0.5" strokeDasharray="4" className="opacity-40" />
             <line x1="-300" y1={-300 * slope + margin} x2="300" y2={300 * slope + margin} stroke="#E11D48" strokeWidth="0.5" strokeDasharray="4" className="opacity-40" />
          </g>

          {CLUSTER_A.map((p, i) => (
            <circle key={`a-${i}`} cx={p.x} cy={p.y} r="4" fill="#2A4D69" className="opacity-80" />
          ))}
          {CLUSTER_B.map((p, i) => (
            <rect key={`b-${i}`} x={p.x-4} y={p.y-4} width="8" height="8" fill="#E11D48" className="opacity-80 rotate-45" />
          ))}
          
          {supportVectors.map((p, i) => (
            <circle key={`sv-${i}`} cx={p.x} cy={p.y} r="10" fill="none" stroke="#121212" strokeWidth="0.5" className="animate-pulse" />
          ))}
        </svg>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest block mb-4">Boundary Orientation: {slope.toFixed(2)}</label>
            <input type="range" min="-2.5" max="2.5" step="0.1" value={slope} onChange={(e) => { setSlope(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px bg-black/10 appearance-none cursor-pointer accent-[#2A4D69]" />
          </div>
          <div>
            <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest block mb-4">Margin Magnitude: {margin}</label>
            <input type="range" min="10" max="100" step="1" value={margin} onChange={(e) => { setMargin(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px bg-black/10 appearance-none cursor-pointer accent-[#E11D48]" />
          </div>
        </div>
        <div className="bg-[#F9F8F6] p-6 border-l-2 border-black/5">
          <p className="text-xs text-[#444] leading-relaxed italic">"The model is 'robust' when the street (margin) is wide and empty. Support vectors act as the anchors for this street—move them, and the whole model pivots."</p>
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

export default SVMSim;
