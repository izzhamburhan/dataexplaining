
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

interface Point {
  x: number;
  y: number;
  isUserAdded?: boolean;
}

interface Props {
  adjustment?: { parameter: string; value: number } | null;
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isTourActive?: boolean;
  onTourClose?: () => void;
}

const INITIAL_POINTS: Point[] = [
  { x: -8, y: 0 }, { x: -6, y: 0 }, { x: -4, y: 0 }, { x: -3, y: 0 },
  { x: 2, y: 1 }, { x: 4, y: 1 }, { x: 6, y: 1 }, { x: 9, y: 1 }
];

const TOUR_STEPS = [
  { message: "The S-Curve represents probability. It maps any input to a value between 0 (No) and 1 (Yes).", position: "top-[20%] left-[30%]" },
  { message: "The Threshold (τ) is where we draw the line. Anything above it is classified as positive.", position: "top-[45%] left-[10%]" },
  { message: "Bias Shift slides the curve left or right, effectively changing the model's 'strictness'.", position: "bottom-[20%] left-[15%]" }
];

const LogisticSim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [points, setPoints] = useState<Point[]>(INITIAL_POINTS);
  const [threshold, setThreshold] = useState(0.5);
  const [bias, setBias] = useState(0);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [lastProbe, setLastProbe] = useState<{ x: number, prob: number, pred: number } | null>(null);
  const [activeTourIndex, setActiveTourIndex] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (isTourActive) setActiveTourIndex(0);
  }, [isTourActive]);

  useEffect(() => {
    if (adjustment?.parameter === 'threshold') { setThreshold(adjustment.value); markInteraction(); }
    if (adjustment?.parameter === 'bias') { setBias(adjustment.value); markInteraction(); }
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

  const sigmoid = (x: number) => 1 / (1 + Math.exp(-(x + bias)));

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 24 - 12;
    const clickY = 1 - (e.clientY - rect.top) / rect.height;
    const newPoint: Point = { x: clickX, y: clickY > 0.5 ? 1 : 0, isUserAdded: true };
    const prob = sigmoid(clickX);
    const pred = prob >= threshold ? 1 : 0;
    setPoints(prev => [...prev, newPoint]);
    setLastProbe({ x: clickX, prob, pred });
    audioService.play('blip');
    markInteraction();
    setTimeout(() => setLastProbe(null), 3000);
  };

  const accuracy = useMemo(() => {
    if (points.length === 0) return 0;
    const correct = points.filter(p => (sigmoid(p.x) >= threshold ? 1 : 0) === p.y).length;
    return (correct / points.length) * 100;
  }, [bias, threshold, points]);

  const analysis = useMemo(() => {
    if (accuracy > 85) return { label: 'Optimal Separation', color: 'text-emerald-600', desc: 'The S-curve effectively partitions the probability space.' };
    return { label: 'Boundary Conflict', color: 'text-amber-600', desc: 'The current parameters result in misclassification. Adjust the bias or threshold.' };
  }, [accuracy]);

  const handleTourNext = () => {
    audioService.play('click');
    if (activeTourIndex < TOUR_STEPS.length - 1) setActiveTourIndex(prev => prev + 1);
    else onTourClose?.();
  };

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative">
      {isTourActive && (
        <GuidanceTooltip 
          message={TOUR_STEPS[activeTourIndex].message}
          position={TOUR_STEPS[activeTourIndex].position}
          onNext={handleTourNext}
          onClose={() => onTourClose?.()}
          isLast={activeTourIndex === TOUR_STEPS.length - 1}
        />
      )}
      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className="text-right flex space-x-8">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">N. Samples</div>
            <div className="text-2xl font-mono font-bold tabular-nums">{points.length.toString().padStart(2, '0')}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Accuracy</div>
            <div className="text-2xl font-mono font-bold tabular-nums">{accuracy.toFixed(0)}%</div>
          </div>
        </div>
      </div>
      <div className="relative w-full h-[320px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] group">
        <svg ref={svgRef} onClick={handleSvgClick} className="absolute inset-0 w-full h-full cursor-crosshair" viewBox="-12 -0.1 24 1.2" preserveAspectRatio="none">
          <path d={Array.from({ length: 101 }).map((_, i) => { const x = (i / 4.16) - 12; const y = sigmoid(x); return `${i === 0 ? 'M' : 'L'} ${x} ${1 - y}`; }).join(' ')} fill="none" stroke="#2A4D69" strokeWidth="0.08" className="transition-all duration-300" />
          <line x1="-12" y1={1 - threshold} x2="12" y2={1 - threshold} stroke="#E11D48" strokeWidth="0.02" strokeDasharray="0.1" className="opacity-40" />
          {points.map((p, i) => {
            const prob = sigmoid(p.x);
            const isCorrect = (prob >= threshold ? 1 : 0) === p.y;
            return (
              <g key={i} transform={`translate(${p.x}, ${1 - p.y})`}>
                <circle r="0.25" fill={isCorrect ? "#121212" : "#E11D48"} className={`${p.isUserAdded ? 'animate-bounce' : 'opacity-80'}`} />
                <line x1="0" y1="0" x2="0" y2={p.y - (1 - prob)} stroke="#CCC" strokeWidth="0.01" strokeDasharray="0.05" />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Decision Threshold (τ)</label>
              <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{threshold.toFixed(2)}</span>
            </div>
            <input type="range" min="0.1" max="0.9" step="0.01" value={threshold} onChange={(e) => { setThreshold(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px bg-black/10 rounded-full appearance-none cursor-pointer accent-[#E11D48]" />
          </div>
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Bias Shift (β0)</label>
              <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{bias.toFixed(1)}</span>
            </div>
            <input type="range" min="-8" max="8" step="0.2" value={bias} onChange={(e) => { setBias(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px bg-black/10 rounded-full appearance-none cursor-pointer accent-[#2A4D69]" />
          </div>
        </div>
        <div className="bg-[#F9F8F6] p-6 border-l-2 border-black/5">
          <p className="text-xs text-[#444] leading-relaxed italic font-normal">"{analysis.desc}"</p>
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

export default LogisticSim;
