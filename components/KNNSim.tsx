
import React, { useState, useMemo } from 'react';

const INITIAL_POINTS = [
  { x: 50, y: 50, type: 'A' }, { x: 80, y: 120, type: 'A' }, { x: 120, y: 70, type: 'A' },
  { x: 350, y: 300, type: 'B' }, { x: 420, y: 280, type: 'B' }, { x: 380, y: 350, type: 'B' },
  { x: 100, y: 300, type: 'A' }, { x: 300, y: 100, type: 'B' }
];

const KNNSim: React.FC = () => {
  const [testPoint, setTestPoint] = useState<{ x: number, y: number } | null>(null);
  const [k, setK] = useState(3);

  const getDist = (p1: { x: number, y: number }, p2: { x: number, y: number }) => 
    Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);

  const neighbors = useMemo(() => {
    if (!testPoint) return [];
    return [...INITIAL_POINTS]
      .sort((a, b) => getDist(a, testPoint) - getDist(b, testPoint))
      .slice(0, k);
  }, [testPoint, k]);

  const classification = useMemo(() => {
    if (neighbors.length === 0) return null;
    const counts = neighbors.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as any);
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }, [neighbors]);

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 select-none">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-gray-800 uppercase tracking-tight">K-Nearest Neighbors</h4>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-gray-400">K =</span>
          <input 
            type="number" min="1" max="7" value={k} 
            onChange={(e) => setK(parseInt(e.target.value) || 1)}
            className="w-12 border rounded px-1 text-center font-bold"
          />
        </div>
      </div>

      <div 
        className="relative w-full h-[350px] bg-slate-50 border-2 border-slate-100 rounded-2xl overflow-hidden cursor-crosshair"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setTestPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
      >
        {INITIAL_POINTS.map((p, i) => (
          <div 
            key={i} className={`absolute w-3 h-3 rounded-full border-2 border-white shadow-sm ${p.type === 'A' ? 'bg-teal-500' : 'bg-purple-500'}`}
            style={{ left: p.x, top: p.y, transform: 'translate(-50%, -50%)' }}
          />
        ))}

        {testPoint && (
          <>
            <div 
              className={`absolute w-5 h-5 rounded-full border-4 border-white shadow-lg z-20 transition-colors duration-500 ${classification === 'A' ? 'bg-teal-500' : 'bg-purple-500'}`}
              style={{ left: testPoint.x, top: testPoint.y, transform: 'translate(-50%, -50%)' }}
            />
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {neighbors.map((n, i) => (
                <line 
                  key={i} x1={testPoint.x} y1={testPoint.y} x2={n.x} y2={n.y} 
                  stroke={n.type === 'A' ? '#14b8a6' : '#8b5cf6'} 
                  strokeWidth="2" strokeDasharray="4" className="opacity-40"
                />
              ))}
            </svg>
          </>
        )}
      </div>
      <p className="mt-4 text-xs text-gray-500 text-center">Click the map to classify a new point.</p>
    </div>
  );
};

export default KNNSim;
