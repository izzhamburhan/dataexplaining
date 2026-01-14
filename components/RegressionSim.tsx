
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
    <div className="flex flex-col items-center bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100">
      <div className="relative w-full h-[400px] border-l-2 border-b-2 border-gray-300 bg-gray-50 overflow-hidden rounded-lg">
        {/* Grid Lines */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          {Array.from({ length: 10 }).map((_, i) => (
            <React.Fragment key={i}>
              <div className="absolute w-full h-px bg-black" style={{ top: `${i * 10}%` }} />
              <div className="absolute h-full w-px bg-black" style={{ left: `${i * 10}%` }} />
            </React.Fragment>
          ))}
        </div>

        {/* Visualizing the "Squares" in Mean Squared Error */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
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
                fill="rgba(239, 68, 68, 0.15)"
                stroke="rgba(239, 68, 68, 0.4)"
                strokeWidth="1"
              />
            );
          })}
          
          {/* Regression Line */}
          <line
            x1="0"
            y1={intercept}
            x2="500"
            y2={slope * 500 + intercept}
            stroke="#3b82f6"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Residual Lines */}
          {showError && errorDetails.residuals.map((r, i) => (
            <line
              key={`line-${i}`}
              x1={r.x}
              y1={r.y}
              x2={r.x}
              y2={r.predictedY}
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="4"
            />
          ))}
        </svg>

        {/* Points */}
        {DATA_POINTS.map((p, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 bg-gray-900 rounded-full border-2 border-white shadow-sm z-10"
            style={{ left: p.x - 8, top: p.y - 8 }}
          />
        ))}
      </div>

      <div className="mt-8 w-full space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Slope (m)</label>
            <input
              type="range" min="-2" max="1" step="0.01"
              value={slope}
              onChange={(e) => setSlope(parseFloat(e.target.value))}
              className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="text-center font-mono text-sm mt-1">{slope.toFixed(2)}</div>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Intercept (b)</label>
            <input
              type="range" min="0" max="500" step="1"
              value={intercept}
              onChange={(e) => setIntercept(parseFloat(e.target.value))}
              className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
             <div className="text-center font-mono text-sm mt-1">{intercept.toFixed(0)}</div>
          </div>
        </div>

        {showError && (
          <div className="bg-red-50 border-2 border-red-100 p-4 rounded-xl text-center transform transition-all animate-in zoom-in-95">
            <span className="text-[10px] uppercase font-black text-red-400 block mb-1">Current Mean Squared Error</span>
            <span className="text-3xl font-black text-red-600 tabular-nums">
              {Math.round(errorDetails.mse).toLocaleString()}
            </span>
            <p className="text-xs text-red-500 mt-2 font-medium">
              Goal: Minimize the total area of the red squares!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegressionSim;
