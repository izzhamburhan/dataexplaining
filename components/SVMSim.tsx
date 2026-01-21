
import React, { useState, useMemo, useEffect } from 'react';
import { audioService } from '../services/audioService';

interface Props {
  adjustment?: { parameter: string; value: number } | null;
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
}

// Redefined clusters to ensure a clear, wide gap centered around (260, 210)
const CLUSTER_A = [
  { x: 110, y: 80, type: 'A' }, { x: 160, y: 120, type: 'A' }, 
  { x: 90, y: 160, type: 'A' }, { x: 140, y: 200, type: 'A' }, 
  { x: 190, y: 90, type: 'A' }
];
const CLUSTER_B = [
  { x: 330, y: 260, type: 'B' }, { x: 380, y: 300, type: 'B' }, 
  { x: 430, y: 240, type: 'B' }, { x: 350, y: 200, type: 'B' }, 
  { x: 410, y: 340, type: 'B' }
];

const SVMSim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel }) => {
  const [slope, setSlope] = useState(0.85);
  const [margin, setMargin] = useState(20);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);

  useEffect(() => {
    if (adjustment?.parameter === 'slope') { setSlope(adjustment.value); markInteraction(); }
    if (adjustment?.parameter === 'margin') { setMargin(adjustment.value); markInteraction(); }
  }, [adjustment]);

  useEffect(() => { setHasActuallyInteracted(currentStep === 0); }, [currentStep]);

  const markInteraction = () => { if (!hasActuallyInteracted) { setHasActuallyInteracted(true); onInteract?.(); } };

  const modelMetrics = useMemo(() => {
    const allPoints = [...CLUSTER_A, ...CLUSTER_B];
    const centerX = 260, centerY = 210;
    const results = allPoints.map(p => {
      // Equation of line: slope * (x - centerX) - (y - centerY) = 0
      // Normal vector is (slope, -1). Distance from (px, py) to line is |ax+by+c| / sqrt(a^2+b^2)
      const a = slope, b = -1, c = centerY - slope * centerX;
      const dist = (a * p.x + b * p.y + c) / Math.sqrt(a * a + b * b);
      const absDist = Math.abs(dist);
      const predictedSide = dist > 0 ? 'B' : 'A';
      return { 
        ...p, 
        absDist,
        isViolation: absDist < margin || predictedSide !== p.type,
        // Visual indicator for support vectors (points exactly on the edge of the street)
        isSupportVector: Math.abs(absDist - margin) < 8
      };
    });
    return { results, violations: results.filter(p => p.isViolation).length };
  }, [slope, margin]);

  const analysis = useMemo(() => {
    if (modelMetrics.violations > 0) {
      return { 
        label: 'Margin Violation', 
        color: 'text-rose-600', 
        desc: 'Points are breaching the street. Reduce the margin width or rotate the angle to find a clearer path.' 
      };
    }
    // Achievable optimal threshold lowered to 28 for better user satisfaction
    if (margin >= 28) {
      return { 
        label: 'Optimal Separation', 
        color: 'text-emerald-600', 
        desc: 'Maximum Margin achieved! You have found the widest possible street that safely separates the two classes.' 
      };
    }
    return { 
      label: 'Suboptimal Fit', 
      color: 'text-amber-600', 
      desc: 'Separated, but the street is too narrow. Increase the margin until you touch the nearest data points (Support Vectors).' 
    };
  }, [modelMetrics.violations, margin]);

  return (
    <div className="bg-white p-6 border border-black/5 shadow-[0_20px_60px_rgba(0,0,0,0.03)] w-full max-w-2xl flex flex-col items-center">
      <div className="w-full flex justify-between items-end mb-4 border-b border-black/5 pb-2">
        <div>
          <h4 className="font-mono text-[8px] font-bold uppercase tracking-widest text-[#CCC] mb-1">Diagnostic Output</h4>
          <div className={`text-lg font-serif italic ${analysis.color} transition-colors duration-300`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[8px] font-bold uppercase tracking-widest text-[#CCC] mb-1">Violations</div>
          <div className={`text-lg font-mono font-bold tabular-nums ${modelMetrics.violations > 0 ? 'text-rose-600' : 'text-[#2A4D69]'}`}>
            {modelMetrics.violations}
          </div>
        </div>
      </div>
      
      <div className="relative w-full h-[220px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-6 shadow-inner">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 520 400" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines for visual scale */}
          <line x1="260" y1="0" x2="260" y2="400" stroke="#EEE" strokeWidth="1" />
          <line x1="0" y1="210" x2="520" y2="210" stroke="#EEE" strokeWidth="1" />

          <g transform="translate(260, 210)">
             <g transform={`rotate(${Math.atan(slope) * (180/Math.PI)})`}>
                {/* The "Street" (Margin) */}
                <rect x="-1000" y={-margin} width="2000" height={margin * 2} fill="rgba(42, 77, 105, 0.05)" />
                {/* Street boundaries */}
                <line x1="-1000" y1={-margin} x2="1000" y2={-margin} stroke="#CCC" strokeWidth="0.5" strokeDasharray="4,4" />
                <line x1="-1000" y1={margin} x2="1000" y2={margin} stroke="#CCC" strokeWidth="0.5" strokeDasharray="4,4" />
                {/* Decision boundary */}
                <line x1="-1000" y1="0" x2="1000" y2="0" stroke="#121212" strokeWidth="2.5" />
             </g>
          </g>
          {modelMetrics.results.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="10" fill={p.type === 'A' ? "#2A4D69" : "#E11D48"} className={`${p.isViolation ? 'animate-pulse opacity-100' : 'opacity-90'}`} />
              {p.isSupportVector && <circle cx={p.x} cy={p.y} r="16" fill="none" stroke="#D4A017" strokeWidth="1.5" strokeDasharray="3,3" className="animate-spin-slow" />}
            </g>
          ))}
        </svg>
      </div>

      <div className="w-full grid grid-cols-2 gap-8 items-start mb-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-[8px] font-mono font-bold text-[#999] uppercase tracking-widest">Boundary Angle (θ)</label>
              <span className="text-[9px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded shadow-sm">{slope.toFixed(2)}</span>
            </div>
            <input type="range" min="-2.5" max="2.5" step="0.05" value={slope} onChange={(e) => { setSlope(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px appearance-none bg-black/10 accent-[#2A4D69] cursor-pointer" />
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-[8px] font-mono font-bold text-[#999] uppercase tracking-widest">Street Margin</label>
              <span className="text-[9px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded shadow-sm">{margin}px</span>
            </div>
            <input type="range" min="5" max="60" step="1" value={margin} onChange={(e) => { setMargin(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px appearance-none bg-black/10 accent-[#2A4D69] cursor-pointer" />
          </div>
        </div>
        <div className="bg-[#F9F8F6] p-4 border-l-2 border-black/5 text-[11px] italic font-serif leading-relaxed text-[#444] min-h-[80px]">
          "{analysis.desc}"
        </div>
      </div>
      
      <button onClick={onNext} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-4 font-bold uppercase tracking-widest text-[9px] transition-all shadow-lg ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
        {nextLabel || 'Advance Manuscript'}
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
          transform-origin: center;
        }
      `}} />
    </div>
  );
};

export default SVMSim;
