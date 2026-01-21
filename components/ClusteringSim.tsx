
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { audioService } from '../services/audioService';

const POINTS = Array.from({ length: 35 }, (_, i) => ({ id: i, x: Math.random() * 380 + 60, y: Math.random() * 260 + 60 }));
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
  const [centroids, setCentroids] = useState(() => Array.from({ length: 5 }, (_, i) => ({ x: 100 + i * 80, y: 150 + (i % 2) * 100 })));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setHasActuallyInteracted(currentStep === 0); }, [currentStep]);

  const markInteraction = () => { if (!hasActuallyInteracted) { setHasActuallyInteracted(true); onInteract?.(); } };

  const activeCentroids = useMemo(() => centroids.slice(0, k), [centroids, k]);
  const results = useMemo(() => {
    let totalInertia = 0;
    const assignments = POINTS.map(p => {
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

  const analysis = useMemo(() => {
    const avg = results.inertia / POINTS.length;
    return { label: avg < 55 ? 'Tight Clusters' : 'Loose Data', color: avg < 55 ? 'text-emerald-600' : 'text-amber-600', desc: avg < 55 ? 'Clear internal group coherence found.' : 'The centroids are far from their data points. Reposition them to reduce error.' };
  }, [results.inertia]);

  const handleDrag = (e: MouseEvent | TouchEvent, idx: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    
    // Calculate normalized relative coordinates (0 to 1)
    const relX = (cx - rect.left) / rect.width;
    const relY = (cy - rect.top) / rect.height;

    // Map the relative coordinates to the 500x400 viewBox
    const viewX = relX * 500;
    const viewY = relY * 400;

    setCentroids(prev => { 
      const next = [...prev]; 
      next[idx] = { 
        x: Math.max(5, Math.min(viewX, 495)), 
        y: Math.max(5, Math.min(viewY, 395)) 
      }; 
      return next; 
    });
    markInteraction();
  };

  return (
    <div className="bg-white p-6 border border-black/5 shadow-[0_20px_60px_rgba(0,0,0,0.03)] w-full max-w-2xl flex flex-col items-center">
      <div className="w-full flex justify-between items-end mb-4 border-b border-black/5 pb-2">
        <div>
          <h4 className="font-mono text-[8px] font-bold uppercase tracking-widest text-[#CCC] mb-1">Diagnostic Output</h4>
          <div className={`text-lg font-serif italic ${analysis.color}`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[8px] font-bold uppercase tracking-widest text-[#CCC] mb-1">Inertia</div>
          <div className="text-lg font-mono font-bold tabular-nums">{Math.round(results.inertia).toString().padStart(4, '0')}</div>
        </div>
      </div>
      <div 
        ref={containerRef} 
        className="relative w-full h-[220px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-6 shadow-inner cursor-default"
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 400" preserveAspectRatio="none">
          {results.assignments.map(p => <line key={p.id} x1={p.x} y1={p.y} x2={activeCentroids[p.clusterIdx].x} y2={activeCentroids[p.clusterIdx].y} stroke={COLORS[p.clusterIdx]} strokeWidth="1" strokeDasharray="3,3" opacity="0.2" />)}
        </svg>
        {results.assignments.map(p => (
          <div 
            key={p.id} 
            className="absolute w-2 h-2 rotate-45 transition-colors duration-300" 
            style={{ 
              left: `${(p.x/500)*100}%`, 
              top: `${(p.y/400)*100}%`, 
              backgroundColor: COLORS[p.clusterIdx], 
              transform: 'translate(-50%, -50%) rotate(45deg)' 
            }} 
          />
        ))}
        {activeCentroids.map((c, i) => (
          <div 
            key={i} 
            onMouseDown={(e) => { 
              const move = (me: any) => handleDrag(me, i); 
              const up = () => { 
                window.removeEventListener('mousemove', move); 
                window.removeEventListener('mouseup', up); 
              }; 
              window.addEventListener('mousemove', move); 
              window.addEventListener('mouseup', up); 
            }} 
            className="absolute w-8 h-8 bg-white border-2 rounded-sm shadow-lg z-20 flex items-center justify-center cursor-move active:scale-110 transition-transform" 
            style={{ 
              left: `${(c.x/500)*100}%`, 
              top: `${(c.y/400)*100}%`, 
              borderColor: COLORS[i], 
              transform: 'translate(-50%, -50%)' 
            }}
          >
            <span className="font-mono text-[10px] font-bold" style={{ color: COLORS[i] }}>{i+1}</span>
          </div>
        ))}
      </div>
      <div className="w-full grid grid-cols-2 gap-8 items-start mb-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[8px] font-mono font-bold text-[#999] uppercase tracking-widest">Groups (K)</label>
            <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 rounded border border-black/5">{k} clusters</span>
          </div>
          <input type="range" min="2" max="5" step="1" value={k} onChange={(e) => { setK(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px appearance-none bg-black/10 accent-[#2A4D69]" />
        </div>
        <div className="bg-[#F9F8F6] p-4 border-l-2 border-black/5 text-[11px] italic font-serif leading-relaxed">"{analysis.desc}"</div>
      </div>
      <button onClick={onNext} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-4 font-bold uppercase tracking-widest text-[9px] transition-all shadow-lg ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>{nextLabel || 'Advance Manuscript'}</button>
    </div>
  );
};

export default ClusteringSim;
