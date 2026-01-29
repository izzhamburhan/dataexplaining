
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';
import { getMicroExplanation } from '../services/geminiService';
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
  { message: "Unlike linear regression, we are predicting a category (0 or 1). Observe the data clusters.", position: "top-[20%] left-[30%]" },
  { message: "The S-Curve represents probability. It maps any input to a value between 0 (No) and 1 (Yes).", position: "top-[40%] left-[45%]" },
  { message: "The Threshold (τ) is where we draw the line. Anything above it is classified as 'Yes'.", position: "bottom-[25%] left-[10%]" }
];

const LogisticSim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [points, setPoints] = useState<Point[]>(INITIAL_POINTS);
  const [threshold, setThreshold] = useState(0.5);
  const [bias, setBias] = useState(0);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [lastProbe, setLastProbe] = useState<{ x: number, prob: number, pred: number } | null>(null);
  const [activeTourIndex, setActiveTourIndex] = useState(0);
  const [geminiDesc, setGeminiDesc] = useState<string>('Syncing...');
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const debounceTimer = useRef<any>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const isIntro = currentStep === 0;
  const isEngineActive = currentStep === 1;

  useEffect(() => {
    if (isTourActive) setActiveTourIndex(0);
  }, [isTourActive]);

  useEffect(() => {
    if (adjustment?.parameter === 'threshold') { setThreshold(adjustment.value); markInteraction(); }
    if (adjustment?.parameter === 'bias') { setBias(adjustment.value); markInteraction(); }
  }, [adjustment]);

  useEffect(() => {
    setHasActuallyInteracted(isIntro); 
    setLastProbe(null);
  }, [currentStep, isIntro]);

  const markInteraction = () => { if (!hasActuallyInteracted) { setHasActuallyInteracted(true); onInteract?.(); } };

  const sigmoid = (x: number) => 1 / (1 + Math.exp(-(x + bias)));

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 24 - 12;
    const clickY = 1 - (e.clientY - rect.top) / rect.height;
    
    if (isIntro) {
        setLastProbe({ x: clickX, prob: 0, pred: clickY > 0.5 ? 1 : 0 });
        audioService.play('click');
        markInteraction();
    } else {
        const newPoint: Point = { x: clickX, y: clickY > 0.5 ? 1 : 0, isUserAdded: true };
        const prob = sigmoid(clickX);
        const pred = prob >= threshold ? 1 : 0;
        setPoints(prev => [...prev, newPoint]);
        setLastProbe({ x: clickX, prob, pred });
        audioService.play('blip');
        markInteraction();
    }
    setTimeout(() => setLastProbe(null), 3000);
  };

  const accuracy = useMemo(() => {
    if (points.length === 0 || isIntro) return 0;
    const correct = points.filter(p => (sigmoid(p.x) >= threshold ? 1 : 0) === p.y).length;
    return (correct / points.length) * 100;
  }, [bias, threshold, points, isIntro]);

  const analysis = useMemo(() => {
    if (isIntro) return { label: 'Discrete Domains', color: 'text-slate-400', desc: 'Classification deals with mutually exclusive categories. Click points to see their labels.' };
    if (accuracy > 85) return { label: 'Optimal Separation', color: 'text-emerald-600', desc: 'The S-curve effectively partitions the probability space.' };
    return { label: 'Boundary Conflict', color: 'text-amber-600', desc: 'The current parameters result in misclassification. Adjust the bias or threshold.' };
  }, [accuracy, isIntro]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setIsGeminiLoading(true);
      const params = `Threshold: ${threshold.toFixed(2)}, Bias: ${bias.toFixed(1)}, Accuracy: ${accuracy.toFixed(0)}%`;
      const res = await getMicroExplanation("Logistic Regression", params);
      setGeminiDesc(res);
      setIsGeminiLoading(false);
    }, 1500);
    return () => clearTimeout(debounceTimer.current);
  }, [threshold, bias, accuracy]);

  const handleTourNext = () => {
    audioService.play('click');
    if (activeTourIndex < TOUR_STEPS.length - 1) setActiveTourIndex(prev => prev + 1);
    else onTourClose?.();
  };

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative transition-all duration-700">
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
        <div className={`text-right transition-all duration-700 ${isIntro ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Accuracy Rate</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{accuracy.toFixed(0)}%</div>
        </div>
      </div>

      <div className="relative w-full h-[320px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
        <svg ref={svgRef} onClick={handleSvgClick} className="absolute inset-0 w-full h-full cursor-crosshair" viewBox="-12 -0.1 24 1.2" preserveAspectRatio="none">
          <g stroke="#F0F0F0" strokeWidth="0.01">
             <line x1="-12" y1="0" x2="12" y2="0" /><line x1="-12" y1="1" x2="12" y2="1" /><line x1="0" y1="0" x2="0" y2="1" />
          </g>
          {isEngineActive && <path d={Array.from({ length: 101 }).map((_, i) => { const x = (i / 4.16) - 12; const y = sigmoid(x); return `${i === 0 ? 'M' : 'L'} ${x} ${1 - y}`; }).join(' ')} fill="none" stroke="#2A4D69" strokeWidth="0.04" className="transition-all duration-300 animate-in fade-in" />}
          {isEngineActive && <line x1="-12" y1={1 - threshold} x2="12" y2={1 - threshold} stroke="#E11D48" strokeWidth="0.01" strokeDasharray="0.1" className="opacity-30" />}
          {points.map((p, i) => {
            const prob = sigmoid(p.x);
            const isCorrect = isIntro ? true : (prob >= threshold ? 1 : 0) === p.y;
            return (
              <g key={i} transform={`translate(${p.x}, ${1 - p.y})`}>
                <circle r="0.25" fill={isCorrect ? "#121212" : "#E11D48"} className={`transition-all duration-500 ${p.isUserAdded ? 'animate-pulse' : 'opacity-80'}`} />
                {isEngineActive && <line x1="0" y1="0" x2="0" y2={p.y - (1 - prob)} stroke="#CCC" strokeWidth="0.005" strokeDasharray="0.05" className="opacity-40" />}
              </g>
            );
          })}
          {lastProbe && <g transform={`translate(${lastProbe.x}, 0.6)`}><text className="font-mono text-[0.4px] fill-slate-400" textAnchor="middle">{isIntro ? `Value: ${lastProbe.pred === 1 ? 'YES' : 'NO'}` : `P(y=1): ${lastProbe.prob.toFixed(2)}`}</text></g>}
        </svg>
      </div>

      <div className={`w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8 transition-all duration-700 ${isIntro ? 'opacity-20 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'}`}>
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
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5 min-h-[140px] flex flex-col justify-center">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#999] mb-3">Model Analysis</h5>
          <p className="text-xs text-[#444] leading-relaxed italic font-serif mb-4">"{analysis.desc}"</p>
          <div className="pt-4 border-t border-black/5">
            <span className="text-[8px] font-mono font-bold text-[#2A4D69] uppercase tracking-widest block mb-1">Neural Insight</span>
            <p className="text-[11px] text-[#2A4D69] font-serif italic">
              {isGeminiLoading ? 'Classifying...' : `"${geminiDesc}"`}
            </p>
          </div>
        </div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onNext?.(); }} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 px-10 font-bold uppercase tracking-[0.3em] text-sm transition-all shadow-xl flex items-center justify-center group ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
        {nextLabel || 'Advance Manuscript'}
        <svg className="ml-4 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
      </button>
    </div>
  );
};

export default LogisticSim;
