
import React, { useState, useEffect, useMemo } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

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

interface Props {
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
}

const CNNSim: React.FC<Props> = ({ currentStep = 0, onInteract, onNext, nextLabel }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<keyof typeof KERNEL_PRESETS>('Edge Detect');
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

  useEffect(() => {
    let interval: any;
    if (isScanning) {
      interval = setInterval(() => {
        setPos(prev => {
          if (prev.x < 4) return { ...prev, x: prev.x + 1 };
          if (prev.y < 4) return { x: 0, y: prev.y + 1 };
          setIsScanning(false);
          markInteraction();
          return { x: 0, y: 0 };
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isScanning]);

  const kernel = KERNEL_PRESETS[selectedFilter];
  const scanIndex = pos.y * 5 + pos.x;

  const analysis = useMemo(() => {
    if (selectedFilter === 'Edge Detect') return { label: 'Feature Isolation', color: 'text-emerald-600', desc: 'The high-contrast kernel highlights discontinuities. Notice the strong spikes where the pattern meets the background.' };
    if (selectedFilter === 'Blur') return { label: 'Data Smoothing', color: 'text-amber-600', desc: 'The averaging kernel reduces local variance, abstracting the raw pixel data into a broader representation.' };
    if (selectedFilter === 'Identity') return { label: 'Signal Preservation', color: 'text-slate-400', desc: 'A transparent pass-through. No feature extraction is occurring at this layer.' };
    return { label: 'Local Enhancement', color: 'text-blue-600', desc: 'Adjusting local weight distribution to emphasize specific spatial frequencies.' };
  }, [selectedFilter]);

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative">
      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Scan Progress</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{((scanIndex / 24) * 100).toFixed(0).padStart(3, '0')}%</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-12 items-center mb-12 w-full">
        <div className="relative">
          <div className="font-mono text-[8px] font-bold text-[#CCC] uppercase tracking-[0.2em] mb-4">Input Data (7x7)</div>
          <div className="grid grid-cols-7 gap-1 p-1 bg-[#FDFCFB] border border-black/5">
            {Array.from({ length: 49 }).map((_, i) => { const row = Math.floor(i / 7); const col = i % 7; const isPattern = row > 1 && row < 5 && col > 1 && col < 5; return <div key={i} className={`w-5 h-5 border border-black/5 ${isPattern ? 'bg-[#121212]' : 'bg-white'}`}></div>; })}
          </div>
          <div className="absolute border border-[#2A4D69] bg-[#2A4D69]/5 transition-all duration-200 pointer-events-none grid grid-cols-3 p-0.5" style={{ left: pos.x * 24 + 4, top: pos.y * 24 + 28, width: '72px', height: '72px' }}>
            {kernel.flat().map((val, i) => (<div key={i} className="flex items-center justify-center text-[6px] font-bold text-[#2A4D69] opacity-30">{val}</div>))}
          </div>
        </div>
        <div>
          <div className="font-mono text-[8px] font-bold text-[#CCC] uppercase tracking-[0.2em] mb-4">Feature Map (5x5)</div>
          <div className="grid grid-cols-5 gap-1 p-1 bg-[#FDFCFB] border border-black/5">
            {Array.from({ length: 25 }).map((_, i) => { const isActive = (isScanning || hasActuallyInteracted) && i <= scanIndex; const isActivated = (i % 6 === 0) && selectedFilter !== 'Identity'; return <div key={i} className={`w-7 h-7 transition-all duration-300 border ${isActive ? (isActivated ? 'bg-[#2A4D69] border-[#2A4D69]' : 'bg-[#2A4D69]/20 border-black/5') : 'bg-white border-black/5'}`}></div>; })}
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(KERNEL_PRESETS) as Array<keyof typeof KERNEL_PRESETS>).map(f => (
              <button key={f} onClick={() => { audioService.play('click'); setSelectedFilter(f); setPos({x:0, y:0}); setIsScanning(false); markInteraction(); }} className={`py-3 text-[10px] font-mono font-bold uppercase tracking-widest border transition-all ${selectedFilter === f ? 'bg-[#121212] text-white' : 'border-black/5 text-[#999]'}`}>{f}</button>
            ))}
          </div>
          <button onClick={() => { audioService.play('blip'); markInteraction(); setIsScanning(true); setPos({x:0, y:0}); }} disabled={isScanning} className={`w-full py-4 text-[10px] font-bold uppercase tracking-[0.3em] transition-all border ${isScanning ? 'bg-transparent border-black/10 text-[#666]' : 'bg-[#121212] border-[#121212] text-white hover:bg-[#2A4D69]'}`}>{isScanning ? 'Convolving...' : 'Run Kernel Scan'}</button>
        </div>
        <div className="bg-[#F9F8F6] p-6 border-l-2 border-black/5">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#999] mb-3">Model Analysis</h5>
          <p className="text-xs text-[#444] leading-relaxed italic font-normal">"{analysis.desc}"</p>
        </div>
      </div>

      {/* NEXT STEP BUTTON AREA */}
      <div className={`w-full p-8 border-2 border-dashed border-[#A5C9FF]/50 transition-all duration-500 bg-[#F9FBFF]/30 mt-4 ${hasActuallyInteracted ? 'opacity-100' : 'opacity-0'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); onNext?.(); }}
          className="w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 px-10 font-bold uppercase tracking-[0.3em] text-sm transition-all shadow-xl flex items-center justify-center group"
        >
          {nextLabel || 'Advance Manuscript'}
          <svg className="ml-4 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </button>
      </div>
    </div>
  );
};

export default CNNSim;
