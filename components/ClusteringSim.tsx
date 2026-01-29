
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { audioService } from '../services/audioService';
import { getMicroExplanation } from '../services/geminiService';
import GuidanceTooltip from './GuidanceTooltip';

const COLORED_POINTS = [
  ...Array.from({ length: 15 }, (_, i) => ({ id: i, x: Math.random() * 250 + 50, y: Math.random() * 250 + 50, group: 'A' })),
  ...Array.from({ length: 15 }, (_, i) => ({ id: i + 15, x: Math.random() * 250 + 500, y: Math.random() * 250 + 250, group: 'B' })),
  ...Array.from({ length: 15 }, (_, i) => ({ id: i + 30, x: Math.random() * 250 + 100, y: Math.random() * 150 + 400, group: 'C' })),
];

const COLORS = ['#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6'];
const GROUP_COLORS = { 'A': '#121212', 'B': '#E11D48', 'C': '#2A4D69' };

interface Props {
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isTourActive?: boolean;
  onTourClose?: () => void;
  adjustment?: { parameter: string; value: number; id: number } | null;
}

const TOUR_STEPS = [
  { message: "K-Means groups data points by their proximity to 'Centroids'.", position: "top-[20%] left-[10%]" },
  { message: "In Phase 2, click 'Step Convergence' to see the centroids calculate their own center.", position: "top-[40%] left-[40%]" },
  { message: "In Phase 3, notice how spatial clustering often reinforces existing demographic boundaries.", position: "bottom-[15%] left-[20%]" }
];

const ClusteringSim: React.FC<Props> = ({ currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose, adjustment }) => {
  const [k, setK] = useState(3);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [centroids, setCentroids] = useState(() => Array.from({ length: 5 }, (_, i) => ({ x: 150 + i * 150, y: 250 + (i % 2) * 100 })));
  const [activeTourIndex, setActiveTourIndex] = useState(0);
  const [isDragging, setIsDragging] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [geminiDesc, setGeminiDesc] = useState<string>('Syncing...');
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const debounceTimer = useRef<any>(null);

  const isFoundation = currentStep === 0;
  const isOptimization = currentStep === 1;
  const isRedlining = currentStep === 2;

  useEffect(() => { if (isTourActive) setActiveTourIndex(0); }, [isTourActive]);
  
  useEffect(() => { 
    setHasActuallyInteracted(isFoundation);
    if (isRedlining) setK(3); 
  }, [currentStep, isFoundation, isRedlining]);

  useEffect(() => {
    if (adjustment?.parameter === 'k') {
      setK(Math.max(2, Math.min(5, Math.round(adjustment.value))));
      markInteraction();
    }
  }, [adjustment?.id]);

  const markInteraction = () => { if (!hasActuallyInteracted) { setHasActuallyInteracted(true); onInteract?.(); } };

  const activeCentroids = useMemo(() => centroids.slice(0, k), [centroids, k]);
  
  const results = useMemo(() => {
    let totalInertia = 0;
    const assignments = COLORED_POINTS.map(p => {
      let minDist = Infinity, clusterIdx = 0;
      activeCentroids.forEach((c, idx) => {
        const d = Math.sqrt((p.x - c.x)**2 + (p.y - c.y)**2);
        if (d < minDist) { minDist = d; clusterIdx = idx; }
      });
      totalInertia += minDist;
      return { ...p, clusterIdx };
    });
    return { assignments, inertia: totalInertia };
  }, [activeCentroids, k]);

  const biasMetrics = useMemo(() => {
    if (!isRedlining) return { segregationIndex: 0 };
    let pureNodes = 0;
    for (let i = 0; i < k; i++) {
      const cluster = results.assignments.filter(a => a.clusterIdx === i);
      if (cluster.length > 0) {
        const groupCounts: any = {};
        cluster.forEach(p => groupCounts[p.group] = (groupCounts[p.group] || 0) + 1);
        const max = Math.max(...Object.values(groupCounts) as number[]);
        if (max / cluster.length > 0.8) pureNodes++;
      }
    }
    return { segregationIndex: (pureNodes / k) * 100 };
  }, [results, k, isRedlining]);

  const analysis = useMemo(() => {
    if (isRedlining) {
      if (biasMetrics.segregationIndex > 60) return { label: 'Spatial Segregation', color: 'text-rose-600', desc: 'Algorithm perfectly mapped spatial distance to demographics.' };
      return { label: 'Mixed Distribution', color: 'text-slate-400', desc: 'Clusters overlap multiple groups, indicating integration.' };
    }
    const avg = results.inertia / COLORED_POINTS.length;
    return { label: avg < 80 ? 'Coherent Clusters' : 'Dispersed Points', color: avg < 80 ? 'text-emerald-600' : 'text-amber-600', desc: avg < 80 ? 'Clear group coherence found.' : 'Centroids are far from data points.' };
  }, [results.inertia, biasMetrics.segregationIndex, isRedlining]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setIsGeminiLoading(true);
      const params = `K: ${k}, Inertia: ${Math.round(results.inertia)}, Segregation: ${biasMetrics.segregationIndex.toFixed(0)}%, Mode: ${isRedlining ? 'Bias Analysis' : 'Optimization'}`;
      const res = await getMicroExplanation("K-Means Clustering", params);
      setGeminiDesc(res);
      setIsGeminiLoading(false);
    }, 1500);
    return () => clearTimeout(debounceTimer.current);
  }, [k, results.inertia, biasMetrics.segregationIndex, isRedlining]);

  const runConvergenceStep = () => {
    markInteraction();
    audioService.play('blip');
    const newCentroids = [...centroids];
    for (let i = 0; i < k; i++) {
      const assignedPoints = results.assignments.filter(a => a.clusterIdx === i);
      if (assignedPoints.length > 0) {
        const meanX = assignedPoints.reduce((sum, p) => sum + p.x, 0) / assignedPoints.length;
        const meanY = assignedPoints.reduce((sum, p) => sum + p.y, 0) / assignedPoints.length;
        newCentroids[i] = { x: meanX, y: meanY };
      }
    }
    setCentroids(newCentroids);
  };

  const handleDrag = (e: MouseEvent | TouchEvent, idx: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    const viewX = ((cx - rect.left) / rect.width) * 800;
    const viewY = ((cy - rect.top) / rect.height) * 560;
    setCentroids(prev => { 
      const next = [...prev]; 
      next[idx] = { x: Math.max(10, Math.min(viewX, 790)), y: Math.max(10, Math.min(viewY, 550)) }; 
      return next; 
    });
    markInteraction();
  };

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
        <div className="text-right flex space-x-12">
          {isRedlining && (
            <div className="animate-in slide-in-from-right-4">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-rose-300 mb-2">Segregation Index</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-rose-600">{biasMetrics.segregationIndex.toFixed(0)}%</div>
            </div>
          )}
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">System Inertia</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-[#121212]">{Math.round(results.inertia).toString().padStart(5, '0')}</div>
          </div>
        </div>
      </div>
      <div ref={containerRef} className="relative w-full h-[400px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-inner cursor-default">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 560" preserveAspectRatio="none">
           <g stroke="#F0F0F0" strokeWidth="1">
            {Array.from({ length: 17 }).map((_, i) => (
              <React.Fragment key={i}>
                <line x1={i * 50} y1="0" x2={i * 50} y2="560" />
                <line x1="0" y1={i * 35} x2="800" y2={i * 35} />
              </React.Fragment>
            ))}
          </g>
          {results.assignments.map(p => <line key={p.id} x1={p.x} y1={p.y} x2={activeCentroids[p.clusterIdx].x} y2={activeCentroids[p.clusterIdx].y} stroke={COLORS[p.clusterIdx]} strokeWidth="1" strokeDasharray="5,5" opacity="0.15" />)}
        </svg>

        {results.assignments.map(p => (
          <div key={p.id} className="absolute w-3 h-3 rotate-45 transition-all duration-300 shadow-sm" style={{ left: `${(p.x/800)*100}%`, top: `${(p.y/560)*100}%`, backgroundColor: isRedlining ? (GROUP_COLORS[p.group as keyof typeof GROUP_COLORS]) : COLORS[p.clusterIdx], transform: 'translate(-50%, -50%) rotate(45deg)', border: isRedlining ? `2px solid ${COLORS[p.clusterIdx]}` : 'none' }}>
            {isRedlining && <div className="absolute inset-[-4px] border border-white/40 rotate-45" />}
          </div>
        ))}

        {activeCentroids.map((c, i) => (
          <div key={i} onMouseDown={(e) => { setIsDragging(i); const move = (me: any) => handleDrag(me, i); const up = () => { setIsDragging(null); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); }; window.addEventListener('mousemove', move); window.addEventListener('mouseup', up); }} className={`absolute w-12 h-12 bg-white border-4 rounded-sm shadow-2xl z-20 flex items-center justify-center cursor-move active:scale-125 transition-[transform,border-color] duration-200`} style={{ left: `${(c.x/800)*100}%`, top: `${(c.y/560)*100}%`, borderColor: COLORS[i], transform: 'translate(-50%, -50%)' }}>
            <span className="font-mono text-xs font-bold" style={{ color: COLORS[i] }}>#{i+1}</span>
          </div>
        ))}
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-8">
          {isOptimization && <button onClick={runConvergenceStep} className="w-full py-5 bg-[#121212] text-white text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-[#2A4D69] transition-all shadow-xl animate-in fade-in zoom-in">Step Mean Convergence</button>}
          {!isRedlining ? (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Target Groups (K)</label>
                <span className="text-[11px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-3 py-1 rounded border border-black/5 shadow-sm">{k} Clusters</span>
              </div>
              <input type="range" min="2" max="5" step="1" value={k} onChange={(e) => { setK(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-1 appearance-none bg-black/10 accent-[#2A4D69] cursor-pointer" />
            </div>
          ) : (
            <div className="bg-[#FDFCFB] border border-black/5 p-6 rounded-sm animate-in slide-in-from-bottom-2">
               <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#999] mb-2">Clustering as Proxy</h5>
               <p className="text-[11px] leading-relaxed italic text-[#666]">In this phase, points are colored by demographic. Notice how clusters align without explicit labels.</p>
            </div>
          )}
        </div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5 min-h-[140px] flex flex-col justify-center">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#999] mb-3">Model Analysis</h5>
          <p className="text-sm text-[#444] italic font-serif leading-relaxed mb-4">"{analysis.desc}"</p>
          <div className="pt-4 border-t border-black/5">
            <span className="text-[8px] font-mono font-bold text-[#2A4D69] uppercase tracking-widest block mb-1">Neural Insight</span>
            <p className="text-[11px] text-[#2A4D69] font-serif italic">
              {isGeminiLoading ? 'Evaluating...' : `"${geminiDesc}"`}
            </p>
          </div>
        </div>
      </div>

      <button onClick={onNext} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 font-bold uppercase tracking-[0.3em] text-xs transition-all shadow-xl flex items-center justify-center group ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
        {nextLabel || 'Advance Manuscript'}
        <svg className="ml-4 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </button>
    </div>
  );
};

export default ClusteringSim;
