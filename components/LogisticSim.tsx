
import React, { useState } from 'react';

const LogisticSim: React.FC = () => {
  const [threshold, setThreshold] = useState(0.5);
  const [bias, setBias] = useState(0);

  const sigmoid = (x: number) => 1 / (1 + Math.exp(-x + bias));

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100">
      <h4 className="font-bold text-gray-800 uppercase mb-6 text-center">Logistic Probability</h4>
      
      <div className="relative w-full h-[300px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden mb-6">
        <svg className="absolute inset-0 w-full h-full" viewBox="-10 -0.1 20 1.2">
            {/* Grid Lines */}
            <line x1="-10" y1="0.5" x2="10" y2="0.5" stroke="#e2e8f0" strokeWidth="0.01" />
            
            {/* Sigmoid Curve */}
            <path
              d={Array.from({ length: 101 }).map((_, i) => {
                const x = (i / 5) - 10;
                const y = sigmoid(x);
                return `${i === 0 ? 'M' : 'L'} ${x} ${1 - y}`;
              }).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="0.1"
            />

            {/* Threshold Line */}
            <line x1="-10" y1={1 - threshold} x2="10" y2={1 - threshold} stroke="#ef4444" strokeWidth="0.02" strokeDasharray="0.1" />
        </svg>

        {/* Binary Classification Regions */}
        <div className="absolute inset-0 flex flex-col pointer-events-none">
            <div className="flex-grow flex items-center justify-center bg-blue-500 bg-opacity-5">
                <span className="text-[10px] font-black uppercase text-blue-600 opacity-20">Class: Positive</span>
            </div>
            <div className="flex-grow flex items-center justify-center bg-red-500 bg-opacity-5">
                 <span className="text-[10px] font-black uppercase text-red-600 opacity-20">Class: Negative</span>
            </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Decision Threshold: {threshold.toFixed(2)}</label>
          <input type="range" min="0" max="1" step="0.01" value={threshold} onChange={(e) => setThreshold(parseFloat(e.target.value))} className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-red-500" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Bias Shift: {bias.toFixed(1)}</label>
          <input type="range" min="-10" max="10" step="0.5" value={bias} onChange={(e) => setBias(parseFloat(e.target.value))} className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
        </div>
      </div>
    </div>
  );
};

export default LogisticSim;
