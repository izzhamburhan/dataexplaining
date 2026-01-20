import React, { useState, useEffect, useMemo } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

const KERNEL_PRESETS = { 
  Identity: [[0,0,0],[0,1,0],[0,0,0]], 
  Blur: [[0.1,0.1,0.1],[0.1,0.2,0.1],[0.1,0.1,0.1]], 
  'Edge Detect': [[-1,-1,-1],[-1,8,-1],[-1,-1,-1]], 
  Sharpen: [[0,-1,0],[-1,5,-1],[0,-1,0]] 
};

// 7x7 input image simulation representing a simple "O" or square shape
const INPUT_IMAGE = [
  [0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 1, 0, 0, 0, 1, 0],
  [0, 1, 0, 1, 0, 1, 0],
  [0, 1, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0],
];

interface Props {
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isTourActive?: boolean;
  onTourClose?: () => void;
}

const TOUR_STEPS = [
  { message: "CNNs use 'Filters' to scan images. Each filter highlights specific features like edges or textures.", position: "top-[20%] left-[30%]" },
  { message: "The yellow 3x3 box is our 'Kernel'. Watch it convolve across the input image to extract spatial patterns.", position: "top-[40%] left-[45%]" },
  { message: "The result is a 'Feature Map'. High numerical values indicate that the filter successfully found its target pattern.", position: "top-[15%] right-[15%]" }
];

const CNNSim: React.FC<Props> = ({ currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<keyof typeof KERNEL_PRESETS>('Edge Detect');
  const [featureMap, setFeatureMap] = useState<number[][]>(Array.from({ length: 5 }, () => Array(5).fill(0)));
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);

  useEffect(() => {
    if (isTourActive) setActiveTourIndex(0);
  }, [isTourActive]);

  useEffect(() => {
    setHasActuallyInteracted(currentStep === 0);
  }, [currentStep]);

  const markInteraction = () => {
    if (!hasActuallyInteracted) {
      setHasActuallyInteracted(true);
      onInteract?.();
    }
  };

  const calculateConvolutionStep = (x: number, y: number, kernel: number[][]) => {
    let sum = 0;
    for (let ky = 0; ky < 3; ky++) {
      for (let kx = 0; kx < 3; kx++) {
        sum += INPUT_IMAGE[y + ky][x + kx] * kernel[ky][kx];
      }
    }
    return sum;
  };

  useEffect(() => {
    let interval: any;
    if (isScanning) {
      interval = setInterval(() => {
        setPos(prev => {
          const kernel = KERNEL_PRESETS[selectedFilter];
          const newVal = calculateConvolutionStep(prev.x, prev.y, kernel);
          
          setFeatureMap(map => {
            const nextMap = map.map(row => [...row]);
            nextMap[prev.y][prev.x] = newVal;
            return nextMap;
          });

          if (prev.x < 4) return { ...prev, x: prev.x + 1 };
          if (prev.y < 4) return { x: 0, y: prev.y + 1 };
          
          setIsScanning(false); 
          markInteraction(); 
          audioService.play('success');
          return prev;
        });
      }, 120);
    }
    return () => clearInterval(interval);
  }, [isScanning, selectedFilter]);

  const analysis = useMemo(() => {
    if (!hasActuallyInteracted && !isScanning) return { label: 'Filter Selection', color: 'text-slate-300', desc: 'Choose a kernel protocol and run the scan to observe mathematical feature extraction.' };
    return { label: 'Convolved Signal', color: 'text-emerald-600', desc: 'The sliding window has extracted spatial patterns. Notice how the Edge filter illuminates high-contrast pixel boundaries.' };
  }, [hasActuallyInteracted, isScanning]);

  const handleTourNext = () => {
    audioService.play('click');
    if (activeTourIndex < TOUR_STEPS.length - 1) setActiveTourIndex(prev => prev + 1);
    else onTourClose?.();
  };

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative">
      {isTourActive && (
        <GuidanceTooltip message={TOUR_STEPS[activeTourIndex].message} position={TOUR_STEPS[activeTourIndex].position} onNext={handleTourNext} onClose={() => onTourClose?.()} isLast={activeTourIndex === TOUR_STEPS.length - 1} />
      )}
      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic transition-colors duration-500 ${analysis.color}`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Kernel Mode</div>
          <div className="text-2xl font-mono font-bold">{selectedFilter}</div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-12 p-12 bg-[#FDFCFB] border border-black/5">
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-mono text-[#AAA] uppercase tracking-widest mb-6">Input Matrix (7x7)</span>
          <div className="relative grid grid-cols-7 gap-1 p-2 bg-white shadow-sm border border-black/5">
            {INPUT_IMAGE.map((row, y) => row.map((cell, x) => (
              <div key={`${x}-${y}`} className={`w-7 h-7 border border-black/[0.03] ${cell === 1 ? 'bg-[#121212]' : 'bg-white'}`} />
            )))}
            {/* 3x3 Sliding Window Highlight */}
            <div 
              className="absolute border-2 border-[#D4A017] bg-[#D4A017]/10 transition-all duration-150 pointer-events-none" 
              style={{ 
                width: 'calc((28px + 4px) * 3 + 4px)', 
                height: 'calc((28px + 4px) * 3 + 4px)', 
                left: `calc(${pos.x} * (28px + 4px) + 8px)`, 
                top: `calc(${pos.y} * (28px + 4px) + 8px)` 
              }} 
            />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[9px] font-mono text-[#AAA] uppercase tracking-widest mb-6">Feature Map (5x5)</span>
          <div className="grid grid-cols-5 gap-1 p-2 bg-white shadow-sm border border-black/5">
            {featureMap.map((row, y) => row.map((val, x) => {
              const isActive = (y < pos.y || (y === pos.y && x <= pos.x)) && (isScanning || hasActuallyInteracted);
              const brightness = Math.min(1, Math.max(0, Math.abs(val) / 8));
              return (
                <div key={`${x}-${y}`} className="w-10 h-10 border border-black/[0.03] flex items-center justify-center transition-all duration-300" style={{ backgroundColor: isActive ? `rgba(42, 77, 105, ${0.1 + brightness * 0.9})` : 'transparent' }}>
                  {isActive && <span className="text-[8px] font-mono text-white">{Math.round(val)}</span>}
                </div>
              );
            }))}
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(KERNEL_PRESETS) as Array<keyof typeof KERNEL_PRESETS>).map(f => (
              <button 
                key={f} 
                onClick={() => { setSelectedFilter(f); setPos({x:0,y:0}); setIsScanning(false); setFeatureMap(Array.from({ length: 5 }, () => Array(5).fill(0))); audioService.play('click'); }} 
                className={`py-3 text-[10px] font-bold uppercase tracking-widest border transition-all ${selectedFilter === f ? 'bg-[#121212] text-white' : 'border-black/5 text-[#999] hover:border-black/10'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => { setIsScanning(true); audioService.play('blip'); }} disabled={isScanning} className="w-full py-5 text-[10px] font-bold uppercase tracking-[0.3em] bg-[#121212] text-white hover:bg-[#2A4D69] disabled:opacity-50 transition-all shadow-lg">
            {isScanning ? 'Convolving...' : 'Run Kernel Protocol'}
          </button>
        </div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#999] mb-4">Model intuition</h5>
          <p className="text-sm text-[#444] leading-relaxed italic font-serif">
            "{analysis.desc}"
          </p>
        </div>
      </div>

      <div className={`w-full p-8 border-2 border-dashed border-[#A5C9FF]/50 transition-all duration-500 bg-[#F9FBFF]/30 mt-4 ${hasActuallyInteracted ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={onNext} className="w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 px-10 font-bold uppercase tracking-[0.3em] text-sm transition-all shadow-xl flex items-center justify-center group">
          {nextLabel || 'Advance Manuscript'}
        </button>
      </div>
    </div>
  );
};

export default CNNSim;