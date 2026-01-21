
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

const POINTS = Array.from({ length: 45 }, (_, i) => ({ id: i, x: Math.random() * 700 + 50, y: Math.random() * 450 + 50 }));
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
  { message: "K-Means groups data points by their proximity to 'Centroids'.", position: "top-[20%] left-[10%]" },
  { message: "Drag the centroids manually. The dotted lines show which point belongs to which group.", position: "top-[40%] left-[40%]" },
  { message: "Lower 'Inertia' means your centroids are perfectly centered within their clusters.", position: "bottom-[15%] left-[20%]" }
];

const ClusteringSim: React.FC<Props> = ({ currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [k, setK] = useState(3);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [centroids, setCentroids] = useState(() => Array.from({ length: 5 }, (_, i) => ({ x: 150 + i * 150, y: 250 + (i % 2) * 150 })));
  const [activeTourIndex, setActiveTourIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (isTourActive) setActiveTourIndex(0); }, [isTourActive]);
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
    return { label: avg < 80 ? 'Coherent Clusters' : 'Dispersed Points', color: avg < 80 ? 'text-emerald-600' : 'text-amber-600', desc: avg < 80 ? 'Clear internal group coherence found. The structure is stable.' : 'The centroids are far from their data points. Reposition them to achieve spatial balance.' };
  }, [results.inertia]);

  const handleDrag = (e: MouseEvent | TouchEvent, idx: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    
    const relX = (cx - rect.left) / rect.width;
    const relY = (cy - rect.top) / rect.height;

    const viewX = relX * 800;
    const viewY = relY * 560;

    setCentroids(prev => { 
      const next = [...prev]; 
      next[idx] = { 
        x: Math.max(10, Math.min(viewX, 790)), 
        y: Math.max(10, Math.min(viewY, 550)) 
      }; 
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
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Total System Inertia</div>
          <div className="text-2xl font-mono font-bold tabular-nums text-[#121212]">{Math.round(results.inertia).toString().padStart(5, '0')}</div>
        </div>
      </div>
      <div 
        ref={containerRef} 
        className="relative w-full h-[400px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-inner cursor-default"
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 560" preserveAspectRatio="none">
           <g stroke="#F0F0F0" strokeWidth="1">
            {Array.from({ length: 17 }).map((_, i) => (
              <React.Fragment key={i}>
                <line x1={i * 50} y1="0" x2={i * 50} y2="560" />
                <line x1="0" y1={i * 35} x2="800" y2={i * 35} />
              </React.Fragment>
            ))}
          </g>
          {results.assignments.map(p => <line key={p.id} x1={p.x} y1={p.y} x2={activeCentroids[p.clusterIdx].x} y2={activeCentroids[p.clusterIdx].y} stroke={COLORS[p.clusterIdx]} strokeWidth="1" strokeDasharray="5,5" opacity="0.3" />)}
        </svg>
        {results.assignments.map(p => (
          <div 
            key={p.id} 
            className="absolute w-3 h-3 rotate-45 transition-colors duration-500 shadow-sm" 
            style={{ 
              left: `${(p.x/800)*100}%`, 
              top: `${(p.y/560)*100}%`, 
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
            className="absolute w-12 h-12 bg-white border-4 rounded-sm shadow-2xl z-20 flex items-center justify-center cursor-move active:scale-125 transition-transform" 
            style={{ 
              left: `${(c.x/800)*100}%`, 
              top: `${(c.y/560)*100}%`, 
              borderColor: COLORS[i], 
              transform: 'translate(-50%, -50%)' 
            }}
          >
            <span className="font-mono text-xs font-bold" style={{ color: COLORS[i] }}>#{i+1}</span>
          </div>
        ))}
      </div>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-8">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Target Groups (K)</label>
            <span className="text-[11px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-3 py-1 rounded border border-black/5 shadow-sm">{k} Clusters</span>
          </div>
          <input type="range" min="2" max="5" step="1" value={k} onChange={(e) => { setK(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-1 appearance-none bg-black/10 accent-[#2A4D69] cursor-pointer" />
        </div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5 min-h-[140px] flex items-center">
          <p className="text-sm text-[#444] italic font-serif leading-relaxed">"{analysis.desc}"</p>
        </div>
      </div>
      <button onClick={onNext} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-5 font-bold uppercase tracking-[0.3em] text-xs transition-all shadow-xl ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>Advance Manuscript</button>
    </div>
  );
};

export default ClusteringSim;
