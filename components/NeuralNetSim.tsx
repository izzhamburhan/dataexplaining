
import React, { useState } from 'react';

const NeuralNetSim: React.FC = () => {
  const [w1, setW1] = useState(0.8);
  const [w2, setW2] = useState(0.4);

  const activation = Math.max(0, (1.0 * w1 + 0.5 * w2)); // Simplified ReLU

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100">
      <h4 className="font-bold text-gray-800 uppercase text-center mb-8">Neural Perceptron</h4>
      
      <div className="flex justify-between items-center h-48 relative px-10">
        <div className="flex flex-col justify-around h-full">
          <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center font-bold text-slate-600 shadow-sm">1.0</div>
          <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center font-bold text-slate-600 shadow-sm">0.5</div>
        </div>

        <svg className="absolute inset-0 w-full h-full pointer-events-none px-10">
          <line x1="48" y1="48" x2="300" y2="100" stroke="#3b82f6" strokeWidth={w1 * 8} className="opacity-40" />
          <line x1="48" y1="144" x2="300" y2="100" stroke="#3b82f6" strokeWidth={w2 * 8} className="opacity-40" />
        </svg>

        <div className="flex flex-col items-center">
           <div 
            className="w-16 h-16 rounded-full border-4 border-blue-600 flex items-center justify-center transition-all duration-500"
            style={{ backgroundColor: `rgba(37, 99, 235, ${activation})`, transform: `scale(${0.8 + activation * 0.4})` }}
           >
            <span className="font-black text-white">{activation.toFixed(1)}</span>
           </div>
           <span className="text-[10px] font-bold text-blue-600 mt-2 uppercase">Output Activation</span>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Weight 1: {w1.toFixed(1)}</label>
          <input type="range" min="0" max="1" step="0.1" value={w1} onChange={(e) => setW1(parseFloat(e.target.value))} className="w-full h-2 bg-blue-100 accent-blue-600 rounded-lg appearance-none cursor-pointer" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Weight 2: {w2.toFixed(1)}</label>
          <input type="range" min="0" max="1" step="0.1" value={w2} onChange={(e) => setW2(parseFloat(e.target.value))} className="w-full h-2 bg-blue-100 accent-blue-600 rounded-lg appearance-none cursor-pointer" />
        </div>
      </div>
    </div>
  );
};

export default NeuralNetSim;
