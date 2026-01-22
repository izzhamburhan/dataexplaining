
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

// Base training data
const BASE_POINTS = [
  { x: 120, y: 150 }, { x: 150, y: 160 }, { x: 180, y: 190 }, { x: 210, y: 220 },
  { x: 240, y: 230 }, { x: 270, y: 270 }, { x: 300, y: 290 }, { x: 330, y: 320 },
  { x: 200, y: 200 }, { x: 260, y: 260 }, { x: 360, y: 330 },
  { x: 100, y: 130 }, { x: 400, y: 350 }, { x: 320, y: 340 }
];

// Biased data for Phase 3: Groups cluster tightly on different sides of a proxy axis
const BIASED_POINTS = [
  ...Array.from({ length: 10 }, (_, i) => ({ x: 100 + Math.random() * 100, y: 100 + Math.random() * 100, group: 'A' })),
  ...Array.from({ length: 10 }, (_, i) => ({ x: 300 + Math.random() * 100, y: 300 + Math.random() * 100, group: 'B' })),
];

const TOUR_STEPS = [
  { message: "PCA simplifies data by projecting it onto a lower-dimensional axis.", position: "top-[15%] left-[20%]" },
  { message: "The grey dots are the original data; the dark blue dots are their projections on our test axis.", position: "top-[40%] left-[45%]" },
  { message: "In Phase 2, notice the red lines. They show exactly what information is being discarded.", position: "top-[30%] left-[60%]" },
  { message: "In Phase 3, observe how the compressed 1D feature can perfectly isolate demographic groups.", position: "bottom-[20%] left-[10%]" }
];

const PCASim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [angle, setAngle] = useState(0);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);

  const isIntuition = currentStep === 0;
  const isLoss = currentStep === 1;
  const isBias = currentStep === 2;

  const points = isBias ? BIASED_POINTS : BASE_POINTS;

  useEffect(() => { if (isTourActive) setActiveTourIndex(0); }, [isTourActive]);
  useEffect(() => { if (adjustment?.parameter === 'angle') { setAngle(adjustment.value); markInteraction(); } }, [adjustment]);
  
  useEffect(() => { 
    setHasActuallyInteracted(isIntuition); 
    if (isBias) {
      setAngle(45); // Set a default revealing angle for bias phase
    }
  }, [currentStep, isIntuition, isBias]);

  const markInteraction = () => { if (!hasActuallyInteracted) { setHasActuallyInteracted(true); onInteract?.(); } };

  const centerX = 240, centerY = 240;
  const rad = (angle - 45) * (Math.PI / 180);

  const varianceData = useMemo(() => {
    let sumSqDist = 0;
    const projected = points.map(p => {
      const dx = p.x - centerX, dy = p.y - centerY;
      const dot = dx * Math.cos(rad) + dy * Math.sin(rad);
      sumSqDist += dot * dot;
      return { ...p, dot, projX: centerX + dot * Math.cos(rad), projY: centerY + dot * Math.sin(rad) };
    });
    // Baseline scale for capture
    const captureScale = isBias ? 100000 : 42000;
    return { projected, capture: Math.min(100, (sumSqDist / captureScale) * 100) };
  }, [rad, points, isBias]);

  const analysis = useMemo(() => {
    if (isBias) {
      if (varianceData.capture > 85) return { label: 'Proxy Distillation', color: 'text-rose-600', desc: 'The Principal Component has captured demographic spread as the "most important" variation. This compresses merit into a biased proxy.' };
      return { label: 'Feature Mixing', color: 'text-slate-400', desc: 'The axis is not perfectly aligned with demographic clusters, preserving some individual variety.' };
    }
    return {
      label: varianceData.capture > 90 ? 'Principal Component' : 'Information Loss',
      color: varianceData.capture > 90 ? 'text-emerald-600' : 'text-amber-600',
      desc: varianceData.capture > 90 ? 'Maximum variance captured along this axis. This projection preserves most data variance.' : 'Axis is misaligned with the primary data trend. Projection leads to significant information loss.'
    };
  }, [varianceData.capture, isBias]);

  const handleTourNext = () => {
    audioService.play('click');
    if (activeTourIndex < TOUR_STEPS.length - 1) setActiveTourIndex(prev => prev + 1);
    else onTourClose?.();
  };

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-none flex flex-col items-center relative select-none transition-all duration-700">
      {isTourActive && (
        <GuidanceTooltip 
          message={TOUR_STEPS[activeTourIndex].message}
          position={TOUR_STEPS[activeTourIndex].position}
          onNext={handleTourNext}
          onClose={() => onTourClose?.()}
          isLast={activeTourIndex === TOUR_STEPS.length - 1}
        />
      )}
      
      {/* Header Info */}
      <div className="w-full flex justify-between items-end mb-10 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className="text-right flex space-x-12">
          {isBias && (
            <div className="animate-in slide-in-from-right-4">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-rose-300 mb-2">Bias Sensitivity</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-rose-600">{(varianceData.capture * 0.8).toFixed(0)}%</div>
            </div>
          )}
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Variance Capture</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-[#2A4D69]">{varianceData.capture.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Main Plot Area */}
      <div className="relative w-full h-[360px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-inner">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet">
           <g stroke="#F0F0F0" strokeWidth="1">
            {Array.from({ length: 11 }).map((_, i) => (
              <React.Fragment key={i}>
                <line x1={i * 50} y1="0" x2={i * 50} y2="500" />
                <line x1="0" y1={i * 50} x2="500" y2={i * 50} />
              </React.Fragment>
            ))}
          </g>
          
          {/* The Projection Axis */}
          <line 
            x1={centerX - Math.cos(rad)*600} y1={centerY - Math.sin(rad)*600} 
            x2={centerX + Math.cos(rad)*600} y2={centerY + Math.sin(rad)*600} 
            stroke="#121212" strokeWidth="3" strokeDasharray="10,5" opacity="0.1" 
          />

          {varianceData.projected.map((p: any, i) => (
            <g key={i}>
              {/* Original Points */}
              <circle 
                cx={p.x} cy={p.y} r="6" 
                fill={isBias ? (p.group === 'A' ? '#121212' : '#E11D48') : '#AAA'} 
                opacity={isBias ? 0.4 : 0.3} 
              />
              
              {/* Information Loss Lines (Residuals) - Phase 2 & 3 */}
              {(isLoss || isBias) && (
                <line 
                  x1={p.x} y1={p.y} 
                  x2={p.projX} y2={p.projY} 
                  stroke={isLoss ? "#E11D48" : "#DDD"} 
                  strokeWidth={isLoss ? "1.5" : "0.8"} 
                  strokeDasharray="3,3" 
                  className={isLoss ? "animate-pulse" : ""}
                />
              )}

              {/* Projected Points */}
              <circle 
                cx={p.projX} cy={p.projY} r="8" 
                fill={isBias ? (p.group === 'A' ? '#121212' : '#E11D48') : '#2A4D69'} 
                className="shadow-xl" 
                stroke="white" strokeWidth="1"
              />
            </g>
          ))}
        </svg>

        {isBias && (
           <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md border border-rose-100 p-4 animate-in slide-in-from-left-4">
              <span className="text-[9px] font-mono font-bold text-rose-600 uppercase tracking-widest block mb-1">Distillation Audit</span>
              <p className="text-[10px] italic font-serif text-slate-500">Black/Red = Original Groups. Axis position = Compressed Feature.</p>
           </div>
        )}
      </div>

      {/* Controls Area */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-10">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Projection Axis Angle</label>
            <span className="text-[11px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-3 py-1 rounded border border-black/5 shadow-sm">{angle}° DEG</span>
          </div>
          <input 
            type="range" min="0" max="180" step="1" value={angle} 
            onChange={(e) => { setAngle(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} 
            className="w-full h-1 appearance-none bg-black/10 accent-[#2A4D69] cursor-pointer" 
          />
          <div className="flex justify-between text-[8px] font-mono font-bold text-[#CCC] uppercase tracking-widest">
            <span>Minimum Variance</span>
            <span>Principal Component</span>
          </div>
        </div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5 min-h-[140px] flex items-center">
          <p className="text-sm text-[#444] italic font-serif leading-relaxed">"{analysis.desc}"</p>
        </div>
      </div>

      <button 
        onClick={onNext} 
        className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 font-bold uppercase tracking-[0.3em] text-xs transition-all shadow-xl flex items-center justify-center group ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}
      >
        {nextLabel || 'Advance Manuscript'}
        <svg className="ml-4 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </button>
    </div>
  );
};

export default PCASim;
