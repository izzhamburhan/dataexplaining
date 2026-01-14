
import React, { useState, useEffect } from 'react';

const KERNEL_PRESETS = {
  Identity: [
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0]
  ],
  Blur: [
    [0.1, 0.1, 0.1],
    [0.1, 0.2, 0.1],
    [0.1, 0.1, 0.1]
  ],
  'Edge Detect': [
    [-1, -1, -1],
    [-1, 8, -1],
    [-1, -1, -1]
  ],
  Sharpen: [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
  ]
};

const CNNSim: React.FC = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<keyof typeof KERNEL_PRESETS>('Edge Detect');

  useEffect(() => {
    let interval: any;
    if (isScanning) {
      interval = setInterval(() => {
        setPos(prev => {
          if (prev.x < 4) return { ...prev, x: prev.x + 1 };
          if (prev.y < 4) return { x: 0, y: prev.y + 1 };
          setIsScanning(false);
          return { x: 0, y: 0 };
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isScanning]);

  const kernel = KERNEL_PRESETS[selectedFilter];

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100">
      <h4 className="font-bold text-gray-800 uppercase mb-6 text-center">Interactive Convolution</h4>
      
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {(Object.keys(KERNEL_PRESETS) as Array<keyof typeof KERNEL_PRESETS>).map(f => (
          <button
            key={f}
            onClick={() => { setSelectedFilter(f); setPos({x:0, y:0}); setIsScanning(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedFilter === f ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-8 items-start">
        {/* Input Matrix */}
        <div className="relative">
          <span className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Input Image (7x7)</span>
          <div className="grid grid-cols-7 gap-1 p-1 bg-gray-100 rounded-lg shadow-inner">
            {Array.from({ length: 49 }).map((_, i) => {
              // Create a simple pattern for the image
              const row = Math.floor(i / 7);
              const col = i % 7;
              const isPattern = row > 1 && row < 5 && col > 1 && col < 5;
              return (
                <div key={i} className={`w-6 h-6 border border-gray-200 rounded-sm ${isPattern ? 'bg-gray-800' : 'bg-white'}`}></div>
              );
            })}
          </div>
          {/* Sliding Kernel with Values */}
          <div 
            className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10 rounded-md transition-all duration-200 pointer-events-none grid grid-cols-3 p-0.5"
            style={{ 
              left: pos.x * 28 + 4, 
              top: pos.y * 28 + 24,
              width: '84px',
              height: '84px'
            }}
          >
            {kernel.flat().map((val, i) => (
              <div key={i} className="flex items-center justify-center text-[8px] font-bold text-blue-700 leading-none">
                {val}
              </div>
            ))}
          </div>
        </div>

        {/* Feature Map */}
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Feature Map (5x5)</span>
          <div className="grid grid-cols-5 gap-1 p-1 bg-gray-100 rounded-lg shadow-inner">
            {Array.from({ length: 25 }).map((_, i) => {
              const idx = pos.y * 5 + pos.x;
              const isActive = isScanning && i <= idx;
              // Mock activation logic based on filter
              const isActivated = (i % 6 === 0) && selectedFilter !== 'Identity';
              return (
                <div 
                  key={i} 
                  className={`w-8 h-8 rounded-sm transition-all duration-300 border ${
                    isActive 
                      ? (isActivated ? 'bg-blue-600 border-blue-700 shadow-sm scale-110' : 'bg-blue-200 border-blue-300') 
                      : 'bg-white border-gray-200'
                  }`}
                ></div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <p className="text-xs text-blue-800 leading-relaxed text-center">
          <b>Kernel: {selectedFilter}</b><br/>
          As the 3x3 window slides, it performs element-wise multiplication. 
          {selectedFilter === 'Edge Detect' ? ' Note how it highlights areas where values change rapidly (the edges)!' : ' It transforms raw pixels into abstract features.'}
        </p>
      </div>

      <button 
        onClick={() => { setIsScanning(true); setPos({x:0, y:0}); }}
        disabled={isScanning}
        className="w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg active:scale-95 flex items-center justify-center"
      >
        {isScanning ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Scanning...
          </>
        ) : 'Run Convolution Scan'}
      </button>
    </div>
  );
};

export default CNNSim;
