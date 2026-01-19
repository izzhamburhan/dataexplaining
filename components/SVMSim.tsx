
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
  { x: 100, y: 100, type: 'A' }, { x: 140, y: 120, type: 'A' }, 
  { x: 80, y: 160, type: 'A' }, { x: 120, y: 200, type: 'A' }, 
  { x: 160, y: 80, type: 'A' }
];
const CLUSTER_B = [
  { x: 340, y: 280, type: 'B' }, { x: 380, y: 320, type: 'B' }, 
  { x: 420, y: 260, type: 'B' }, { x: 360, y: 220, type: 'B' }, 
  { x: 400, y: 360, type: 'B' }
];

const SVMSim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel }) => {
  const [slope, setSlope] = useState(0.8);
  const [margin, setMargin] = useState(30);
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

  const modelMetrics = useMemo(() => {
    const allPoints = [...CLUSTER_A, ...CLUSTER_B];
    const centerX = 250;
    const centerY = 225;

    const results = allPoints.map(p => {
      // Calculate distance to the decision line: y = m(x - cx) + cy
      // Normalized distance = |mx - y - mcx + cy| / sqrt(m^2 + 1)
      const numerator = slope * p.x - p.y - slope * centerX + centerY;
      const denominator = Math.sqrt(slope * slope + 1);
      const dist = numerator / denominator;
      
      // Points in A should have negative distance, B positive (or vice versa depending on slope)
      const side = dist > 0 ? 'B' : 'A';
      const absDist = Math.abs(dist);
      const isViolation = absDist < margin;
      const isSupportVector = Math.abs(absDist - margin) < 15;

      return { ...p, absDist, isViolation, isSupportVector, side };
    });

    const violations = results.filter(p => p.isViolation).length;
    const supportVectors = results.filter(p => p.isSupportVector).length;
    const isSeparable = results.every(p => p.side === p.type);

    return { results, violations, supportVectors, isSeparable };
  }, [slope, margin]);

  const analysis = useMemo(() => {
    if (!modelMetrics.isSeparable) return { label: 'Model Misaligned', color: 'text-rose-600', desc: 'The decision boundary is on the wrong side of the data. Rotate the boundary to separate the clusters.' };
    if (modelMetrics.violations > 0) return { label: 'Infeasible Margin', color: 'text-amber-600', desc: 'The "Street" is too wide and is crushing data points. Reduce the margin or adjust the angle.' };
    if (modelMetrics.supportVectors >= 3) return { label: 'Maximum Margin Found', color: 'text-emerald-600', desc: 'Excellent. The street is as wide as possible, perfectly braced against the support vectors.' };
    return { label: 'Suboptimal Clearance', color: 'text-blue-600', desc: 'The clusters are separated, but the "Street" could be wider. Try increasing the margin or rotating for a better fit.' };
  }, [modelMetrics]);

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative">
      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className="text-right flex space-x-8">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Violations</div>
            <div className={`text-2xl font-mono font-bold tabular-nums ${modelMetrics.violations > 0 ? 'text-rose-600' : ''}`}>{modelMetrics.violations}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Supp. Vectors</div>
            <div className="text-2xl font-mono font-bold tabular-nums">{modelMetrics.supportVectors}</div>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[400px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-[inset_0_2px_10_rgba(0,0,0,0.02)]">
        <svg className="absolute inset-0 w-full h-full">
           <defs>
            <pattern id="streetGrid" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="20" stroke="#121212" strokeWidth="0.5" opacity="0.03" />
            </pattern>
          </defs>
          
          <g transform="translate(250, 225)">
             <g transform={`rotate(${Math.atan(slope) * (180/Math.PI)})`}>
                {/* The "Street" (Margin Zone) */}
                <rect 
                  x="-500" y={-margin} width="1000" height={margin * 2} 
                  fill="url(#streetGrid)" 
                  className="transition-all duration-300"
                />
                <rect 
                  x="-500" y={-margin} width="1000" height={margin * 2} 
                  fill={modelMetrics.violations > 0 ? 'rgba(225, 29, 72, 0.05)' : 'rgba(42, 77, 105, 0.05)'} 
                  className="transition-all duration-300"
                />

                {/* Boundary Lines */}
                <line x1="-500" y1="0" x2="500" y2="0" stroke="#121212" strokeWidth="1" />
                <line x1="-500" y1={-margin} x2="500" y2={-margin} stroke="#2A4D69" strokeWidth="0.5" strokeDasharray="4,4" className="opacity-30" />
                <line x1="-500" y1={margin} x2="500" y2={margin} stroke="#E11D48" strokeWidth="0.5" strokeDasharray="4,4" className="opacity-30" />
             </g>
          </g>

          {/* Data Points */}
          {modelMetrics.results.map((p, i) => (
            <g key={i}>
              <circle 
                cx={p.x} cy={p.y} r={p.isViolation ? "6" : "4"} 
                fill={p.type === 'A' ? "#2A4D69" : "#E11D48"} 
                className={`transition-all duration-300 ${p.isViolation ? 'opacity-100' : 'opacity-60'}`} 
              />
              {p.isSupportVector && (
                <circle 
                  cx={p.x} cy={p.y} r="10" 
                  fill="none" stroke="#121212" strokeWidth="0.5" 
                  className="animate-pulse" 
                />
              )}
              {p.isViolation && (
                <line 
                  x1={p.x-4} y1={p.y-4} x2={p.x+4} y2={p.y+4} 
                  stroke="#FFF" strokeWidth="1.5" 
                />
              )}
            </g>
          ))}
        </svg>
        
        <div className="absolute bottom-4 left-4 flex space-x-4">
           <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#2A4D69] rotate-45"></div>
              <span className="font-mono text-[8px] uppercase tracking-widest text-[#999]">Class A</span>
           </div>
           <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#E11D48] rotate-45"></div>
              <span className="font-mono text-[8px] uppercase tracking-widest text-[#999]">Class B</span>
           </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-8">
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Boundary Angle</label>
              <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{(Math.atan(slope) * (180/Math.PI)).toFixed(0)}°</span>
            </div>
            <input 
              type="range" min="-3" max="3" step="0.1" value={slope} 
              onChange={(e) => { setSlope(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} 
              className="w-full h-px bg-black/10 appearance-none cursor-pointer accent-[#2A4D69]" 
            />
          </div>
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Street Width (Margin)</label>
              <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{margin}px</span>
            </div>
            <input 
              type="range" min="5" max="80" step="1" value={margin} 
              onChange={(e) => { setMargin(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} 
              className="w-full h-px bg-black/10 appearance-none cursor-pointer accent-[#E11D48]" 
            />
          </div>
        </div>
        <div className="bg-[#F9F8F6] p-6 border-l-2 border-black/5">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#999] mb-3">Model Intuition</h5>
          <p className="text-xs text-[#444] leading-relaxed italic font-normal">
            {analysis.desc}
          </p>
        </div>
      </div>

      <div className={`w-full p-8 border-2 border-dashed border-[#A5C9FF]/50 transition-all duration-500 bg-[#F9FBFF]/30 mt-4 ${hasActuallyInteracted ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button onClick={onNext} className="w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 px-10 font-bold uppercase tracking-[0.3em] text-sm transition-all shadow-xl flex items-center justify-center group">
          {nextLabel || 'Advance Manuscript'}
          <svg className="ml-4 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </button>
      </div>
    </div>
  );
};

export default SVMSim;
