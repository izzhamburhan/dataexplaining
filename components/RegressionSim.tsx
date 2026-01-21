
import React, { useState, useMemo, useEffect } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

const DATA_POINTS = [
  { x: 50, y: 350 }, { x: 100, y: 320 }, { x: 150, y: 280 },
  { x: 200, y: 250 }, { x: 250, y: 200 }, { x: 300, y: 150 },
  { x: 350, y: 120 }, { x: 400, y: 80 }
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
  const [intercept, setIntercept] = useState(380);
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
    if (mse < 200) return { label: 'Optimal Fit', color: 'text-emerald-600', desc: 'The line captures the underlying trend with high precision.' };
    if (mse < 1500) return { label: 'Approximated Trend', color: 'text-amber-600', desc: 'The model follows the general direction but lacks alignment.' };
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
    <div className="w-full flex flex-col items-center bg-white p-8 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] relative">
      {isTourActive && (
        <GuidanceTooltip 
          message={TOUR_STEPS[activeTourIndex].message}
          position={TOUR_STEPS[activeTourIndex].position}
          onNext={handleTourNext}
          onClose={() => onTourClose?.()}
          isLast={activeTourIndex === TOUR_STEPS.length - 1}
        />
      )}

      <div className="w-full flex justify-between items-end mb-8 border-b border-black/5 pb-4">
        <div>
          <h4 className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-1">Diagnostic Output</h4>
          <div className={`text-xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-1">MSE Score</div>
          <div className="text-xl font-mono font-bold tabular-nums">{Math.round(errorDetails.mse).toString().padStart(5, '0')}</div>
        </div>
      </div>

      <div className="relative w-full h-[240px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-8 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 400" preserveAspectRatio="none">
          {showError && errorDetails.residuals.map((r, i) => {
            const size = Math.abs(r.residual);
            const top = r.residual > 0 ? r.predictedY : r.y;
            return <rect key={i} x={r.x} y={top} width={size} height={size} fill="#2A4D69" className="opacity-5" stroke="#2A4D69" strokeWidth="0.5" strokeDasharray="1,1" />;
          })}
          <line x1="0" y1={intercept} x2="500" y2={slope * 500 + intercept} stroke="#121212" strokeWidth="1.5" className="transition-all duration-300" />
        </svg>
        {DATA_POINTS.map((p, i) => (
          <div key={i} className="absolute w-2 h-2 bg-[#121212] rotate-45 z-10" style={{ left: `${(p.x / 500) * 100}%`, top: `${(p.y / 400) * 100}%`, transform: 'translate(-50%, -50%) rotate(45deg)' }} />
        ))}
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-[9px] font-mono font-bold text-[#999] uppercase tracking-widest">Slope (θ1)</label>
              <span className="text-[9px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{slope.toFixed(2)}</span>
            </div>
            <input type="range" min="-2" max="1" step="0.01" value={slope} onChange={(e) => { setSlope(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px bg-black/10 rounded-full appearance-none cursor-pointer accent-[#2A4D69]" />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-[9px] font-mono font-bold text-[#999] uppercase tracking-widest">Intercept (θ0)</label>
              <span className="text-[9px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{intercept.toFixed(0)}</span>
            </div>
            <input type="range" min="0" max="500" step="1" value={intercept} onChange={(e) => { setIntercept(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px bg-black/10 rounded-full appearance-none cursor-pointer accent-[#2A4D69]" />
          </div>
        </div>
        <div className="bg-[#F9F8F6] p-4 border-l-2 border-black/5">
          <h5 className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#999] mb-2">Model Analysis</h5>
          <p className="text-[11px] text-[#444] leading-relaxed italic font-normal">"{analysis.desc}"</p>
        </div>
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); onNext?.(); }}
        className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-4 px-10 font-bold uppercase tracking-[0.3em] text-[11px] transition-all shadow-lg flex items-center justify-center group ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}
      >
        {nextLabel || 'Advance Manuscript'}
      </button>
    </div>
  );
};

export default RegressionSim;
