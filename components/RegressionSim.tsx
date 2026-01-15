
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
}

const RegressionSim: React.FC<Props> = ({ showError = false, adjustment, currentStep = 0, onInteract, onNext, nextLabel }) => {
  const [slope, setSlope] = useState(-0.5);
  const [intercept, setIntercept] = useState(380);
  const [showTooltip, setShowTooltip] = useState(true);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);

  // Handle AI adjustments
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

  useEffect(() => {
    setShowTooltip(true);
    setHasActuallyInteracted(currentStep === 0); // Step 0 is intro, allow immediate progression
  }, [currentStep]);

  const markInteraction = () => {
    if (!hasActuallyInteracted) {
      setHasActuallyInteracted(true);
      onInteract?.();
    }
  };

  useEffect(() => {
    const handleGlobalClick = () => {
      if (showTooltip) {
        setShowTooltip(false);
        markInteraction();
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [showTooltip]);

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
    if (mse < 200) return { label: 'Optimal Fit', color: 'text-emerald-600', desc: 'The line captures the underlying trend with high precision. Residual variance is minimized.' };
    if (mse < 1500) return { label: 'Approximated Trend', color: 'text-amber-600', desc: 'The model follows the general direction but lacks structural alignment. Adjust the coefficients.' };
    return { label: 'Poor Correlation', color: 'text-rose-600', desc: 'The model is misaligned with the data distribution. The error squares are significantly large.' };
  }, [errorDetails.mse]);

  return (
    <div className="w-full flex flex-col items-center bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] relative">
      {/* GUIDANCE TOOLTIPS */}
      {showTooltip && (
        <>
          {currentStep === 0 && (
            <GuidanceTooltip 
              message="Each dot represents an observation. Notice how they follow a downward trend." 
              position="top-1/4 left-[40%]" 
              currentStep={currentStep}
            />
          )}
          
          {currentStep === 1 && (
            <GuidanceTooltip 
              message="Adjust these sliders to move the line. Try to 'slice' through the center of the dots." 
              position="bottom-1/4 left-[45%]" 
              currentStep={currentStep}
            />
          )}

          {currentStep === 2 && (
            <GuidanceTooltip 
              message="These squares represent 'Loss'. As you improve the fit, the squares will shrink!" 
              position="top-12 right-4" 
              currentStep={currentStep}
            />
          )}
        </>
      )}

      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Mean Squared Error</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{Math.round(errorDetails.mse).toString().padStart(5, '0')}</div>
        </div>
      </div>

      <div className="relative w-full aspect-video bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
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

      {currentStep > 0 && (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-12 animate-in fade-in slide-in-from-bottom-4">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-4">
                <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Coefficient (θ1)</label>
                <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{slope.toFixed(2)}</span>
              </div>
              <input type="range" min="-2" max="1" step="0.01" value={slope} onChange={(e) => { setSlope(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px bg-black/10 rounded-full appearance-none cursor-pointer accent-[#2A4D69]" />
            </div>
            <div>
              <div className="flex justify-between mb-4">
                <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Intercept (θ0)</label>
                <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{intercept.toFixed(0)}</span>
              </div>
              <input type="range" min="0" max="500" step="1" value={intercept} onChange={(e) => { setIntercept(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px bg-black/10 rounded-full appearance-none cursor-pointer accent-[#2A4D69]" />
            </div>
          </div>
          <div className="bg-[#F9F8F6] p-6 border-l-2 border-black/5">
            <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#999] mb-3">Model Analysis</h5>
            <p className="text-xs text-[#444] leading-relaxed italic font-normal">"{analysis.desc}"</p>
          </div>
        </div>
      )}

      {/* NEXT STEP BUTTON AREA */}
      <div className={`w-full p-8 border-2 border-dashed border-[#A5C9FF]/50 transition-all duration-500 bg-[#F9FBFF]/30 mt-4 ${hasActuallyInteracted ? 'opacity-100' : 'opacity-0'}`}>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onNext?.();
          }}
          className="w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 px-10 font-bold uppercase tracking-[0.3em] text-sm transition-all shadow-xl hover:shadow-[#2A4D69]/20 flex items-center justify-center group"
        >
          {nextLabel || 'Advance Manuscript'}
          <svg className="ml-4 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </button>
      </div>
      
      {showTooltip && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="mt-auto mb-4 bg-black/40 text-white text-[8px] font-mono uppercase tracking-[0.2em] px-3 py-1 rounded-full animate-pulse">
            Click anywhere to dismiss guide
          </div>
        </div>
      )}
    </div>
  );
};

export default RegressionSim;
