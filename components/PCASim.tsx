
import React, { useState, useMemo, useEffect } from 'react';
import { audioService } from '../services/audioService';

interface Props {
  adjustment?: { parameter: string; value: number } | null;
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
}

const POINTS = [
  { x: 120, y: 150 }, { x: 150, y: 160 }, { x: 180, y: 190 }, { x: 210, y: 220 },
  { x: 240, y: 230 }, { x: 270, y: 270 }, { x: 300, y: 290 }, { x: 330, y: 320 },
  { x: 200, y: 200 }, { x: 260, y: 260 }, { x: 360, y: 330 }
];

const PCASim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel }) => {
  const [angle, setAngle] = useState(0);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);

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
    return { projected, capture: Math.min(100, (sumSqDist / 38000) * 100) };
  }, [rad]);

  const analysis = useMemo(() => ({
    label: varianceData.capture > 90 ? 'Principal Component' : 'Information Loss',
    color: varianceData.capture > 90 ? 'text-emerald-600' : 'text-amber-600',
    desc: varianceData.capture > 90 ? 'Maximum variance captured along this axis. This projection preserves most data variance.' : 'Axis is misaligned with the primary data trend. Projection leads to significant information loss.'
  }), [varianceData.capture]);

  return (
    <div className="bg-white p-6 border border-black/5 shadow-[0_20px_60px_rgba(0,0,0,0.03)] w-full max-w-2xl flex flex-col items-center">
      <div className="w-full flex justify-between items-end mb-4 border-b border-black/5 pb-2">
        <div>
          <h4 className="font-mono text-[8px] font-bold uppercase tracking-widest text-[#CCC] mb-1">Diagnostic Output</h4>
          <div className={`text-lg font-serif italic ${analysis.color}`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[8px] font-bold uppercase tracking-widest text-[#CCC] mb-1">Variance Capture</div>
          <div className="text-xl font-mono font-bold tabular-nums text-[#2A4D69]">{varianceData.capture.toFixed(1)}%</div>
        </div>
      </div>
      <div className="relative w-full h-[180px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-6 shadow-inner">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet">
          <line x1={centerX - Math.cos(rad)*400} y1={centerY - Math.sin(rad)*400} x2={centerX + Math.cos(rad)*400} y2={centerY + Math.sin(rad)*400} stroke="#121212" strokeWidth="2" strokeDasharray="8,4" opacity="0.15" />
          {varianceData.projected.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="5" fill="#999" opacity="0.7" />
              <line x1={p.x} y1={p.y} x2={p.projX} y2={p.projY} stroke="#BBB" strokeWidth="0.5" strokeDasharray="2,2" />
              <circle cx={p.projX} cy={p.projY} r="7" fill="#2A4D69" opacity="0.95" />
            </g>
          ))}
        </svg>
      </div>
      <div className="w-full grid grid-cols-2 gap-8 items-start mb-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[8px] font-mono font-bold text-[#999] uppercase tracking-widest">Rotation Axis</label>
            <span className="text-[12px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-1 rounded border border-black/5 shadow-sm">{angle}° deg</span>
          </div>
          <input type="range" min="0" max="180" step="1" value={angle} onChange={(e) => { setAngle(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px appearance-none bg-black/10 accent-[#2A4D69]" />
        </div>
        <div className="bg-[#F9F8F6] p-4 border-l-2 border-black/5 text-[11px] italic font-serif leading-relaxed">"{analysis.desc}"</div>
      </div>
      <button onClick={onNext} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-4 font-bold uppercase tracking-widest text-[9px] transition-all shadow-lg ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>Advance Manuscript</button>
    </div>
  );
};

export default PCASim;
