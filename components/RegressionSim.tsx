
import React, { useState, useMemo, useEffect } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

const DATA_POINTS = [
  { x: 100, y: 450 }, { x: 200, y: 410 }, { x: 300, y: 360 },
  { x: 400, y: 320 }, { x: 500, y: 260 }, { x: 600, y: 190 },
  { x: 700, y: 150 }, { x: 800, y: 100 }
];

interface Props {
  showError?: boolean;
  adjustment?: { parameter: string; value: number } | null;
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isTourActive?: boolean;
  onTourClose?: () => void;
}

const TOUR_STEPS = [
  { message: "These dots are observations. In regression, we try to explain their vertical position based on their horizontal progress.", position: "top-[20%] left-[50%]" },
  { message: "The black line is our 'Prediction'. We adjust it using these coefficients below.", position: "top-[40%] left-[20%]" },
  { message: "θ1 (Slope) controls the angle. Observe how it matches the general trend of the data points.", position: "bottom-[20%] left-[10%]" },
  { message: "The MSE (Mean Squared Error) tracks our accuracy. Lower numbers indicate a better fitting manuscript.", position: "top-[10%] right-[10%]" }
];

const RegressionSim: React.FC<Props> = ({ showError = false, adjustment, currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [slope, setSlope] = useState(-0.5);
  const [intercept, setIntercept] = useState(500);
  const [activeTourIndex, setActiveTourIndex] = useState(0);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);

  useEffect(() => {
    if (isTourActive) setActiveTourIndex(0);
  }, [isTourActive]);

  useEffect(() => {
    if (adjustment?.parameter === 'slope') {
      setSlope(adjustment.value);
      markInteraction();
    }
    if (adjustment?.parameter === 'intercept') {
      setIntercept(adjustment.value);
      markInteraction();
    }
  }, [adjustment]);

  const markInteraction = () => {
    if (!hasActuallyInteracted) {
      setHasActuallyInteracted(true);
      onInteract?.();
    }
  };

  const errorDetails = useMemo(() => {
    let totalSqError = 0;
    const residuals = DATA_POINTS.map(p => {
      const predictedY = slope * p.x + intercept;
      const residual = p.y - predictedY;
      totalSqError += Math.pow(residual, 2);
      return { ...p, predictedY, residual };
    });
    return { residuals, mse: totalSqError / DATA_POINTS.length };
  }, [slope, intercept]);

  const analysis = useMemo(() => {
    const mse = errorDetails.mse;
    if (mse < 400) return { label: 'Optimal Fit', color: 'text-emerald-600', desc: 'The line captures the underlying trend with high precision.' };
    if (mse < 3000) return { label: 'Approximated Trend', color: 'text-amber-600', desc: 'The model follows the general direction but lacks alignment.' };
    return { label: 'Poor Correlation', color: 'text-rose-600', desc: 'The model is misaligned with the data distribution.' };
  }, [errorDetails.mse]);

  const handleTourNext = () => {
    audioService.play('click');
    if (activeTourIndex < TOUR_STEPS.length - 1) {
      setActiveTourIndex(prev => prev + 1);
    } else {
      onTourClose?.();
    }
  };

  return (
    <div className="w-full flex flex-col items-center bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] relative transition-all duration-700">
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
          <div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">MSE Score</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{Math.round(errorDetails.mse).toString().padStart(6, '0')}</div>
        </div>
      </div>

      <div className="relative w-full h-[360px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="none">
          {/* Grid lines for depth */}
          <g stroke="#F0F0F0" strokeWidth="1">
             {Array.from({length: 11}).map((_, i) => (
               <React.Fragment key={i}>
                 <line x1={i * 100} y1="0" x2={i * 100} y2="600" />
                 <line x1="0" y1={i * 60} x2="1000" y2={i * 60} />
               </React.Fragment>
             ))}
          </g>

          {showError && errorDetails.residuals.map((r, i) => {
            const size = Math.abs(r.residual);
            const top = r.residual > 0 ? r.predictedY : r.y;
            return <rect key={i} x={r.x} y={top} width={size} height={size} fill="#2A4D69" className="opacity-5" stroke="#2A4D69" strokeWidth="0.5" strokeDasharray="1,1" />;
          })}
          <line x1="0" y1={intercept} x2="1000" y2={slope * 1000 + intercept} stroke="#121212" strokeWidth="2" className="transition-all duration-300" />
        </svg>
        {DATA_POINTS.map((p, i) => (
          <div key={i} className="absolute w-3 h-3 bg-[#121212] rotate-45 z-10 transition-all duration-500" style={{ left: `${(p.x / 1000) * 100}%`, top: `${(p.y / 600) * 100}%`, transform: 'translate(-50%, -50%) rotate(45deg)' }} />
        ))}
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-8">
          <div>
            <div className="flex justify-between mb-3">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Slope (θ1)</label>
              <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-3 py-1 border border-black/5 rounded shadow-sm">{slope.toFixed(2)}</span>
            </div>
            <input type="range" min="-2" max="1" step="0.01" value={slope} onChange={(e) => { setSlope(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-1 bg-black/10 rounded-full appearance-none cursor-pointer accent-[#2A4D69]" />
          </div>
          <div>
            <div className="flex justify-between mb-3">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Intercept (θ0)</label>
              <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-3 py-1 border border-black/5 rounded shadow-sm">{intercept.toFixed(0)}</span>
            </div>
            <input type="range" min="0" max="600" step="1" value={intercept} onChange={(e) => { setIntercept(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-1 bg-black/10 rounded-full appearance-none cursor-pointer accent-[#2A4D69]" />
          </div>
        </div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#999] mb-4">Model Analysis</h5>
          <p className="text-sm text-[#444] leading-relaxed italic font-normal">"{analysis.desc}"</p>
        </div>
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); onNext?.(); }}
        className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-5 px-10 font-bold uppercase tracking-[0.3em] text-xs transition-all shadow-xl flex items-center justify-center group ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}
      >
        {nextLabel || 'Advance Manuscript'}
      </button>
    </div>
  );
};

export default RegressionSim;
