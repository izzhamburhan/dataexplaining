
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

// Phase 3: Texture Bias Data (Simplified face/texture grids)
const PROXY_TEXTURES = {
  GroupA: [
    [0.1, 0.1, 0.2, 0.1, 0.1, 0.2, 0.1],
    [0.1, 0.2, 0.9, 0.9, 0.9, 0.2, 0.1],
    [0.2, 0.9, 0.5, 0.1, 0.5, 0.9, 0.2],
    [0.1, 0.9, 0.1, 0.2, 0.1, 0.9, 0.1],
    [0.2, 0.9, 0.5, 0.5, 0.5, 0.9, 0.2],
    [0.1, 0.2, 0.9, 0.9, 0.9, 0.2, 0.1],
    [0.1, 0.1, 0.2, 0.1, 0.1, 0.2, 0.1],
  ],
  GroupB: [
    [0.8, 0.9, 0.8, 0.7, 0.8, 0.9, 0.8],
    [0.9, 0.8, 0.2, 0.1, 0.2, 0.8, 0.9],
    [0.8, 0.2, 0.5, 0.9, 0.5, 0.2, 0.8],
    [0.7, 0.1, 0.9, 0.8, 0.9, 0.1, 0.7],
    [0.8, 0.2, 0.5, 0.5, 0.5, 0.2, 0.8],
    [0.9, 0.8, 0.2, 0.1, 0.2, 0.8, 0.9],
    [0.8, 0.9, 0.8, 0.7, 0.8, 0.9, 0.8],
  ]
};

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
  { message: "The gold square is the 'Sliding Window'. It multiplies values to extract features.", position: "top-[40%] left-[40%]" },
  { message: "In Phase 3, notice how specific kernels might only activate on certain 'Texture Proxies'.", position: "bottom-[20%] left-[30%]" }
];

const CNNSim: React.FC<Props> = ({ currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<keyof typeof KERNEL_PRESETS>('Edge Detect');
  const [featureMap, setFeatureMap] = useState<number[][]>(Array.from({ length: 5 }, () => Array(5).fill(0)));
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);
  const [activeProxy, setActiveProxy] = useState<'GroupA' | 'GroupB'>('GroupA');

  const isIntuition = currentStep === 0;
  const isLoss = currentStep === 1;
  const isBias = currentStep === 2;

  const currentImage = isBias ? PROXY_TEXTURES[activeProxy] : INPUT_IMAGE;

  useEffect(() => { if (isTourActive) setActiveTourIndex(0); }, [isTourActive]);
  
  useEffect(() => { 
    setHasActuallyInteracted(isIntuition); 
    resetScan();
  }, [currentStep, isIntuition]);

  const resetScan = () => {
    setPos({ x: 0, y: 0 });
    setIsScanning(false);
    setFeatureMap(Array.from({ length: 5 }, () => Array(5).fill(0)));
  };

  const markInteraction = () => { if (!hasActuallyInteracted) { setHasActuallyInteracted(true); onInteract?.(); } };

  const calculateConvolutionStep = (x: number, y: number, kernel: number[][]) => {
    let sum = 0;
    for (let ky = 0; ky < 3; ky++) {
      for (let kx = 0; kx < 3; kx++) {
        sum += currentImage[y + ky][x + kx] * kernel[ky][kx];
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
  }, [isScanning, selectedFilter, activeProxy]);

  const analysis = useMemo(() => {
    if (isBias) {
      const avgActivation = featureMap.flat().reduce((a, b) => a + Math.abs(b), 0) / 25;
      if (avgActivation > 3) return { label: 'High Proxy Sensitivity', color: 'text-rose-600', desc: 'The selected kernel is firing aggressively on this specific texture group. This can lead to disparate detection rates in facial recognition.' };
      return { label: 'Low Filter Response', color: 'text-slate-400', desc: 'The filter is largely ignoring this texture. This may cause high "false negative" rates for this demographic group.' };
    }
    if (isLoss && selectedFilter === 'Blur') return { label: 'Information Decimation', color: 'text-amber-600', desc: 'The blur kernel pool is destroying sharp features. This demonstrates how complexity reduction can hide important signals.' };
    return { label: isScanning ? 'Active Processing' : 'Steady State', color: 'text-[#2A4D69]', desc: 'The kernel is mapping spatial intensity to abstract feature clusters.' };
  }, [featureMap, isBias, isScanning, isLoss, selectedFilter]);

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
      
      {/* Header Info */}
      <div className="w-full flex justify-between items-end mb-10 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Feature Diagnostic</h4>
          <div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className="text-right flex space-x-12">
          {isBias && (
            <div className="animate-in slide-in-from-right-4">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-rose-300 mb-2">Proxy Activation</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-rose-600">
                {(featureMap.flat().reduce((a, b) => a + Math.abs(b), 0) / 10).toFixed(1)}%
              </div>
            </div>
          )}
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Active Kernel</div>
            <div className="text-2xl font-mono font-bold text-[#121212]">{selectedFilter}</div>
          </div>
        </div>
      </div>

      {/* Main Architecture visualization Area */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-12 p-12 bg-[#F9F8F6] border border-black/5 shadow-inner">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono text-[#999] uppercase tracking-[0.4em] mb-6">Input Source (7x7)</span>
          <div className="relative grid grid-cols-7 gap-1 p-2 bg-white shadow-xl border border-black/5">
            {currentImage.map((row, y) => row.map((cell, x) => (
              <div 
                key={`${x}-${y}`} 
                className={`w-10 h-10 border border-black/[0.03] transition-colors duration-500`} 
                style={{ backgroundColor: `rgba(18, 18, 18, ${cell})` }}
              />
            )))}
            <div className="absolute border-4 border-[#D4A017] bg-[#D4A017]/15 pointer-events-none transition-all duration-150 shadow-[0_0_20px_rgba(212,160,23,0.3)]" 
              style={{ width: 'calc((40px + 4px) * 3 + 8px)', height: 'calc((40px + 4px) * 3 + 8px)', left: `calc(${pos.x} * (40px + 4px) + 4px)`, top: `calc(${pos.y} * (40px + 4px) + 4px)` }} 
            />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono text-[#999] uppercase tracking-[0.4em] mb-6">Activation Map (5x5)</span>
          <div className="grid grid-cols-5 gap-1 p-2 bg-white shadow-xl border border-black/5">
            {featureMap.map((row, y) => row.map((val, x) => {
              const isActive = (y < pos.y || (y === pos.y && x <= pos.x)) && (isScanning || hasActuallyInteracted);
              return (
                <div 
                  key={`${x}-${y}`} 
                  className="w-14 h-14 border border-black/[0.03] flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-300" 
                  style={{ 
                    backgroundColor: isActive ? (isBias ? `rgba(225, 29, 72, ${0.1 + Math.abs(val) / 6})` : `rgba(42, 77, 105, ${0.1 + Math.abs(val) / 8})`) : 'transparent', 
                    color: isActive && Math.abs(val) > 4 ? 'white' : '#121212' 
                  }}
                >
                  {isActive && Math.round(val)}
                </div>
              );
            }))}
          </div>
        </div>
      </div>

      {/* Controls Area */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {(Object.keys(KERNEL_PRESETS) as Array<keyof typeof KERNEL_PRESETS>).map(f => (
              <button 
                key={f} 
                onClick={() => { setSelectedFilter(f); resetScan(); audioService.play('click'); }} 
                className={`py-4 text-[10px] font-bold uppercase tracking-[0.2em] border transition-all shadow-sm ${selectedFilter === f ? 'bg-[#121212] text-white border-[#121212]' : 'bg-white border-black/10 text-[#999] hover:border-[#2A4D69]'}`}
              >
                {f}
              </button>
            ))}
          </div>
          
          {isBias && (
            <div className="flex space-x-4 animate-in fade-in slide-in-from-bottom-2">
              <button 
                onClick={() => { setActiveProxy('GroupA'); resetScan(); }} 
                className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-widest border transition-all ${activeProxy === 'GroupA' ? 'bg-[#121212] text-white' : 'text-[#999]'}`}
              >
                Subject: Texture A
              </button>
              <button 
                onClick={() => { setActiveProxy('GroupB'); resetScan(); }} 
                className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-widest border transition-all ${activeProxy === 'GroupB' ? 'bg-[#121212] text-white' : 'text-[#999]'}`}
              >
                Subject: Texture B
              </button>
            </div>
          )}
        </div>
        
        <div className="flex flex-col space-y-4">
          <button 
            onClick={() => { setIsScanning(true); audioService.play('blip'); }} 
            disabled={isScanning} 
            className="w-full py-5 text-[11px] font-bold uppercase tracking-[0.3em] bg-[#121212] text-white hover:bg-[#2A4D69] disabled:opacity-50 transition-all shadow-xl"
          >
            {isScanning ? 'Processing Spatial Features...' : 'Execute Convolutional Scan'}
          </button>
          <div className="bg-[#F9F8F6] p-6 border-l-4 border-black/5 min-h-[100px] flex items-center">
            <p className="text-sm text-[#444] italic font-serif leading-relaxed">"{analysis.desc}"</p>
          </div>
        </div>
      </div>

      <button onClick={onNext} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 font-bold uppercase tracking-[0.3em] text-xs transition-all shadow-xl flex items-center justify-center group ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
        {nextLabel || 'Advance Manuscript'}
        <svg className="ml-4 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </button>
    </div>
  );
};

export default CNNSim;
