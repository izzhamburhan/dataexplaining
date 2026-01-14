
import React, { useState, useEffect } from 'react';

const GradientDescentSim: React.FC = () => {
  const [point, setPoint] = useState(8);
  const [lr, setLr] = useState(0.1);
  const [history, setHistory] = useState<number[]>([]);

  const takeStep = () => {
    // f(x) = x^2, f'(x) = 2x
    const gradient = 2 * point;
    const nextPoint = point - lr * gradient;
    setHistory([...history, point]);
    setPoint(nextPoint);
  };

  const reset = () => {
    setPoint(Math.random() > 0.5 ? 8 : -8);
    setHistory([]);
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-gray-800 uppercase">Gradient Descent</h4>
        <button onClick={reset} className="text-xs text-blue-600 font-bold hover:underline">Reset</button>
      </div>

      <div className="relative w-full h-[300px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden mb-6">
        {/* The Parabola */}
        <svg className="absolute inset-0 w-full h-full" viewBox="-10 -2 20 120">
          <path
            d={Array.from({ length: 101 }).map((_, i) => {
              const x = (i / 5) - 10;
              const y = x * x;
              return `${i === 0 ? 'M' : 'L'} ${x} ${100 - y}`;
            }).join(' ')}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1"
          />
          
          {/* History Path */}
          {history.length > 0 && (
            <path
              d={history.concat(point).map((p, i) => {
                const y = p * p;
                return `${i === 0 ? 'M' : 'L'} ${p} ${100 - y}`;
              }).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeDasharray="2"
            />
          )}

          {/* Current Point */}
          <circle cx={point} cy={100 - point * point} r="2" fill="#3b82f6" stroke="white" strokeWidth="0.5" />
        </svg>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
            <p className="text-[10px] font-black uppercase text-gray-400">Current Cost</p>
            <p className="text-xl font-black text-blue-600">{(point * point).toFixed(2)}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Learning Rate (α): {lr}</label>
          </div>
          <input 
            type="range" min="0.01" max="1.1" step="0.01" value={lr} 
            onChange={(e) => setLr(parseFloat(e.target.value))}
            className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-bold">
            <span>Slow & Precise</span>
            <span className="text-red-400">DANGEROUS / OVERSHOOT</span>
          </div>
        </div>

        <button 
          onClick={takeStep}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95"
        >
          Step Down Slope
        </button>
      </div>
    </div>
  );
};

export default GradientDescentSim;
