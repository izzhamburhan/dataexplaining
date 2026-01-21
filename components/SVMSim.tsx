
import React, { useState, useMemo, useEffect } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

interface Props {
  adjustment?: { parameter: string; value: number } | null;
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isTourActive?: boolean;
  onTourClose?: () => void;
}

const CLUSTER_A = [
  { x: 150, y: 100, type: 'A' }, { x: 220, y: 150, type: 'A' }, 
  { x: 130, y: 220, type: 'A' }, { x: 180, y: 300, type: 'A' }, 
  { x: 280, y: 120, type: 'A' }, { x: 200, y: 50, type: 'A' }
];
const CLUSTER_B = [
  { x: 550, y: 400, type: 'B' }, { x: 620, y: 450, type: 'B' }, 
  { x: 720, y: 360, type: 'B' }, { x: 580, y: 250, type: 'B' }, 
  { x: 680, y: 500, type: 'B' }, { x: 500, y: 480, type: 'B' }
];

const TOUR_STEPS = [
  { message: "SVMs seek a 'Maximum Margin'—a clear path or 'street' that separates different classes.", position: "top-[20%] left-[30%]" },
  { message: "The points touching the edge of the street are 'Support Vectors'. They are the only points that matter for the boundary.", position: "top-[45%] left-[45%]" },
  { message: "Rotate the boundary and expand the margin. A wider street means a more confident model.", position: "bottom-[20%] left-[15%]" }
];

const SVMSim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [slope, setSlope] = useState(0.85);
  const [margin, setMargin] = useState(30);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);

  useEffect(() => {
    if (isTourActive) setActiveTourIndex(0);
  }, [isTourActive]);

  useEffect(() => {
    if (adjustment?.parameter === 'slope') { setSlope(adjustment.value); markInteraction(); }
    if (adjustment?.parameter === 'margin') { setMargin(adjustment.value); markInteraction(); }
  }, [adjustment]);

  useEffect(() => { setHasActuallyInteracted(currentStep === 0); }, [currentStep]);

  const markInteraction = () => { if (!hasActuallyInteracted) { setHasActuallyInteracted(true); onInteract?.(); } };

  const modelMetrics = useMemo(() => {
    const allPoints = [...CLUSTER_A, ...CLUSTER_B];
    const centerX = 400, centerY = 280;
    const results = allPoints.map(p => {
      const a = slope, b = -1, c = centerY - slope * centerX;
      const dist = (a * p.x + b * p.y + c) / Math.sqrt(a * a + b * b);
      const absDist = Math.abs(dist);
      const predictedSide = dist > 0 ? 'B' : 'A';
      return { 
        ...p, 
        absDist,
        isViolation: absDist < margin || predictedSide !== p.type,
        isSupportVector: Math.abs(absDist - margin) < 15
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
    if (margin >= 45) {
      return { 
        label: 'Optimal Separation', 
        color: 'text-emerald-600', 
        desc: 'Maximum Margin achieved! You have found a high-confidence boundary with the widest possible safety street.' 
      };
    }
    return { 
      label: 'Suboptimal Fit', 
      color: 'text-amber-600', 
      desc: 'Separated, but the street is too narrow. Increase the margin until you touch the nearest data points (Support Vectors).' 
    };
  }, [modelMetrics.violations, margin]);

  const handleTourNext = () => {
    audioService.play('click');
    if (activeTourIndex < TOUR_STEPS.length - 1) setActiveTourIndex(prev => prev + 1);
    else onTourClose?.();
  };

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-none flex flex-col items-center select-none relative transition-all duration-700">
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
          <div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-300`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Violations</div>
          <div className={`text-2xl font-mono font-bold tabular-nums ${modelMetrics.violations > 0 ? 'text-rose-600' : 'text-[#2A4D69]'}`}>
            {modelMetrics.violations}
          </div>
        </div>
      </div>
      
      <div className="relative w-full h-[420px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-inner">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 560" preserveAspectRatio="xMidYMid meet">
          <g stroke="#F0F0F0" strokeWidth="1">
            {Array.from({ length: 17 }).map((_, i) => (
              <React.Fragment key={i}>
                <line x1={i * 50} y1="0" x2={i * 50} y2="560" />
                <line x1="0" y1={i * 35} x2="800" y2={i * 35} />
              </React.Fragment>
            ))}
          </g>

          <g transform="translate(400, 280)">
             <g transform={`rotate(${Math.atan(slope) * (180/Math.PI)})`}>
                <rect x="-3000" y={-margin} width="6000" height={margin * 2} fill="rgba(42, 77, 105, 0.1)" />
                <line x1="-3000" y1={-margin} x2="3000" y2={-margin} stroke="#AAA" strokeWidth="1" strokeDasharray="6,6" />
                <line x1="-3000" y1={margin} x2="3000" y2={margin} stroke="#AAA" strokeWidth="1" strokeDasharray="6,6" />
                <line x1="-3000" y1="0" x2="3000" y2="0" stroke="#121212" strokeWidth="4" />
             </g>
          </g>

          {modelMetrics.results.map((p, i) => (
            <g key={i}>
              {p.isSupportVector && (
                <circle cx={p.x} cy={p.y} r="22" fill="none" stroke="#D4A017" strokeWidth="2" strokeDasharray="5,3" className="animate-spin-slow" />
              )}
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="12" 
                fill={p.type === 'A' ? "#2A4D69" : "#E11D48"} 
                className={`transition-all duration-300 ${p.isViolation ? 'animate-pulse ring-8 ring-rose-100' : 'opacity-100'}`} 
              />
            </g>
          ))}
        </svg>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-10">
          <div>
            <div className="flex justify-between mb-3">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Boundary Angle (θ)</label>
              <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-3 py-1 border border-black/5 rounded shadow-sm">{slope.toFixed(2)}</span>
            </div>
            <input type="range" min="-2.5" max="2.5" step="0.05" value={slope} onChange={(e) => { setSlope(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-1 appearance-none bg-black/10 accent-[#2A4D69] cursor-pointer" />
          </div>
          <div>
            <div className="flex justify-between mb-3">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Street Margin</label>
              <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-3 py-1 border border-black/5 rounded shadow-sm">{margin}px</span>
            </div>
            <input type="range" min="5" max="100" step="1" value={margin} onChange={(e) => { setMargin(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-1 appearance-none bg-black/10 accent-[#2A4D69] cursor-pointer" />
          </div>
        </div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5 min-h-[140px] flex items-center">
          <p className="text-sm text-[#444] italic font-serif leading-relaxed">"{analysis.desc}"</p>
        </div>
      </div>
      
      <button onClick={onNext} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-5 font-bold uppercase tracking-[0.3em] text-xs transition-all shadow-xl ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
        {nextLabel || 'Advance Manuscript'}
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 18s linear infinite;
          transform-origin: center;
        }
      `}} />
    </div>
  );
};

export default SVMSim;
