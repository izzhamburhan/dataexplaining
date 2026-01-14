
import React, { useState, useRef, useMemo } from 'react';

const POINTS = Array.from({ length: 45 }, (_, i) => ({
  id: i,
  x: Math.random() * 380 + 60,
  y: Math.random() * 280 + 60
}));

const COLORS = ['#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6'];

const ClusteringSim: React.FC = () => {
  const [k, setK] = useState(3);
  const [centroids, setCentroids] = useState(() => 
    Array.from({ length: 5 }, (_, i) => ({
      x: 100 + i * 80,
      y: 100 + (i % 2) * 150
    }))
  );
  
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleDrag = (e: React.MouseEvent | React.TouchEvent, idx: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY) - rect.top;
    
    const boundedX = Math.max(20, Math.min(x, rect.width - 20));
    const boundedY = Math.max(20, Math.min(y, rect.height - 20));

    setCentroids(prev => {
      const next = [...prev];
      next[idx] = { x: boundedX, y: boundedY };
      return next;
    });
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100 select-none">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="font-bold text-gray-800 uppercase tracking-tight">K-Means Parameters</h4>
          <div className="flex items-center space-x-2 mt-1">
             <span className="text-[10px] font-black text-gray-400 uppercase">Centroids (K):</span>
             <span className="text-sm font-black text-blue-600">{k}</span>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-center">
          <span className="text-[10px] font-black text-slate-400 block uppercase mb-1">Total Inertia</span>
          <span className="text-lg font-black text-slate-700 tabular-nums">
            {Math.round(results.inertia).toLocaleString()}
          </span>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative w-full h-[380px] bg-slate-50 border-2 border-slate-200 rounded-3xl overflow-hidden shadow-inner mb-6"
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {results.assignments.map((p) => (
            <line 
              key={`line-${p.id}`}
              x1={p.x} y1={p.y} 
              x2={activeCentroids[p.clusterIdx].x} 
              y2={activeCentroids[p.clusterIdx].y} 
              stroke={COLORS[p.clusterIdx]}
              strokeWidth="1"
              strokeDasharray="2,4"
              className="opacity-15 transition-all duration-300"
            />
          ))}
        </svg>

        {results.assignments.map((p) => (
          <div 
            key={p.id}
            className="absolute w-3 h-3 rounded-full transition-all duration-500 border border-white shadow-sm z-10"
            style={{ 
              left: p.x, top: p.y, transform: 'translate(-50%, -50%)',
              backgroundColor: COLORS[p.clusterIdx] 
            }}
          />
        ))}

        {activeCentroids.map((c, i) => (
          <div 
            key={`centroid-${i}`}
            onMouseDown={(e) => {
              const move = (me: MouseEvent) => handleDrag(me as any, i);
              const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
              window.addEventListener('mousemove', move);
              window.addEventListener('mouseup', up);
            }}
            className="absolute w-12 h-12 bg-white border-[4px] rounded-2xl shadow-xl z-20 flex items-center justify-center cursor-move transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 active:scale-95 transition-all"
            style={{ left: c.x, top: c.y, borderColor: COLORS[i] }}
          >
            <div className="w-1.5 h-4 rounded-full absolute" style={{ backgroundColor: COLORS[i] }} />
            <div className="w-4 h-1.5 rounded-full absolute" style={{ backgroundColor: COLORS[i] }} />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Adjust Number of Clusters (K)</label>
          <input 
            type="range" min="2" max="5" value={k} 
            onChange={(e) => setK(parseInt(e.target.value))} 
            className="w-full h-2.5 bg-blue-100 accent-blue-600 rounded-lg appearance-none cursor-pointer" 
          />
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          {activeCentroids.map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
              <span className="text-[10px] font-bold text-gray-500 uppercase">Cluster {i+1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClusteringSim;
