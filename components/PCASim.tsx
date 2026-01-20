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

const POINTS = [
  { x: 120, y: 150 }, { x: 150, y: 160 }, { x: 180, y: 190 },
  { x: 210, y: 220 }, { x: 240, y: 230 }, { x: 270, y: 270 },
  { x: 300, y: 290 }, { x: 330, y: 320 }, { x: 360, y: 330 },
  { x: 200, y: 200 }, { x: 260, y: 260 }
];

const TOUR_STEPS = [
  { message: "PCA simplifies high-dimensional data by projecting it onto a single axis. Your goal is to find the direction of maximum spread.", position: "top-[20%] left-[30%]" },
  { message: "The dashed lines show the 'Projection Error'. When the lines are shortest, you've captured the most information.", position: "top-[40%] left-[45%]" },
  { message: "The 'Variance Capture' meter tracks your performance. Aim for 100% to find the true Principal Component.", position: "top-[10%] right-[10%]" }
];

const PCASim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [angle, setAngle] = useState(0);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);

  useEffect(() => {
    if (isTourActive) setActiveTourIndex(0);
  }, [isTourActive]);

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
    // Normalized capture score 
    return { projected, capture: Math.min(100, (sumSqDist / 38000) * 100) };
  }, [rad]);

  const analysis = useMemo(() => {
    if (!hasActuallyInteracted) return { label: 'Awaiting Dimensional reduction', color: 'text-slate-300', desc: 'Rotate the projection axis to align with the primary structural variance of the dataset.' };
    if (varianceData.capture > 92) return { label: 'Principal Component Locked', color: 'text-emerald-600', desc: 'The axis is perfectly aligned with the maximum variance. You have identified the first Principal Component.' };
    if (varianceData.capture > 65) return { label: 'Information Loss', color: 'text-amber-600', desc: 'Significant data spread is being ignored. Projection error remains high. Continue rotating the axis.' };
    return { label: 'Poor Correlation', color: 'text-rose-600', desc: 'The current axis is orthogonal to the data trend. High structural information loss is occurring.' };
  }, [varianceData.capture, hasActuallyInteracted]);

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
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Variance Capture</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{varianceData.capture.toFixed(1)}%</div>
        </div>
      </div>

      <div className="relative w-full h-[400px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
        <svg className="absolute inset-0 w-full h-full">
          {/* Axis Line */}
          <line x1={centerX - Math.cos(rad) * 400} y1={centerY - Math.sin(rad) * 400} x2={centerX + Math.cos(rad) * 400} y2={centerY + Math.sin(rad) * 400} stroke="#121212" strokeWidth="1.5" strokeDasharray="8,4" className="opacity-30 transition-all duration-300" />
          
          {/* Projection Lines and Markers */}
          {varianceData.projected.map((p, i) => (
            <g key={i} className="transition-all duration-300">
               <circle cx={p.x} cy={p.y} r="2.5" fill="#CCC" opacity="0.4" />
               <line x1={p.x} y1={p.y} x2={p.projX} y2={p.projY} stroke="#CCC" strokeWidth="0.5" strokeDasharray="2,2" />
               <circle cx={p.projX} cy={p.projY} r="4.5" fill="#2A4D69" className="shadow-sm" />
            </g>
          ))}

          {/* Visualization Accents */}
          <circle cx={centerX} cy={centerY} r="3" fill="#D4A017" />
        </svg>

        <div className="absolute bottom-4 right-4 flex flex-col items-end space-y-2 bg-white/80 backdrop-blur-sm p-4 border border-black/5 rounded shadow-sm">
           <div className="flex items-center space-x-3">
              <span className="font-mono text-[8px] text-[#AAA] uppercase tracking-widest">Projected Feature</span>
              <div className="w-2.5 h-2.5 bg-[#2A4D69] rounded-full"></div>
           </div>
           <div className="flex items-center space-x-3">
              <span className="font-mono text-[8px] text-[#AAA] uppercase tracking-widest">Dimension Gap</span>
              <div className="w-4 h-[0.5px] border-b border-dashed border-[#CCC]"></div>
           </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Component Rotation</label>
              <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{angle}°</span>
            </div>
            <input type="range" min="0" max="180" step="1" value={angle} onChange={(e) => { setAngle(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px appearance-none bg-black/10 rounded-full cursor-pointer accent-[#2A4D69]" />
          </div>
          <p className="text-[10px] text-[#666] leading-relaxed italic">Finding the Principal Component means finding the direction where data spread is maximized, preserving the most information possible.</p>
        </div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#999] mb-4">Model intuition</h5>
          <p className="text-sm text-[#444] leading-relaxed italic font-serif">
            "{analysis.desc}"
          </p>
        </div>
      </div>

      <div className={`w-full p-8 border-2 border-dashed border-[#A5C9FF]/50 transition-all duration-500 bg-[#F9FBFF]/30 mt-4 ${hasActuallyInteracted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <button onClick={onNext} className="w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 px-10 font-bold uppercase tracking-[0.3em] text-sm transition-all shadow-xl flex items-center justify-center group">
          {nextLabel || 'Advance Manuscript'}
        </button>
      </div>
    </div>
  );
};

export default PCASim;