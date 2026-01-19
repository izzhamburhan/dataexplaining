
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
}

const ClusteringSim: React.FC<Props> = ({ currentStep = 0, onInteract, onNext, nextLabel }) => {
  const [k, setK] = useState(3);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [centroids, setCentroids] = useState(() => 
    Array.from({ length: 5 }, (_, i) => ({
      x: 100 + i * 80,
      y: 100 + (i % 2) * 150
    }))
  );
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasActuallyInteracted(currentStep === 0);
  }, [currentStep]);

  const markInteraction = () => {
    if (!hasActuallyInteracted) {
      setHasActuallyInteracted(true);
      onInteract?.();
    }
  };

  const getDistance = (p1: {x:number, y:number}, p2: {x:number, y:number}) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  const activeCentroids = useMemo(() => centroids.slice(0, k), [centroids, k]);

  const results = useMemo(() => {
    let totalInertia = 0;
    const assignments = POINTS.map(p => {
      let minDist = Infinity;
      let clusterIdx = 0;
      activeCentroids.forEach((c, idx) => {
        const d = getDistance(p, c);
        if (d < minDist) {
          minDist = d;
          clusterIdx = idx;
        }
      });
      totalInertia += minDist;
      return { ...p, clusterIdx, dist: minDist };
    });
    return { assignments, inertia: totalInertia };
  }, [activeCentroids]);

  const analysis = useMemo(() => {
    const inertia = results.inertia;
    const avgDist = inertia / POINTS.length;
    
    if (avgDist < 50) return { label: 'Optimal Grouping', color: 'text-emerald-600', desc: 'Centroids are well-positioned. The "Inertia" (sum of squared distances) is minimized, indicating tight clusters.' };
    if (avgDist < 90) return { label: 'Coarse Separation', color: 'text-amber-600', desc: 'The centroids capture the general groups, but some points are far from their centers. Try repositioning centroids.' };
    return { label: 'High Cluster Variance', color: 'text-rose-600', desc: 'Clusters are poorly defined. The model is failing to identify distinct groups within the data manifold.' };
  }, [results.inertia]);

  const handleDrag = (e: React.MouseEvent | React.TouchEvent, idx: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const boundedX = Math.max(20, Math.min(x, rect.width - 20));
    const boundedY = Math.max(20, Math.min(y, rect.height - 20));

    markInteraction();
    setCentroids(prev => {
      const next = [...prev];
      next[idx] = { x: boundedX, y: boundedY };
      return next;
    });
  };

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative">
      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Total Inertia</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{Math.round(results.inertia).toString().padStart(5, '0')}</div>
        </div>
      </div>

      <div ref={containerRef} className="relative w-full h-[360px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {results.assignments.map((p) => (
            <line key={`line-${p.id}`} x1={p.x} y1={p.y} x2={activeCentroids[p.clusterIdx].x} y2={activeCentroids[p.clusterIdx].y} stroke={COLORS[p.clusterIdx]} strokeWidth="0.5" strokeDasharray="2,4" className="opacity-20 transition-all duration-300" />
          ))}
        </svg>
        {results.assignments.map((p) => (
          <div key={p.id} className="absolute w-2 h-2 rotate-45 transition-all duration-500 border border-white/50 shadow-sm z-10" style={{ left: p.x, top: p.y, transform: 'translate(-50%, -50%) rotate(45deg)', backgroundColor: COLORS[p.clusterIdx] }} />
        ))}
        {activeCentroids.map((c, i) => (
          <div key={`centroid-${i}`} onMouseDown={(e) => { 
            audioService.play('click'); 
            markInteraction(); 
            const move = (me: MouseEvent) => handleDrag(me as any, i); 
            const up = () => { 
              window.removeEventListener('mousemove', move); 
              window.removeEventListener('mouseup', up); 
            }; 
            window.addEventListener('mousemove', move); 
            window.addEventListener('mouseup', up); 
          }} className="absolute w-10 h-10 bg-white border-2 rounded shadow-xl z-20 flex items-center justify-center cursor-move transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 active:scale-95 transition-all" style={{ left: c.x, top: c.y, borderColor: COLORS[i] }}>
            <div className="w-1 h-3 rounded-full absolute" style={{ backgroundColor: COLORS[i] }} />
            <div className="w-3 h-1 rounded-full absolute" style={{ backgroundColor: COLORS[i] }} />
          </div>
        ))}
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Cluster Count (K)</label>
              <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{k}</span>
            </div>
            <input type="range" min="2" max="5" value={k} onChange={(e) => { setK(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px bg-black/10 rounded-full appearance-none cursor-pointer accent-[#2A4D69]" />
          </div>
        </div>
        <div className="bg-[#F9F8F6] p-6 border-l-2 border-black/5">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#999] mb-3">Model Analysis</h5>
          <p className="text-xs text-[#444] leading-relaxed italic font-normal">"{analysis.desc}"</p>
        </div>
      </div>

      {/* NEXT STEP BUTTON AREA */}
      <div className={`w-full p-8 border-2 border-dashed border-[#A5C9FF]/50 transition-all duration-500 bg-[#F9FBFF]/30 mt-4 ${hasActuallyInteracted ? 'opacity-100' : 'opacity-0'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); onNext?.(); }}
          className="w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 px-10 font-bold uppercase tracking-[0.3em] text-sm transition-all shadow-xl flex items-center justify-center group"
        >
          {nextLabel || 'Advance Manuscript'}
          <svg className="ml-4 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </button>
      </div>
    </div>
  );
};

export default ClusteringSim;
