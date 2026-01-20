
import React, { useState, useMemo, useEffect } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

const INITIAL_POINTS = [
  { x: 50, y: 50, type: 'A' }, { x: 80, y: 120, type: 'A' }, { x: 120, y: 70, type: 'A' },
  { x: 350, y: 300, type: 'B' }, { x: 420, y: 280, type: 'B' }, { x: 380, y: 350, type: 'B' },
  { x: 100, y: 300, type: 'A' }, { x: 300, y: 100, type: 'B' }
];

interface Props {
  adjustment?: { parameter: string; value: number } | null;
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isTourActive?: boolean;
  onTourClose?: () => void;
}

const TOUR_STEPS = [
  { message: "KNN classifies new data based on its physical neighbors in this feature space.", position: "top-[20%] left-[30%]" },
  { message: "Click anywhere on the grid to place a new observation and see it classified in real-time.", position: "top-[40%] left-[45%]" },
  { message: "K (Neighborhood Scope) determines how many neighbors vote. Small K is sensitive; large K is stable.", position: "bottom-[20%] left-[10%]" }
];

const KNNSim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [testPoint, setTestPoint] = useState<{ x: number, y: number } | null>(null);
  const [k, setK] = useState(3);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);

  useEffect(() => {
    if (isTourActive) setActiveTourIndex(0);
  }, [isTourActive]);

  useEffect(() => {
    if (adjustment?.parameter === 'k') { setK(Math.round(adjustment.value)); markInteraction(); }
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

  const getDist = (p1: { x: number, y: number }, p2: { x: number, y: number }) => Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);

  const neighbors = useMemo(() => {
    if (!testPoint) return [];
    return [...INITIAL_POINTS].sort((a, b) => getDist(a, testPoint) - getDist(b, testPoint)).slice(0, k);
  }, [testPoint, k]);

  const stats = useMemo(() => {
    if (neighbors.length === 0) return { classification: null, confidence: 0 };
    const counts = neighbors.reduce((acc, n) => { acc[n.type] = (acc[n.type] || 0) + 1; return acc; }, {} as any);
    const label = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    return { classification: label, confidence: (counts[label] / k) * 100 };
  }, [neighbors, k]);

  const analysis = useMemo(() => {
    if (!testPoint) return { label: 'Awaiting Input', color: 'text-slate-300', desc: 'Click the simulation grid to classify a hypothetical point.' };
    return { label: stats.confidence === 100 ? 'Absolute Consensus' : 'Strong Majority', color: stats.confidence === 100 ? 'text-emerald-600' : 'text-amber-600', desc: 'The model has identified a likely category.' };
  }, [testPoint, stats]);

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
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Confidence Level</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{stats.confidence.toFixed(0).padStart(3, '0')}%</div>
        </div>
      </div>
      <div className="relative w-full h-[340px] bg-[#FDFCFB] border border-black/5 overflow-hidden cursor-crosshair mb-12" onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setTestPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top }); audioService.play('blip'); markInteraction(); }}>
        {INITIAL_POINTS.map((p, i) => (
          <div key={i} className={`absolute w-3 h-3 rotate-45 border border-white/50 shadow-sm ${p.type === 'A' ? 'bg-[#2A4D69]' : 'bg-[#E11D48]'}`} style={{ left: p.x, top: p.y, transform: 'translate(-50%, -50%) rotate(45deg)' }} />
        ))}
        {testPoint && (
          <>
            <div className={`absolute w-4 h-4 rounded-full border-2 border-white shadow-lg z-20 ${stats.classification === 'A' ? 'bg-[#2A4D69]' : 'bg-[#E11D48]'}`} style={{ left: testPoint.x, top: testPoint.y, transform: 'translate(-50%, -50%)' }} />
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {neighbors.map((n, i) => <line key={i} x1={testPoint.x} y1={testPoint.y} x2={n.x} y2={n.y} stroke={n.type === 'A' ? '#2A4D69' : '#E11D48'} strokeWidth="1" strokeDasharray="4" className="opacity-20" />)}
            </svg>
          </>
        )}
      </div>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Neighborhood Scope (K)</label>
              <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{k}</span>
            </div>
            <input type="range" min="1" max="7" step="1" value={k} onChange={(e) => { setK(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px bg-black/10 rounded-full appearance-none cursor-pointer accent-[#2A4D69]" />
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

export default KNNSim;
