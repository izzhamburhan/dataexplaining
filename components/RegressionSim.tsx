
import React, { useState, useMemo } from 'react';

const DATA_POINTS = [
  { x: 50, y: 350 }, { x: 100, y: 320 }, { x: 150, y: 280 },
  { x: 200, y: 250 }, { x: 250, y: 200 }, { x: 300, y: 150 },
  { x: 350, y: 120 }, { x: 400, y: 80 }
];

interface Props {
  showError?: boolean;
}

const RegressionSim: React.FC<Props> = ({ showError = false }) => {
  const [slope, setSlope] = useState(-0.5);
  const [intercept, setIntercept] = useState(380);

  const errorDetails = useMemo(() => {
    let totalSqError = 0;
    const residuals = DATA_POINTS.map(p => {
      const predictedY = slope * p.x + intercept;
      const residual = p.y - predictedY;
      totalSqError += Math.pow(residual, 2);
      return { ...p, predictedY, residual };
    });
    return { residuals, mse: totalSqError / DATA_POINTS.length };
  }, [slope, intercept]);

  return (
    <div className="w-full flex flex-col items-center bg-white p-4">
      <div className="relative w-full aspect-video bg-[#FDFCFB] border border-black/10 overflow-hidden">
        {/* Technical Grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 400" preserveAspectRatio="none">
          {showError && errorDetails.residuals.map((r, i) => {
            const size = Math.abs(r.residual);
            const top = r.residual > 0 ? r.predictedY : r.y;
            return (
              <rect
                key={i}
                x={r.x}
                y={top}
                width={size}
                height={size}
                fill="#2A4D69"
                className="opacity-5"
                stroke="#2A4D69"
                strokeWidth="0.5"
                strokeDasharray="1,1"
              />
            );
          })}
          
          {/* Main Regression Line */}
          <line
            x1="0"
            y1={intercept}
            x2="500"
            y2={slope * 500 + intercept}
            stroke="#121212"
            strokeWidth="1.5"
          />

          {/* Residual Vertical Lines */}
          {showError && errorDetails.residuals.map((r, i) => (
            <line
              key={`line-${i}`}
              x1={r.x}
              y1={r.y}
              x2={r.x}
              y2={r.predictedY}
              stroke="#2A4D69"
              strokeWidth="0.8"
              strokeDasharray="2,2"
              className="opacity-40"
            />
          ))}
        </svg>

        {/* Data Points */}
        {DATA_POINTS.map((p, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-[#121212] rotate-45 z-10"
            style={{ left: `${(p.x / 500) * 100}%`, top: `${(p.y / 400) * 100}%`, transform: 'translate(-50%, -50%) rotate(45deg)' }}
          />
        ))}
        
        {/* Axes Indicators */}
        <div className="absolute bottom-2 right-2 font-mono text-[8px] text-[#999] uppercase tracking-widest">Dimension: X | Y</div>
      </div>

      <div className="mt-12 w-full max-w-xl grid grid-cols-2 gap-16">
        <div className="space-y-4">
          <div className="flex justify-between font-mono text-[10px] font-bold uppercase tracking-widest text-[#999]">
            <span>Coefficient (θ1)</span>
            <span className="text-[#121212]">{slope.toFixed(2)}</span>
          </div>
          <input
            type="range" min="-2" max="1" step="0.01"
            value={slope}
            onChange={(e) => setSlope(parseFloat(e.target.value))}
            className="w-full h-px bg-black/10 rounded-full appearance-none cursor-pointer accent-[#2A4D69]"
          />
        </div>
        <div className="space-y-4">
          <div className="flex justify-between font-mono text-[10px] font-bold uppercase tracking-widest text-[#999]">
            <span>Intercept (θ0)</span>
            <span className="text-[#121212]">{intercept.toFixed(0)}</span>
          </div>
          <input
            type="range" min="0" max="500" step="1"
            value={intercept}
            onChange={(e) => setIntercept(parseFloat(e.target.value))}
            className="w-full h-px bg-black/10 rounded-full appearance-none cursor-pointer accent-[#2A4D69]"
          />
        </div>
      </div>

      {showError && (
        <div className="mt-16 flex flex-col items-center border-t border-black/5 pt-8 w-full">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.4em] text-[#CCC] mb-2">Empirical Variance (MSE)</span>
          <span className="text-5xl font-serif italic text-[#121212] tabular-nums">
            {Math.round(errorDetails.mse).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default RegressionSim;
