
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

const POINTS = Array.from({ length: 45 }, (_, i) => ({
  id: i,
  x: Math.random() * 380 + 60,
  y: Math.random() * 280 + 60
}));

const COLORS = ['#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6'];

interface Props {
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isTourActive?: boolean;
  onTourClose?: () => void;
}

const TOUR_STEPS = [
  { message: "K-Means finds clusters by positioning 'Centroids' in the center of data density.", position: "top-[20%] left-[30%]" },
  { message: "Drag the colorful centroids to reposition them. Every point automatically joins its nearest centroid.", position: "top-[40%] left-[45%]" },
  { message: "Total Inertia measures the sum of distances. Your goal is to minimize this value.", position: "top-[10%] right-[10%]" }
];

const ClusteringSim: React.FC<Props> = ({ currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [k, setK] = useState(3);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [centroids, setCentroids] = useState(() => Array.from({ length: 5 }, (_, i) => ({ x: 100 + i * 80, y: 100 + (i % 2) * 150 })));
  const [activeTourIndex, setActiveTourIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTourActive) setActiveTourIndex(0);
  }, [isTourActive]);

  useEffect(() => {
    setHasActuallyInteracted(currentStep === 0);
  }, [currentStep]);

  const markInteraction = () => {
    if (!hasActuallyInteracted) {
      setHasActuallyInteracted(true);
      onInteract?.();
    }
  };

  const getDistance = (p1: {x:number, y:number}, p2: {x:number, y:number}) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

  const activeCentroids = useMemo(() => centroids.slice(0, k), [centroids, k]);

  const results = useMemo(() => {
    let totalInertia = 0;
    const assignments = POINTS.map(p => {
      let minDist = Infinity, clusterIdx = 0;
      activeCentroids.forEach((c, idx) => {
        const d = getDistance(p, c);
        if (d < minDist) { minDist = d; clusterIdx = idx; }
      });
      totalInertia += minDist;
      return { ...p, clusterIdx, dist: minDist };
    });
    return { assignments, inertia: totalInertia };
  }, [activeCentroids]);

  const analysis = useMemo(() => {
    const avgDist = results.inertia / POINTS.length;
    if (avgDist < 40) return { label: 'Optimal Grouping', color: 'text-emerald-600', desc: 'The centroids are well-placed. The average distance within clusters is minimal, indicating high internal cohesion.' };
    if (avgDist < 80) return { label: 'Approximated Clusters', color: 'text-amber-600', desc: 'The centroids capture the general flow, but some points are loosely bound. Refine the positions to tighten the groups.' };
    return { label: 'Disconnected Layout', color: 'text-rose-600', desc: 'The inertia is high. The centroids do not represent the underlying data density accurately.' };
  }, [results.inertia]);

  const handleDrag = (e: React.MouseEvent | React.TouchEvent, idx: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    const x = Math.max(20, Math.min(clientX - rect.left, rect.width - 20));
    const y = Math.max(20, Math.min(clientY - rect.top, rect.height - 20));
    markInteraction();
    setCentroids(prev => { const next = [...prev]; next[idx] = { x, y }; return next; });
  };

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
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Total Inertia</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{Math.round(results.inertia).toString().padStart(5, '0')}</div>
        </div>
      </div>

      <div ref={containerRef} className="relative w-full h-[360px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {results.assignments.map((p) => (
            <line key={`line-${p.id}`} x1={p.x} y1={p.y} x2={activeCentroids[p.clusterIdx].x} y2={activeCentroids[p.clusterIdx].y} stroke={COLORS[p.clusterIdx]} strokeWidth="0.5" strokeDasharray="2,4" className="opacity-20 transition-all duration-300" />
          ))}
        </svg>
        
        {results.assignments.map((p) => (
          <div key={p.id} className="absolute w-2.5 h-2.5 rotate-45 border border-white/40 transition-colors duration-300" style={{ left: p.x, top: p.y, transform: 'translate(-50%, -50%) rotate(45deg)', backgroundColor: COLORS[p.clusterIdx] }} />
        ))}
        
        {activeCentroids.map((c, i) => (
          <div 
            key={`centroid-${i}`} 
            onMouseDown={(e) => { 
              audioService.play('click'); 
              const move = (me: MouseEvent) => handleDrag(me as any, i); 
              const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); }; 
              window.addEventListener('mousemove', move); window.addEventListener('mouseup', up); 
            }} 
            className="absolute w-12 h-12 bg-white border-2 rounded shadow-xl z-20 flex flex-col items-center justify-center cursor-move transition-transform hover:scale-110 active:scale-95" 
            style={{ left: c.x, top: c.y, borderColor: COLORS[i], transform: 'translate(-50%, -50%)' }}
          >
            <div className="w-2 h-2 rounded-full animate-ping mb-1" style={{ backgroundColor: COLORS[i] }} />
            <span className="font-mono text-[8px] font-bold" style={{ color: COLORS[i] }}>C{i+1}</span>
          </div>
        ))}

        {/* Legend */}
        <div className="absolute top-4 right-4 flex flex-col items-end space-y-2 bg-white/80 backdrop-blur-sm p-4 border border-black/5 rounded shadow-sm">
           <span className="font-mono text-[8px] text-[#999] uppercase tracking-widest mb-1">Cluster Domains</span>
           <div className="flex space-x-2">
              {activeCentroids.map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[i] }} />
              ))}
           </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-6">
           <div>
              <div className="flex justify-between mb-4">
                <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Number of Clusters (K)</label>
                <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{k}</span>
              </div>
              <input type="range" min="2" max="5" step="1" value={k} onChange={(e) => { setK(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px appearance-none bg-black/10 rounded-full cursor-pointer accent-[#2A4D69]" />
           </div>
           <p className="text-[10px] text-[#666] leading-relaxed italic">Drag the centroids to find the natural center of mass for each data group.</p>
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

export default ClusteringSim;
