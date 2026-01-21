
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
  { x: 120, y: 150 }, { x: 150, y: 160 }, { x: 180, y: 190 }, { x: 210, y: 220 },
  { x: 240, y: 230 }, { x: 270, y: 270 }, { x: 300, y: 290 }, { x: 330, y: 320 },
  { x: 200, y: 200 }, { x: 260, y: 260 }, { x: 360, y: 330 },
  { x: 100, y: 130 }, { x: 400, y: 350 }, { x: 320, y: 340 }
];

const TOUR_STEPS = [
  { message: "PCA simplifies data by projecting it onto a lower-dimensional axis.", position: "top-[15%] left-[20%]" },
  { message: "The grey dots are the original data; the dark blue dots are their projections on our test axis.", position: "top-[40%] left-[45%]" },
  { message: "Rotate the axis. When the dark dots are most spread out, you've found the 'Principal Component'.", position: "bottom-[20%] left-[10%]" }
];

const PCASim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [angle, setAngle] = useState(0);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);

  useEffect(() => { if (isTourActive) setActiveTourIndex(0); }, [isTourActive]);
  useEffect(() => { if (adjustment?.parameter === 'angle') { setAngle(adjustment.value); markInteraction(); } }, [adjustment]);
  useEffect(() => { setHasActuallyInteracted(currentStep === 0); }, [currentStep]);

  const markInteraction = () => { if (!hasActuallyInteracted) { setHasActuallyInteracted(true); onInteract?.(); } };

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
    return { projected, capture: Math.min(100, (sumSqDist / 42000) * 100) };
  }, [rad]);

  const analysis = useMemo(() => ({
    label: varianceData.capture > 90 ? 'Principal Component' : 'Information Loss',
    color: varianceData.capture > 90 ? 'text-emerald-600' : 'text-amber-600',
    desc: varianceData.capture > 90 ? 'Maximum variance captured along this axis. This projection preserves most data variance.' : 'Axis is misaligned with the primary data trend. Projection leads to significant information loss.'
  }), [varianceData.capture]);

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
      <div className="w-full flex justify-between items-end mb-10 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Variance Capture</div>
          <div className="text-2xl font-mono font-bold tabular-nums text-[#2A4D69]">{varianceData.capture.toFixed(1)}%</div>
        </div>
      </div>
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
          <line x1={centerX - Math.cos(rad)*600} y1={centerY - Math.sin(rad)*600} x2={centerX + Math.cos(rad)*600} y2={centerY + Math.sin(rad)*600} stroke="#121212" strokeWidth="3" strokeDasharray="10,5" opacity="0.1" />
          {varianceData.projected.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="6" fill="#AAA" opacity="0.4" />
              <line x1={p.x} y1={p.y} x2={p.projX} y2={p.projY} stroke="#DDD" strokeWidth="0.8" strokeDasharray="3,3" />
              <circle cx={p.projX} cy={p.projY} r="8" fill="#2A4D69" opacity="1" className="shadow-xl" />
            </g>
          ))}
        </svg>
      </div>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-10">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Projection Axis Angle</label>
            <span className="text-[11px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-3 py-1 rounded border border-black/5 shadow-sm">{angle}° DEG</span>
          </div>
          <input type="range" min="0" max="180" step="1" value={angle} onChange={(e) => { setAngle(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-1 appearance-none bg-black/10 accent-[#2A4D69] cursor-pointer" />
        </div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5 min-h-[140px] flex items-center">
          <p className="text-sm text-[#444] italic font-serif leading-relaxed">"{analysis.desc}"</p>
        </div>
      </div>
      <button onClick={onNext} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-5 font-bold uppercase tracking-[0.3em] text-xs transition-all shadow-xl ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>Advance Manuscript</button>
    </div>
  );
};

export default PCASim;
