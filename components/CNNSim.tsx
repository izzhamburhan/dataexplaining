
import React, { useState, useEffect, useMemo } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

const KERNEL_PRESETS = { 
  Identity: [[0,0,0],[0,1,0],[0,0,0]], 
  Blur: [[0.1,0.1,0.1],[0.1,0.2,0.1],[0.1,0.1,0.1]], 
  'Edge Detect': [[-1,-1,-1],[-1,8,-1],[-1,-1,-1]], 
  Sharpen: [[0,-1,0],[-1,5,-1],[0,-1,0]] 
};

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
  { message: "Convolutional Neural Networks see by applying 'Filters' (Kernels) over an image.", position: "top-[20%] left-[10%]" },
  { message: "The gold square is the 'Sliding Window'. It multiplies the kernel values by the image pixels to extract a single feature.", position: "top-[40%] left-[40%]" },
  { message: "The resulting 'Feature Map' is an abstract representation focusing on specific traits like edges or blur.", position: "bottom-[20%] left-[30%]" }
];

const CNNSim: React.FC<Props> = ({ currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<keyof typeof KERNEL_PRESETS>('Edge Detect');
  const [featureMap, setFeatureMap] = useState<number[][]>(Array.from({ length: 5 }, () => Array(5).fill(0)));
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);

  useEffect(() => { if (isTourActive) setActiveTourIndex(0); }, [isTourActive]);
  useEffect(() => { setHasActuallyInteracted(currentStep === 0); }, [currentStep]);

  const markInteraction = () => { if (!hasActuallyInteracted) { setHasActuallyInteracted(true); onInteract?.(); } };

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
      }, 80);
    }
    return () => clearInterval(interval);
  }, [isScanning, selectedFilter]);

  const handleTourNext = () => {
    audioService.play('click');
    if (activeTourIndex < TOUR_STEPS.length - 1) setActiveTourIndex(prev => prev + 1);
    else onTourClose?.();
  };

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-none flex flex-col items-center relative select-none transition-all duration-700">
      {isTourActive && (
        <GuidanceTooltip 
          message={TOUR_STEPS[activeTourIndex].message}
          position={TOUR_STEPS[activeTourIndex].position}
          onNext={handleTourNext}
          onClose={() => onTourClose?.()}
          isLast={activeTourIndex === TOUR_STEPS.length - 1}
        />
      )}
      <div className="w-full flex justify-between items-end mb-10 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className="text-2xl font-serif italic text-[#2A4D69]">Scanning Feature Space</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Active Kernel</div>
          <div className="text-2xl font-mono font-bold tracking-tight text-[#121212]">{selectedFilter}</div>
        </div>
      </div>

      <div className="w-full grid grid-cols-2 gap-16 items-center mb-12 p-12 bg-[#F9F8F6] border border-black/5 shadow-inner">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono text-[#999] uppercase tracking-[0.4em] mb-6">Source (7x7)</span>
          <div className="relative grid grid-cols-7 gap-1 p-2 bg-white shadow-xl border border-black/5">
            {INPUT_IMAGE.map((row, y) => row.map((cell, x) => (
              <div key={`${x}-${y}`} className={`w-10 h-10 border border-black/[0.03] transition-colors duration-500 ${cell === 1 ? 'bg-[#121212]' : 'bg-white'}`} />
            )))}
            <div className="absolute border-4 border-[#D4A017] bg-[#D4A017]/15 pointer-events-none transition-all duration-150 shadow-[0_0_20px_rgba(212,160,23,0.3)]" 
              style={{ width: 'calc((40px + 4px) * 3 + 8px)', height: 'calc((40px + 4px) * 3 + 8px)', left: `calc(${pos.x} * (40px + 4px) + 4px)`, top: `calc(${pos.y} * (40px + 4px) + 4px)` }} 
            />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono text-[#999] uppercase tracking-[0.4em] mb-6">Activation (5x5)</span>
          <div className="grid grid-cols-5 gap-1 p-2 bg-white shadow-xl border border-black/5">
            {featureMap.map((row, y) => row.map((val, x) => {
              const isActive = (y < pos.y || (y === pos.y && x <= pos.x)) && (isScanning || hasActuallyInteracted);
              return <div key={`${x}-${y}`} className="w-14 h-14 border border-black/[0.03] flex items-center justify-center text-[10px] font-mono font-bold" style={{ backgroundColor: isActive ? `rgba(42, 77, 105, ${0.1 + Math.abs(val) / 8})` : 'transparent', color: isActive && Math.abs(val) > 4 ? 'white' : '#121212' }}>
                {isActive && Math.round(val)}
              </div>
            }))}
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
        <div className="grid grid-cols-2 gap-4">
          {(Object.keys(KERNEL_PRESETS) as Array<keyof typeof KERNEL_PRESETS>).map(f => (
            <button key={f} onClick={() => { setSelectedFilter(f); setPos({x:0,y:0}); setIsScanning(false); setFeatureMap(Array.from({ length: 5 }, () => Array(5).fill(0))); audioService.play('click'); }} className={`py-4 text-[10px] font-bold uppercase tracking-[0.2em] border transition-all shadow-sm ${selectedFilter === f ? 'bg-[#121212] text-white border-[#121212]' : 'bg-white border-black/10 text-[#999] hover:border-[#2A4D69]'}`}>{f}</button>
          ))}
        </div>
        <button onClick={() => { setIsScanning(true); audioService.play('blip'); }} disabled={isScanning} className="w-full py-5 text-[11px] font-bold uppercase tracking-[0.3em] bg-[#121212] text-white hover:bg-[#2A4D69] disabled:opacity-50 transition-all shadow-xl">
          {isScanning ? 'Processing Spatial Features...' : 'Execute Convolutional Scan'}
        </button>
      </div>

      <button onClick={onNext} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-5 font-bold uppercase tracking-[0.3em] text-xs transition-all shadow-xl ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
        {nextLabel || 'Advance Manuscript'}
      </button>
    </div>
  );
};

export default CNNSim;
