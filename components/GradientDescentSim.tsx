
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
  const [probePoint, setProbePoint] = useState<number | null>(null);

  const isIntro = currentStep === 0;
  const isEngineActive = currentStep === 1;

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
    setHasActuallyInteracted(isIntro); 
    reset();
  }, [currentStep, isIntro]);

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
    setProbePoint(null);
  };

  const takeStep = useCallback(() => {
    const gradient = 2 * point;
    const nextPoint = point - lr * gradient;
    
    // Crucial: Update history before updating point to keep them in sync
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
    if (isIntro) return { status: 'idle', label: 'Probing Terrain', color: 'text-slate-400', description: 'Click the valley to measure the gradient at any point.' };
    
    const lastX = point;
    const isConverged = Math.abs(lastX) < 0.05;
    const isDiverging = Math.abs(lastX) > 15;
    if (isDiverging) return { status: 'diverging', label: 'Catastrophic Divergence', color: 'text-rose-600', description: 'The learning rate is too high. The model is overshooting the minimum.' };
    if (isConverged) return { status: 'converged', label: 'Optimal Convergence', color: 'text-emerald-600', description: 'Perfect. You found a stable rate.' };
    return { status: 'idle', label: 'Monitoring Descent...', color: 'text-slate-300', description: 'Adjust alpha (α) and run the optimization engine.' };
  }, [point, isIntro]);

  const handleTourNext = () => {
    audioService.play('click');
    if (activeTourIndex < TOUR_STEPS.length - 1) {
      setActiveTourIndex(prev => prev + 1);
    } else {
      onTourClose?.();
    }
  };

  const handleChartClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isIntro) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 24 - 12;
    setProbePoint(x);
    audioService.play('blip');
    markInteraction();
  };

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative transition-all duration-700">
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
      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className={`text-right transition-all duration-700 ${isIntro ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Epochs</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{iterationCount.toString().padStart(3, '0')}</div>
        </div>
      </div>

      {/* Main Plot Area */}
      <div className="relative w-full h-[340px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
        <svg 
          className={`absolute inset-0 w-full h-full ${isIntro ? 'cursor-crosshair' : 'cursor-default'}`} 
          viewBox="-12 -5 24 130"
          onClick={handleChartClick}
        >
          {/* Static Parabola */}
          <path 
            d={Array.from({ length: 101 }).map((_, i) => { 
              const x = (i / 4.16) - 12; 
              const y = x * x; 
              return `${i === 0 ? 'M' : 'L'} ${x} ${110 - y}`; 
            }).join(' ')} 
            fill="none" 
            stroke="#121212" 
            strokeWidth="0.1" 
            className="opacity-10" 
          />
          
          {/* History / Trajectory - Removed transition to keep synced with point */}
          {isEngineActive && history.length > 0 && (
            <polyline 
              points={history.concat(point).map(p => `${p},${110 - p * p}`).join(' ')} 
              fill="none" 
              stroke={analysis.status === 'diverging' ? '#E11D48' : '#2A4D69'} 
              strokeWidth="0.4" 
              strokeDasharray={analysis.status === 'converged' ? "0" : "0.8, 0.4"} 
            />
          )}

          {/* Current Agent Point - Removed transition and entry animation for sync */}
          {!isIntro && (
            <g transform={`translate(${point}, ${110 - point * point})`}>
              <circle r="1.5" fill="white" stroke="#121212" strokeWidth="0.4" />
              <circle r="0.6" fill={analysis.status === 'diverging' ? '#E11D48' : '#2A4D69'} />
            </g>
          )}

          {/* Probe Point - Phase 1 Only */}
          {isIntro && probePoint !== null && (
            <g transform={`translate(${probePoint}, ${110 - probePoint * probePoint})`}>
              <circle r="1.5" fill="#D4A017" fillOpacity="0.2" className="animate-ping" />
              <circle r="1.5" fill="white" stroke="#D4A017" strokeWidth="0.4" />
              <line 
                x1="-3" y1={3 * (2 * probePoint)} 
                x2="3" y2={-3 * (2 * probePoint)} 
                stroke="#D4A017" 
                strokeWidth="0.2" 
                strokeDasharray="0.5, 0.5" 
              />
            </g>
          )}
        </svg>

        {isIntro && (
          <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm border border-black/5 p-4 pointer-events-none">
            <span className="font-mono text-[9px] font-bold text-[#AAA] uppercase tracking-widest block mb-1">Observation Protocol</span>
            <p className="text-[10px] font-serif italic text-[#666]">Probing specific coordinates reveals the local gradient (slope).</p>
          </div>
        )}
      </div>

      {/* Controls Area */}
      <div className={`w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8 transition-all duration-700 ${isIntro ? 'opacity-20 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'}`}>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Learning Rate (α)</label>
              <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded shadow-sm">{lr.toFixed(3)}</span>
            </div>
            <input 
              type="range" 
              min="0.01" max="1.1" step="0.01" 
              value={lr} 
              onChange={(e) => { 
                setLr(parseFloat(e.target.value)); 
                audioService.play('click'); 
                markInteraction(); 
                if (iterationCount > 0) reset(); 
              }} 
              className="w-full h-px bg-black/10 rounded-full appearance-none cursor-pointer accent-[#2A4D69]" 
            />
          </div>
          <button 
            onClick={() => { audioService.play('blip'); setIsAutoRunning(!isAutoRunning); markInteraction(); }} 
            className={`w-full py-4 text-[10px] font-bold uppercase tracking-[0.3em] transition-all border ${isAutoRunning ? 'bg-transparent border-black/10 text-[#666]' : 'bg-[#121212] border-[#121212] text-white hover:bg-[#2A4D69] shadow-lg'}`}
          >
            {isAutoRunning ? 'Stop Simulation' : 'Run Optimization Engine'}
          </button>
        </div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5 min-h-[140px] flex items-center">
          <p className="text-xs text-[#444] leading-relaxed italic font-serif">"{analysis.description}"</p>
        </div>
      </div>

      {/* Advance Manuscript Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onNext?.(); }}
        className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 px-10 font-bold uppercase tracking-[0.3em] text-sm transition-all shadow-xl flex items-center justify-center group ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}
      >
        {nextLabel || 'Advance Manuscript'}
        <svg className="ml-4 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </button>
    </div>
  );
};

export default GradientDescentSim;
