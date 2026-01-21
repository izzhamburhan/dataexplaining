
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

const CNNSim: React.FC<Props> = ({ currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<keyof typeof KERNEL_PRESETS>('Edge Detect');
  const [featureMap, setFeatureMap] = useState<number[][]>(Array.from({ length: 5 }, () => Array(5).fill(0)));
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);

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
      }, 80);
    }
    return () => clearInterval(interval);
  }, [isScanning, selectedFilter]);

  return (
    <div className="bg-white p-6 border border-black/5 shadow-[0_20px_60px_rgba(0,0,0,0.03)] w-full max-w-3xl flex flex-col items-center relative">
      <div className="w-full flex justify-between items-end mb-6 border-b border-black/5 pb-3">
        <div>
          <h4 className="font-mono text-[8px] font-bold uppercase tracking-widest text-[#CCC] mb-1">Diagnostic Output</h4>
          <div className="text-lg font-serif italic text-[#2A4D69]">Scanning Feature Space</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[8px] font-bold uppercase tracking-widest text-[#CCC] mb-1">Kernel</div>
          <div className="text-lg font-mono font-bold">{selectedFilter}</div>
        </div>
      </div>

      <div className="w-full grid grid-cols-2 gap-8 items-center mb-8 p-6 bg-[#F9F8F6] border border-black/5">
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-mono text-[#AAA] uppercase tracking-widest mb-4">Input (7x7)</span>
          <div className="relative grid grid-cols-7 gap-0.5 p-1 bg-white shadow-sm border border-black/5">
            {INPUT_IMAGE.map((row, y) => row.map((cell, x) => (
              <div key={`${x}-${y}`} className={`w-5 h-5 border border-black/[0.03] ${cell === 1 ? 'bg-[#121212]' : 'bg-white'}`} />
            )))}
            <div className="absolute border-2 border-[#D4A017] bg-[#D4A017]/10 pointer-events-none transition-all duration-100" 
              style={{ width: 'calc((20px + 2px) * 3)', height: 'calc((20px + 2px) * 3)', left: `calc(${pos.x} * (20px + 2px) + 4px)`, top: `calc(${pos.y} * (20px + 2px) + 4px)` }} 
            />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-mono text-[#AAA] uppercase tracking-widest mb-4">Features (5x5)</span>
          <div className="grid grid-cols-5 gap-0.5 p-1 bg-white shadow-sm border border-black/5">
            {featureMap.map((row, y) => row.map((val, x) => {
              const isActive = (y < pos.y || (y === pos.y && x <= pos.x)) && (isScanning || hasActuallyInteracted);
              return <div key={`${x}-${y}`} className="w-7 h-7 border border-black/[0.03] flex items-center justify-center text-[7px] font-mono" style={{ backgroundColor: isActive ? `rgba(42, 77, 105, ${0.1 + Math.abs(val) / 8})` : 'transparent' }}>
                {isActive && Math.round(val)}
              </div>
            }))}
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-2 gap-8 mb-6">
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(KERNEL_PRESETS) as Array<keyof typeof KERNEL_PRESETS>).map(f => (
            <button key={f} onClick={() => { setSelectedFilter(f); setPos({x:0,y:0}); setIsScanning(false); setFeatureMap(Array.from({ length: 5 }, () => Array(5).fill(0))); audioService.play('click'); }} className={`py-2 text-[8px] font-bold uppercase tracking-widest border transition-all ${selectedFilter === f ? 'bg-[#121212] text-white' : 'border-black/5 text-[#999]'}`}>{f}</button>
          ))}
        </div>
        <button onClick={() => { setIsScanning(true); audioService.play('blip'); }} disabled={isScanning} className="w-full py-4 text-[9px] font-bold uppercase tracking-widest bg-[#121212] text-white hover:bg-[#2A4D69] disabled:opacity-50 transition-all">
          {isScanning ? 'Convolving...' : 'Run Scan'}
        </button>
      </div>

      <button onClick={onNext} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-4 font-bold uppercase tracking-widest text-[10px] transition-all ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
        {nextLabel || 'Advance Manuscript'}
      </button>
    </div>
  );
};

export default CNNSim;
