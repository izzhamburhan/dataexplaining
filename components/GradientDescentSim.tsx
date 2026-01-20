
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

type TrainingStatus = 'idle' | 'converged' | 'diverging' | 'slow' | 'unstable' | 'running';

interface Props {
  adjustment?: { parameter: string; value: number } | null;
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isTourActive?: boolean;
  onTourClose?: () => void;
}

const TOUR_STEPS = [
  { message: "This parabola is our 'Error Valley'. The model wants to find the bottom where error is zero.", position: "top-[20%] left-[30%]" },
  { message: "The Learning Rate (α) determines how big each step is. Too large, and you'll jump right over the valley!", position: "bottom-[25%] left-[10%]" },
  { message: "Click 'Run Training' to watch the model attempt to reach the bottom using your parameters.", position: "bottom-[15%] left-[25%]" }
];

const GradientDescentSim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [point, setPoint] = useState(8);
  const [lr, setLr] = useState(0.1);
  const [history, setHistory] = useState<number[]>([]);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [iterationCount, setIterationCount] = useState(0);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);

  useEffect(() => {
    if (isTourActive) setActiveTourIndex(0);
  }, [isTourActive]);
  
  useEffect(() => {
    if (adjustment?.parameter === 'lr') {
      setLr(adjustment.value);
      reset();
      markInteraction();
    }
  }, [adjustment]);

  useEffect(() => {
    setHasActuallyInteracted(currentStep === 0);
  }, [currentStep]);

  const markInteraction = () => {
    if (!hasActuallyInteracted) {
      setHasActuallyInteracted(true);
      onInteract?.();
    }
  };

  const reset = () => {
    setPoint(8);
    setHistory([]);
    setIterationCount(0);
    setIsAutoRunning(false);
  };

  const takeStep = useCallback(() => {
    const gradient = 2 * point;
    const nextPoint = point - lr * gradient;
    setHistory(prev => [...prev, point]);
    setPoint(nextPoint);
    setIterationCount(prev => prev + 1);
    if (Math.abs(nextPoint) < 0.01) return 'converged';
    if (Math.abs(nextPoint) > 20) return 'diverging';
    if (iterationCount > 200) return 'slow';
    return 'running';
  }, [point, lr, iterationCount]);

  useEffect(() => {
    let timer: any;
    if (isAutoRunning) {
      timer = setTimeout(() => {
        const result = takeStep();
        if (result === 'converged') {
          audioService.play('success');
          setIsAutoRunning(false);
          markInteraction();
        } else if (result === 'diverging') {
          audioService.play('failure');
          setIsAutoRunning(false);
          markInteraction();
        } else if (result !== 'running') {
          setIsAutoRunning(false);
          markInteraction();
        }
      }, 50);
    }
    return () => clearTimeout(timer);
  }, [isAutoRunning, takeStep]);

  const analysis = useMemo((): { status: TrainingStatus; label: string; color: string; description: string } => {
    const lastX = point;
    const isConverged = Math.abs(lastX) < 0.05;
    const isDiverging = Math.abs(lastX) > 15;
    if (isDiverging) return { status: 'diverging', label: 'Catastrophic Divergence', color: 'text-rose-600', description: 'The learning rate is too high. The model is overshooting the minimum.' };
    if (isConverged) return { status: 'converged', label: 'Optimal Convergence', color: 'text-emerald-600', description: 'Perfect. You found a stable rate.' };
    return { status: 'idle', label: 'Monitoring Descent...', color: 'text-slate-300', description: 'Adjust parameters and run the training loop.' };
  }, [point, history, iterationCount]);

  const handleTourNext = () => {
    audioService.play('click');
    if (activeTourIndex < TOUR_STEPS.length - 1) {
      setActiveTourIndex(prev => prev + 1);
    } else {
      onTourClose?.();
    }
  };

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative">
      {isTourActive && (
        <GuidanceTooltip 
          message={TOUR_STEPS[activeTourIndex].message}
          position={TOUR_STEPS[activeTourIndex].position}
          onNext={handleTourNext}
          onClose={() => onTourClose?.()}
          isLast={activeTourIndex === TOUR_STEPS.length - 1}
        />
      )}

      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Epochs</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{iterationCount.toString().padStart(3, '0')}</div>
        </div>
      </div>

      <div className="relative w-full h-[300px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
        <svg className="absolute inset-0 w-full h-full" viewBox="-12 -5 24 130">
          <path d={Array.from({ length: 101 }).map((_, i) => { const x = (i / 4.16) - 12; const y = x * x; return `${i === 0 ? 'M' : 'L'} ${x} ${110 - y}`; }).join(' ')} fill="none" stroke="#121212" strokeWidth="0.1" className="opacity-10" />
          {history.length > 0 && <polyline points={history.concat(point).map(p => `${p},${110 - p * p}`).join(' ')} fill="none" stroke={analysis.status === 'diverging' ? '#E11D48' : '#2A4D69'} strokeWidth="0.4" strokeDasharray={analysis.status === 'converged' ? "0" : "0.8, 0.4"} className="transition-all duration-300" />}
          <g transform={`translate(${point}, ${110 - point * point})`}><circle r="1.5" fill="white" stroke="#121212" strokeWidth="0.4" /><circle r="0.6" fill={analysis.status === 'diverging' ? '#E11D48' : '#2A4D69'} /></g>
        </svg>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Learning Rate (α)</label>
              <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{lr.toFixed(3)}</span>
            </div>
            <input type="range" min="0.01" max="1.1" step="0.01" value={lr} onChange={(e) => { setLr(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); if (iterationCount > 0) reset(); }} className="w-full h-px bg-black/10 rounded-full appearance-none cursor-pointer accent-[#2A4D69]" />
          </div>
          <button onClick={() => { audioService.play('blip'); setIsAutoRunning(!isAutoRunning); markInteraction(); }} className={`w-full py-4 text-[10px] font-bold uppercase tracking-[0.3em] transition-all border ${isAutoRunning ? 'bg-transparent border-black/10 text-[#666]' : 'bg-[#121212] border-[#121212] text-white hover:bg-[#2A4D69]'}`}>
            {isAutoRunning ? 'Stop Simulation' : 'Run Training'}
          </button>
        </div>
        <div className="bg-[#F9F8F6] p-6 border-l-2 border-black/5">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#999] mb-4">Model Analysis</h5>
          <p className="text-xs text-[#444] leading-relaxed italic font-normal">"{analysis.description}"</p>
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

export default GradientDescentSim;
