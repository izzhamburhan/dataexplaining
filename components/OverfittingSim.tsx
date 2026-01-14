
import React, { useState, useMemo } from 'react';

const TRUE_POINTS = Array.from({ length: 40 }, (_, i) => {
  const x = (i / 39) * 10;
  const y = Math.sin(x) * 100 + 200;
  return { x, y };
});

const TRAIN_POINTS = TRUE_POINTS.map(p => ({
  x: p.x,
  y: p.y + (Math.random() - 0.5) * 70 
})).filter((_, i) => i % 2 === 0);

const TEST_POINTS = TRUE_POINTS.map(p => ({
  x: p.x,
  y: p.y + (Math.random() - 0.5) * 70 
})).filter((_, i) => i % 2 !== 0);

const OverfittingSim: React.FC = () => {
  const [complexity, setComplexity] = useState(1);

  const modelPath = useMemo(() => {
    const points = [];
    for (let x = 0; x <= 10; x += 0.2) {
      let y = Math.sin(x) * 100 + 200;
      if (complexity === 1) {
        y = 200 - (x - 5) * 15; // Simple linear
      } else if (complexity > 5) {
        // High complexity - wiggle more near training points
        const wiggle = Math.sin(x * complexity * 0.8) * (complexity * 8);
        y += wiggle;
      }
      points.push(`${(x / 10) * 100}% ${y / 4}%`);
    }
    return points.join(', ');
  }, [complexity]);

  const trainError = Math.max(2, 45 - complexity * 4.5);
  const testError = complexity <= 5 ? 38 - complexity * 5 : 13 + (complexity - 5) * 10;

  const getStatus = () => {
    if (complexity < 3) return { text: "Underfitting", color: "text-amber-600", bg: "bg-amber-50" };
    if (complexity <= 5) return { text: "Sweet Spot", color: "text-emerald-600", bg: "bg-emerald-50" };
    return { text: "Overfitting Zone", color: "text-rose-600", bg: "bg-rose-50" };
  };

  const status = getStatus();

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="font-bold text-gray-800 uppercase tracking-tight">The Overfitting Curve</h4>
          <p className="text-[10px] font-black text-gray-400 uppercase mt-0.5">Model Generalization</p>
        </div>
        <div className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase shadow-sm border ${status.bg} ${status.color} border-current`}>
          {status.text}
        </div>
      </div>

      <div className="relative w-full h-[320px] bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden mb-8 shadow-inner">
        {/* Pattern Background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* The model's prediction line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <polyline
            points={modelPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="4"
            className="transition-all duration-300"
            strokeLinecap="round"
          />
        </svg>

        {/* Training Points */}
        {TRAIN_POINTS.map((p, i) => (
          <div
            key={`train-${i}`}
            className="absolute w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white shadow-sm z-10"
            style={{ left: `${(p.x / 10) * 100}%`, top: `${p.y / 4}%`, transform: 'translate(-50%, -50%)' }}
            title="Training Point"
          />
        ))}

        {/* Test Points */}
        {TEST_POINTS.map((p, i) => (
          <div
            key={`test-${i}`}
            className="absolute w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white shadow-sm opacity-50 z-5"
            style={{ left: `${(p.x / 10) * 100}%`, top: `${p.y / 4}%`, transform: 'translate(-50%, -50%)' }}
            title="Validation Point"
          />
        ))}
      </div>

      <div className="space-y-8">
        <div>
          <div className="flex justify-between mb-3 items-end">
            <label className="text-sm font-bold text-gray-700">Model Capacity (Complexity)</label>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-black tabular-nums">Degree {complexity}</span>
          </div>
          <input
            type="range" min="1" max="15" step="1" value={complexity}
            onChange={(e) => setComplexity(parseInt(e.target.value))}
            className="w-full h-3 bg-blue-100 rounded-xl appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="p-4 rounded-2xl border-2 border-blue-50 bg-blue-50 flex flex-col items-center">
            <span className="text-[10px] uppercase font-black text-blue-400 mb-1">Training Loss</span>
            <div className="flex items-end space-x-2">
               <span className="text-3xl font-black text-blue-700 tabular-nums">{trainError.toFixed(1)}</span>
               <span className="text-xs text-blue-400 font-bold mb-1.5">%</span>
            </div>
            <div className="w-full h-1 bg-blue-200 rounded-full mt-3 overflow-hidden">
               <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${trainError}%` }}></div>
            </div>
          </div>
          <div className="p-4 rounded-2xl border-2 border-emerald-50 bg-emerald-50 flex flex-col items-center">
            <span className="text-[10px] uppercase font-black text-emerald-400 mb-1">Validation Loss</span>
            <div className="flex items-end space-x-2">
               <span className={`text-3xl font-black tabular-nums ${complexity > 5 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {testError.toFixed(1)}
               </span>
               <span className={`text-xs font-bold mb-1.5 ${complexity > 5 ? 'text-rose-400' : 'text-emerald-400'}`}>%</span>
            </div>
            <div className="w-full h-1 bg-emerald-200 rounded-full mt-3 overflow-hidden">
               <div className={`h-full transition-all duration-500 ${complexity > 5 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${testError}%` }}></div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed text-center px-4 italic">
          {complexity <= 2 && "The model is too simple (High Bias). It fails to learn the basic trend."}
          {complexity > 2 && complexity <= 5 && "The model has learned the trend perfectly without chasing random noise. Great generalization!"}
          {complexity > 5 && "Warning! The model is chasing outliers. Notice how training loss goes down but validation loss explodes!"}
        </p>
      </div>
    </div>
  );
};

export default OverfittingSim;
