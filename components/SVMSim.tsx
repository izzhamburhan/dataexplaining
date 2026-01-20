
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
  { x: 110, y: 120, type: 'A' }, { x: 150, y: 160, type: 'A' }, 
  { x: 90, y: 200, type: 'A' }, { x: 130, y: 240, type: 'A' }, 
  { x: 190, y: 110, type: 'A' }
];
const CLUSTER_B = [
  { x: 340, y: 280, type: 'B' }, { x: 380, y: 320, type: 'B' }, 
  { x: 420, y: 260, type: 'B' }, { x: 360, y: 220, type: 'B' }, 
  { x: 450, y: 360, type: 'B' }
];

const TOUR_STEPS = [
  { message: "SVMs seek a 'Maximum Margin'—a clear path or 'street' that separates different classes.", position: "top-[20%] left-[30%]" },
  { message: "The points touching the edge of the street are 'Support Vectors'. They are the only points that matter for the boundary.", position: "top-[45%] left-[45%]" },
  { message: "Rotate the boundary and expand the margin. A wider street means a more confident model.", position: "bottom-[20%] left-[15%]" }
];

const SVMSim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [slope, setSlope] = useState(0.8);
  const [margin, setMargin] = useState(25);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);

  useEffect(() => {
    if (isTourActive) setActiveTourIndex(0);
  }, [isTourActive]);

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
    const centerX = 260, centerY = 225;
    const results = allPoints.map(p => {
      const a = slope, b = -1, c = centerY - slope * centerX;
      const dist = (a * p.x + b * p.y + c) / Math.sqrt(a * a + b * b);
      const absDist = Math.abs(dist);
      const predictedSide = dist > 0 ? 'B' : 'A';
      return { 
        ...p, 
        absDist, 
        side: predictedSide,
        isViolation: absDist < margin || predictedSide !== p.type,
        isSupportVector: Math.abs(absDist - margin) < 15
      };
    });
    const violations = results.filter(p => p.isViolation).length;
    return { results, violations };
  }, [slope, margin]);

  const analysis = useMemo(() => {
    if (modelMetrics.violations > 0) return { label: 'Safety Margin Violation', color: 'text-rose-600', desc: 'The "street" is too wide or poorly angled. Points are crossing the margin, weakening prediction confidence.' };
    if (margin < 15) return { label: 'Precarious Separation', color: 'text-amber-600', desc: 'The classes are separated, but the margin is narrow. The model may overfit to small fluctuations.' };
    return { label: 'Optimal Margin Found', color: 'text-emerald-600', desc: 'Excellent. You have identified a robust decision boundary with maximum clearance between classes.' };
  }, [modelMetrics, margin]);

  const handleTourNext = () => {
    audioService.play('click');
    if (activeTourIndex < TOUR_STEPS.length - 1) setActiveTourIndex(prev => prev + 1);
    else onTourClose?.();
  };

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative">
      {isTourActive && (
        <GuidanceTooltip message={TOUR_STEPS[activeTourIndex].message} position={TOUR_STEPS[activeTourIndex].position} onNext={handleTourNext} onClose={() => onTourClose?.()} isLast={activeTourIndex === TOUR_STEPS.length - 1} />
      )}
      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic transition-colors duration-500 ${analysis.color}`}>{analysis.label}</div>
        </div>
        <div className="text-right flex space-x-12">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Street Width</div>
            <div className="text-2xl font-mono font-bold tabular-nums">{(margin * 2).toFixed(0)}px</div>
          </div>
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Errors</div>
            <div className={`text-2xl font-mono font-bold tabular-nums ${modelMetrics.violations > 0 ? 'text-rose-600' : ''}`}>{modelMetrics.violations}</div>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[400px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
        <svg className="absolute inset-0 w-full h-full">
          <g transform="translate(260, 225)">
             <g transform={`rotate(${Math.atan(slope) * (180/Math.PI)})`}>
                <rect x="-1000" y={-margin} width="2000" height={margin * 2} fill="rgba(42, 77, 105, 0.05)" />
                <line x1="-1000" y1={-margin} x2="1000" y2={-margin} stroke="#CCC" strokeWidth="0.5" strokeDasharray="4,4" />
                <line x1="-1000" y1={margin} x2="1000" y2={margin} stroke="#CCC" strokeWidth="0.5" strokeDasharray="4,4" />
                <line x1="-1000" y1="0" x2="1000" y2="0" stroke="#121212" strokeWidth="1.5" />
             </g>
          </g>
          {modelMetrics.results.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="6" fill={p.type === 'A' ? "#2A4D69" : "#E11D48"} className={`transition-all duration-300 ${p.isViolation ? 'animate-pulse opacity-100' : 'opacity-80'}`} />
              {p.isSupportVector && <circle cx={p.x} cy={p.y} r="12" fill="none" stroke="#D4A017" strokeWidth="1" strokeDasharray="2,2" className="animate-spin-slow" />}
            </g>
          ))}
        </svg>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-10">
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Decision Angle (θ)</label>
              <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{slope.toFixed(2)}</span>
            </div>
            <input type="range" min="-3" max="3" step="0.05" value={slope} onChange={(e) => { setSlope(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px appearance-none bg-black/10 rounded-full cursor-pointer accent-[#2A4D69]" />
          </div>
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Margin Sensitivity</label>
              <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{margin}px</span>
            </div>
            <input type="range" min="5" max="80" step="1" value={margin} onChange={(e) => { setMargin(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px appearance-none bg-black/10 rounded-full cursor-pointer accent-[#2A4D69]" />
          </div>
        </div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#999] mb-4">Model intuition</h5>
          <p className="text-sm text-[#444] leading-relaxed italic font-serif">"{analysis.desc}"</p>
        </div>
      </div>

      <div className={`w-full p-8 border-2 border-dashed border-[#A5C9FF]/50 transition-all duration-500 bg-[#F9FBFF]/30 mt-4 ${hasActuallyInteracted ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={onNext} className="w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 px-10 font-bold uppercase tracking-[0.3em] text-sm transition-all shadow-xl flex items-center justify-center group">
          {nextLabel || 'Advance Manuscript'}
        </button>
      </div>
    </div>
  );
};

export default SVMSim;
