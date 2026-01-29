
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';
import { getMicroExplanation } from '../services/geminiService';
import GuidanceTooltip from './GuidanceTooltip';

const INITIAL_POINTS = [
  { x: 50, y: 50, type: 'A' }, { x: 80, y: 120, type: 'A' }, { x: 120, y: 70, type: 'A' },
  { x: 350, y: 300, type: 'B' }, { x: 420, y: 280, type: 'B' }, { x: 380, y: 350, type: 'B' },
  { x: 100, y: 300, type: 'A' }, { x: 300, y: 100, type: 'B' }, { x: 200, y: 180, type: 'A' },
  { x: 280, y: 320, type: 'B' }
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
  { message: "In KNN, we assume that similar things exist in close proximity. This grid is our 'Feature Space'.", position: "top-[20%] left-[30%]" },
  { message: "The 'K' value determines how many neighbors we consult. A small K is sensitive to local noise.", position: "bottom-[25%] left-[10%]" },
  { message: "Observe the connecting lines. These represent the Euclidean distance between your query and the training data.", position: "top-[40%] left-[45%]" }
];

const KNNSim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [testPoint, setTestPoint] = useState<{ x: number, y: number } | null>(null);
  const [k, setK] = useState(3);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);
  const [geminiDesc, setGeminiDesc] = useState<string>('Syncing...');
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const debounceTimer = useRef<any>(null);

  const isIntro = currentStep === 0;
  const isEngineActive = currentStep === 1;

  useEffect(() => { if (isTourActive) setActiveTourIndex(0); }, [isTourActive]);
  useEffect(() => { if (adjustment?.parameter === 'k') { setK(Math.round(adjustment.value)); markInteraction(); } }, [adjustment]);
  useEffect(() => { setHasActuallyInteracted(isIntro); setTestPoint(null); }, [currentStep, isIntro]);

  const markInteraction = () => { if (!hasActuallyInteracted) { setHasActuallyInteracted(true); onInteract?.(); } };

  const getDist = (p1: { x: number, y: number }, p2: { x: number, y: number }) => 
    Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);

  const neighbors = useMemo(() => {
    if (!testPoint) return [];
    const effectiveK = isIntro ? 3 : k;
    return [...INITIAL_POINTS].sort((a, b) => getDist(a, testPoint) - getDist(b, testPoint)).slice(0, effectiveK);
  }, [testPoint, k, isIntro]);

  const stats = useMemo(() => {
    if (neighbors.length === 0) return { classification: null, confidence: 0, maxDist: 0 };
    const counts = neighbors.reduce((acc, n) => { acc[n.type] = (acc[n.type] || 0) + 1; return acc; }, {} as any);
    const label = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    const maxDist = getDist(testPoint!, neighbors[neighbors.length - 1]);
    return { classification: label, confidence: (counts[label] / (isIntro ? 3 : k)) * 100, maxDist };
  }, [neighbors, k, isIntro, testPoint]);

  const analysis = useMemo(() => {
    if (isIntro) return { label: 'Spatial Proximity', color: 'text-slate-400', desc: 'Identifies neighbors based on Euclidean distance.' };
    if (!testPoint) return { label: 'Awaiting Query', color: 'text-slate-300', desc: 'Click the grid to classify a point.' };
    if (stats.confidence === 100) return { label: 'Unanimous Consensus', color: 'text-emerald-600', desc: 'All neighbors agree. Stable region.' };
    return { label: 'Majority Decision', color: 'text-amber-600', desc: 'Divided neighbors. Lower confidence.' };
  }, [testPoint, stats, isIntro]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setIsGeminiLoading(true);
      const params = `K: ${k}, Confidence: ${stats.confidence.toFixed(0)}%, Points: ${testPoint ? 'Queried' : 'Idle'}`;
      const res = await getMicroExplanation("K-Nearest Neighbors", params);
      setGeminiDesc(res);
      setIsGeminiLoading(false);
    }, 1500);
    return () => clearTimeout(debounceTimer.current);
  }, [k, stats.confidence, testPoint]);

  const handleTourNext = () => {
    audioService.play('click');
    if (activeTourIndex < TOUR_STEPS.length - 1) setActiveTourIndex(prev => prev + 1);
    else onTourClose?.();
  };

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTestPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    audioService.play('blip');
    markInteraction();
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
        <div className="text-right transition-all duration-700">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Consensus Strength</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{stats.confidence.toFixed(0).padStart(3, '0')}%</div>
        </div>
      </div>
      <div className="relative w-full h-[360px] bg-[#FDFCFB] border border-black/5 overflow-hidden cursor-crosshair mb-12 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]" onClick={handleGridClick}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <g stroke="#F0F0F0" strokeWidth="1">
             {Array.from({length: 11}).map((_, i) => (
               <React.Fragment key={i}>
                 <line x1={(i * 10) + '%'} y1="0" x2={(i * 10) + '%'} y2="100%" />
                 <line x1="0" y1={(i * 10) + '%'} x2="100%" y2={(i * 10) + '%'} />
               </React.Fragment>
             ))}
          </g>
          {testPoint && (
            <>
              {isEngineActive && <circle cx={testPoint.x} cy={testPoint.y} r={stats.maxDist} fill="none" stroke="#2A4D69" strokeWidth="0.5" strokeDasharray="4,2" className="opacity-10 animate-pulse" />}
              {neighbors.map((n, i) => <line key={i} x1={testPoint.x} y1={testPoint.y} x2={n.x} y2={n.y} stroke={isIntro ? "#AAA" : (n.type === 'A' ? '#2A4D69' : '#E11D48')} strokeWidth="1" strokeDasharray="4" className="opacity-20 transition-all duration-300" />)}
            </>
          )}
        </svg>
        {INITIAL_POINTS.map((p, i) => <div key={i} className={`absolute w-3 h-3 rotate-45 border border-white/50 shadow-sm transition-all duration-500 ${p.type === 'A' ? 'bg-[#2A4D69]' : 'bg-[#E11D48]'}`} style={{ left: p.x, top: p.y, transform: 'translate(-50%, -50%) rotate(45deg)' }} />)}
        {testPoint && <div className={`absolute w-4 h-4 rotate-45 border-2 border-white shadow-xl z-20 transition-all duration-500 ${isIntro ? 'bg-white' : (stats.classification === 'A' ? 'bg-[#2A4D69]' : 'bg-[#E11D48]')}`} style={{ left: testPoint.x, top: testPoint.y, transform: 'translate(-50%, -50%) rotate(45deg)' }} />}
        {isIntro && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/5 backdrop-blur-[0.5px] pointer-events-none">
            <span className="font-mono text-[9px] font-bold text-[#CCC] uppercase tracking-[0.5em]">Click Grid to Classify New Points</span>
          </div>
        )}
      </div>
      <div className={`w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8 transition-all duration-700 ${isIntro ? 'opacity-20 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'}`}>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Neighborhood Scope (K)</label>
              <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded shadow-sm">{k} Neighbors</span>
            </div>
            <input type="range" min="1" max="9" step="1" value={k} onChange={(e) => { setK(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px bg-black/10 rounded-full appearance-none cursor-pointer accent-[#2A4D69]" />
          </div>
        </div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5 min-h-[140px] flex flex-col justify-center">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#999] mb-3">Model Analysis</h5>
          <p className="text-xs text-[#444] leading-relaxed italic font-serif mb-4">"{analysis.desc}"</p>
          <div className="pt-4 border-t border-black/5">
            <span className="text-[8px] font-mono font-bold text-[#2A4D69] uppercase tracking-widest block mb-1">Neural Insight</span>
            <p className="text-[11px] text-[#2A4D69] font-serif italic">
              {isGeminiLoading ? 'Mapping...' : `"${geminiDesc}"`}
            </p>
          </div>
        </div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onNext?.(); }} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 px-10 font-bold uppercase tracking-[0.3em] text-sm transition-all shadow-xl flex items-center justify-center group ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
        {nextLabel || 'Advance Manuscript'}
        <svg className="ml-4 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </button>
    </div>
  );
};

export default KNNSim;
