
import React, { useState, useMemo, useEffect } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

// Fixed "Truth" function - The underlying pattern the model SHOULD find
const truthFn = (x: number) => Math.sin(x * 0.8) * 80 + 150;

// Generate data once
const DATA_X = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const TRAIN_POINTS = DATA_X.map((x, i) => ({
  x,
  y: truthFn(x) + (i % 2 === 0 ? 40 : -40) // Deterministic "noise" for clarity
}));

const TEST_POINTS = [1.5, 3.5, 5.5, 7.5].map(x => ({
  x,
  y: truthFn(x) + (Math.random() - 0.5) * 15 // Test data is close to truth
}));

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
  { message: "The solid black diamonds are our 'Training Data'. They contain underlying truth but also random noise.", position: "top-[40%] left-[25%]", direction: 'left' as const },
  { message: "This Complexity slider increases the model's flexibility. High complexity allows it to hit every point precisely.", position: "bottom-[22%] left-[40%]", direction: 'left' as const },
  { message: "Watch out! When complexity is too high, the line wiggles wildly. It is 'Memorizing' the noise instead of 'Learning' the pattern.", position: "top-[50%] left-[45%]", direction: 'left' as const }
];

const OverfittingSim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [complexity, setComplexity] = useState(1);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);

  useEffect(() => {
    if (isTourActive) setActiveTourIndex(0);
  }, [isTourActive]);

  useEffect(() => {
    if (adjustment?.parameter === 'complexity') {
      setComplexity(Math.round(adjustment.value));
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

  // Complex path calculation to make the "trap" visible
  const modelPath = useMemo(() => {
    const points = [];
    const resolution = 120;
    
    for (let i = 0; i <= resolution; i++) {
      const x = (i / resolution) * 10;
      let y = 0;
      
      if (complexity <= 3) {
        // Underfit: Just a straight line
        const slope = (complexity - 1) * 5;
        y = 150 + (x - 5) * slope;
      } else if (complexity <= 7) {
        // Balanced: Approaching truth
        const blend = (complexity - 3) / 4;
        const linear = 150 + (x - 5) * 10;
        y = (1 - blend) * linear + blend * truthFn(x);
      } else {
        // Overfit: High frequency oscillations + snapping to training points
        const base = truthFn(x);
        const overfitFactor = (complexity - 7) / 8; // 0 to 1
        
        // Add a "wobble"
        let wobble = Math.sin(x * complexity * 1.2) * (overfitFactor * 60);
        
        // Force the line to touch training points more precisely as complexity increases
        let pull = 0;
        TRAIN_POINTS.forEach(p => {
          const dist = Math.abs(x - p.x);
          if (dist < 0.8) {
            const influence = Math.pow(1 - dist / 0.8, 4) * overfitFactor;
            pull += (p.y - (base + wobble)) * influence;
          }
        });
        
        y = base + wobble + pull;
      }
      // Scaling to 0-100 range for SVG viewBox
      points.push(`${(x / 10) * 100},${y / 3}`);
    }
    return points.join(' ');
  }, [complexity]);

  const analysis = useMemo(() => {
    if (complexity < 4) return { label: 'UNDERFITTING', color: 'text-amber-600', desc: 'The model is too simple. It ignores the curves and fails to capture even basic trends.', accent: '#D97706' };
    if (complexity <= 7) return { label: 'OPTIMAL FIT', color: 'text-emerald-600', desc: 'Balanced. The model captures the general flow of the data while ignoring individual outliers.', accent: '#059669' };
    return { label: 'OVERFITTING', color: 'text-rose-600', desc: 'The model is "memorizing" noise. It zig-zags wildly to hit every training point, losing sight of the true pattern.', accent: '#E11D48' };
  }, [complexity]);

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
          direction={TOUR_STEPS[activeTourIndex].direction}
          onNext={handleTourNext}
          onClose={() => onTourClose?.()}
          isLast={activeTourIndex === TOUR_STEPS.length - 1}
        />
      )}

      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-3xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Complexity Level</div>
          <div className="text-3xl font-mono font-bold tabular-nums">P{complexity}</div>
        </div>
      </div>

      <div className="relative w-full h-[360px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-[inset_0_2px_20px_rgba(0,0,0,0.03)]">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* 1. The Underlying Truth (The Ghost Line) */}
          <path 
            d={Array.from({length: 40}).map((_, i) => {
              const x = (i/39)*10;
              return `${i===0?'M':'L'} ${(x/10)*100} ${truthFn(x)/3}`;
            }).join(' ')}
            fill="none" stroke="#666" strokeWidth="0.5" strokeDasharray="2,2" className="opacity-40"
          />

          {/* 2. The Model's Prediction (The Moving Line) */}
          <polyline 
            points={modelPath} 
            fill="none" 
            stroke={analysis.accent} 
            strokeWidth={complexity > 7 ? "0.8" : "1.2"} 
            className="transition-all duration-300 drop-shadow-sm" 
          />
        </svg>

        {/* 3. Training Data Points (Noisy Diamonds) */}
        {TRAIN_POINTS.map((p, i) => (
           <div key={`tr-${i}`} className="absolute w-3.5 h-3.5 bg-[#121212] rotate-45 z-20 shadow-md flex items-center justify-center" style={{ left: `${(p.x / 10) * 100}%`, top: `${p.y / 3}%`, transform: 'translate(-50%, -50%) rotate(45deg)' }}>
             <div className="w-1.5 h-1.5 bg-white/20"></div>
           </div>
        ))}

        {/* 4. Test Data Points (Unseen Reality) */}
        {TEST_POINTS.map((p, i) => (
           <div key={`ts-${i}`} className="absolute w-2.5 h-2.5 border-2 border-[#CCC] rounded-full z-10 bg-white" style={{ left: `${(p.x / 10) * 100}%`, top: `${p.y / 3}%`, transform: 'translate(-50%, -50%)' }} />
        ))}

        {/* Real-time Legend Overlay */}
        <div className="absolute top-4 right-4 flex flex-col items-end space-y-2 bg-white/80 backdrop-blur-sm p-4 border border-black/5 rounded shadow-sm">
           <div className="flex items-center space-x-3">
              <span className="font-mono text-[8px] text-[#999] uppercase tracking-widest">Training Data (Input)</span>
              <div className="w-2.5 h-2.5 bg-[#121212] rotate-45"></div>
           </div>
           <div className="flex items-center space-x-3">
              <span className="font-mono text-[8px] text-[#999] uppercase tracking-widest">Test Data (Reality)</span>
              <div className="w-2.5 h-2.5 border-2 border-[#CCC] rounded-full"></div>
           </div>
           <div className="flex items-center space-x-3">
              <span className="font-mono text-[8px] text-[#999] uppercase tracking-widest">True Pattern</span>
              <div className="w-4 h-[1px] border-b border-dashed border-[#666]"></div>
           </div>
           <div className="flex items-center space-x-3">
              <span className="font-mono text-[8px] text-[#999] uppercase tracking-widest">Model Guess</span>
              <div className="w-4 h-1 transition-colors duration-500" style={{ backgroundColor: analysis.accent }}></div>
           </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-10">
          <div>
            <div className="flex justify-between mb-4">
               <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-[0.2em] block">Degrees of Freedom (Polynomial Complexity)</label>
               <span className={`text-[10px] font-mono font-bold px-3 py-1 border border-black/5 rounded ${analysis.color} bg-[#F9F8F6]`}>{complexity === 1 ? 'Linear' : complexity < 8 ? 'Quadratic' : 'High Degree'}</span>
            </div>
            <input 
              type="range" min="1" max="15" step="1" value={complexity} 
              onChange={(e) => { setComplexity(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} 
              className="w-full h-1 bg-black/5 appearance-none cursor-pointer accent-[#2A4D69] hover:accent-[#E11D48] transition-colors" 
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-[#F9F8F6] border border-black/5">
             <div className="flex flex-col">
                <span className="font-mono text-[8px] text-[#AAA] uppercase tracking-widest mb-1">Generalization Score</span>
                <div className="flex space-x-1">
                   {Array.from({length: 10}).map((_, i) => {
                     const threshold = complexity < 4 ? 3 : complexity < 8 ? 9 : 2;
                     return <div key={i} className={`w-3 h-3 ${i < threshold ? 'bg-emerald-500' : 'bg-black/5'}`} />
                   })}
                </div>
             </div>
             <div className="text-right">
                <span className="font-mono text-[8px] text-[#AAA] uppercase tracking-widest block mb-1">Status</span>
                <span className={`font-mono text-[10px] font-bold ${analysis.color}`}>{complexity < 4 ? 'LOW' : complexity < 8 ? 'HIGH' : 'FAILED'}</span>
             </div>
          </div>
        </div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 transition-colors duration-500" style={{ borderColor: analysis.accent }}>
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#999] mb-4">Model intuition</h5>
          <p className="text-sm text-[#444] leading-relaxed italic font-serif">
            "{analysis.desc}"
          </p>
        </div>
      </div>

      <div className={`w-full p-8 border-2 border-dashed border-[#A5C9FF]/50 transition-all duration-500 bg-[#F9FBFF]/30 mt-4 ${hasActuallyInteracted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <button onClick={onNext} className="w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 px-10 font-bold uppercase tracking-[0.3em] text-sm transition-all shadow-xl flex items-center justify-center group">
          {nextLabel || 'Advance Manuscript'}
          <svg className="ml-4 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </button>
      </div>
    </div>
  );
};

export default OverfittingSim;
