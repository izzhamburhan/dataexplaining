
import React, { useState } from 'react';

const SVMSim: React.FC = () => {
  const [slope, setSlope] = useState(1);
  const [margin, setMargin] = useState(40);

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-gray-800 uppercase">Maximum Margin</h4>
        <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-1 rounded">SVC Model</span>
      </div>

      <div className="relative w-full h-[300px] bg-slate-50 border border-slate-100 rounded-xl overflow-hidden mb-6">
        {/* Support Vectors */}
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-teal-500 rounded-full border-2 border-white shadow-sm" />
        <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-purple-500 rounded-full border-2 border-white shadow-sm" />

        {/* Boundary Lines */}
        <svg className="absolute inset-0 w-full h-full">
          <line x1="0" y1={150 - slope * 150} x2="500" y2={150 + slope * 350} stroke="#3b82f6" strokeWidth="3" />
          <line x1="0" y1={150 - slope * 150 - margin} x2="500" y2={150 + slope * 350 - margin} stroke="#3b82f6" strokeWidth="1" strokeDasharray="4" className="opacity-40" />
          <line x1="0" y1={150 - slope * 150 + margin} x2="500" y2={150 + slope * 350 + margin} stroke="#3b82f6" strokeWidth="1" strokeDasharray="4" className="opacity-40" />
          {/* Shaded Margin Area */}
          <path d={`M0,${150 - slope * 150 - margin} L500,${150 + slope * 350 - margin} L500,${150 + slope * 350 + margin} L0,${150 - slope * 150 + margin} Z`} fill="rgba(59, 130, 246, 0.05)" />
        </svg>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Hyperplane Angle</label>
          <input type="range" min="-2" max="2" step="0.1" value={slope} onChange={(e) => setSlope(parseFloat(e.target.value))} className="w-full h-2 bg-blue-100 accent-blue-600 rounded-lg appearance-none cursor-pointer" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Margin Width</label>
          <input type="range" min="10" max="80" step="1" value={margin} onChange={(e) => setMargin(parseInt(e.target.value))} className="w-full h-2 bg-blue-100 accent-blue-600 rounded-lg appearance-none cursor-pointer" />
        </div>
      </div>
    </div>
  );
};

export default SVMSim;
