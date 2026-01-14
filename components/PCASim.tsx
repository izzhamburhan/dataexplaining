
import React, { useState, useMemo } from 'react';

const PCASim: React.FC = () => {
  const [angle, setAngle] = useState(0);

  // Elongated cluster to make PCA more intuitive
  const points = useMemo(() => [
    { x: 100, y: 150 }, { x: 130, y: 160 }, { x: 160, y: 190 },
    { x: 190, y: 220 }, { x: 220, y: 230 }, { x: 250, y: 270 },
    { x: 280, y: 290 }, { x: 310, y: 320 }, { x: 340, y: 330 },
    { x: 180, y: 200 }, { x: 240, y: 260 }
  ], []);

  const centerX = 225;
  const centerY = 240;
  const rad = angle * (Math.PI / 180);

  const varianceData = useMemo(() => {
    let sumSqDist = 0;
    const projected = points.map(p => {
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      // Projection of vector (dx, dy) onto unit vector (cos(rad), sin(rad))
      const dot = dx * Math.cos(rad) + dy * Math.sin(rad);
      sumSqDist += dot * dot;
      return { 
        ...p, 
        dot,
        projX: centerX + dot * Math.cos(rad),
        projY: centerY + dot * Math.sin(rad)
      };
    });
    // Normalized variance for display
    const variance = (sumSqDist / points.length) / 50; 
    return { projected, variance };
  }, [angle, points]);

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-gray-800 uppercase tracking-tight">Principal Components</h4>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-blue-600 uppercase">Captured Variance</span>
          <span className="text-xl font-black text-gray-900 tabular-nums">{(varianceData.variance * 10).toFixed(1)}%</span>
        </div>
      </div>
      
      <div className="relative w-full h-[380px] bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden mb-8 shadow-inner">
        {/* Points */}
        {points.map((p, i) => (
          <div 
            key={i} 
            className="absolute w-2.5 h-2.5 bg-gray-300 rounded-full border border-white z-0" 
            style={{ left: p.x, top: p.y, transform: 'translate(-50%, -50%)' }} 
          />
        ))}

        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Principal Axis Line */}
          <line 
            x1={centerX - Math.cos(rad) * 250} y1={centerY - Math.sin(rad) * 250}
            x2={centerX + Math.cos(rad) * 250} y2={centerY + Math.sin(rad) * 250}
            stroke="#3b82f6" strokeWidth="3" strokeLinecap="round"
          />
          
          {/* Projection Lines */}
          {varianceData.projected.map((p, i) => (
            <React.Fragment key={i}>
              <line 
                x1={p.x} y1={p.y} x2={p.projX} y2={p.projY} 
                stroke="#3b82f6" strokeWidth="1" strokeDasharray="3,3" className="opacity-40" 
              />
              <circle cx={p.projX} cy={p.projY} r="3.5" fill="#3b82f6" className="shadow-sm" />
            </React.Fragment>
          ))}
        </svg>

        {/* Orthogonal axis indicator */}
        <div 
          className="absolute w-20 h-px bg-gray-200 opacity-50 transition-transform duration-300 pointer-events-none"
          style={{ 
            left: centerX - 40, top: centerY, 
            transform: `rotate(${angle + 90}deg)` 
          }}
        />
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Rotate Projection Axis</label>
            <span className="text-xs font-black text-blue-600">{angle}°</span>
          </div>
          <input 
            type="range" min="0" max="360" value={angle} 
            onChange={(e) => setAngle(parseInt(e.target.value))} 
            className="w-full h-2.5 bg-blue-100 accent-blue-600 rounded-lg appearance-none cursor-pointer" 
          />
        </div>

        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
          <p className="text-xs text-indigo-800 leading-relaxed italic">
            <b>PCA Goal:</b> Find the axis where the data is most "spread out". When the spread is widest, that axis captures the most information about your data!
          </p>
        </div>
      </div>
    </div>
  );
};

export default PCASim;
