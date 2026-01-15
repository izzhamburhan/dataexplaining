
import React, { useState, useMemo, useEffect } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

interface Props {
  adjustment?: { parameter: string; value: number } | null;
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
}

const NeuralNetSim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel }) => {
  const [w1, setW1] = useState(0.8);
  const [w2, setW2] = useState(0.4);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);

  useEffect(() => {
    if (adjustment?.parameter === 'w1') { setW1(adjustment.value); markInteraction(); }
    if (adjustment?.parameter === 'w2') { setW2(adjustment.value); markInteraction(); }
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

  const activation = Math.max(0, (1.0 * w1 + 0.5 * w2)); 

  const analysis = useMemo(() => {
    if (activation > 0.8) return { label: 'High Excitation', color: 'text-emerald-600', desc: 'The weights are reinforcing the input signal strongly.' };
    return { label: 'Filtered Signal', color: 'text-amber-600', desc: 'The neuron is active but dampen.' };
  }, [activation]);

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative">
      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Activation Energy</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{activation.toFixed(2)}</div>
        </div>
      </div>

      <div className="relative w-full h-[240px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 flex items-center justify-center">
        <div className="relative w-[400px] h-full flex items-center justify-between px-16">
          <div className="flex flex-col justify-around h-32">
            <div className="w-10 h-10 rotate-45 border border-black/10 bg-white flex items-center justify-center font-mono text-[10px] font-bold text-[#121212]">1.0</div>
            <div className="w-10 h-10 rotate-45 border border-black/10 bg-white flex items-center justify-center font-mono text-[10px] font-bold text-[#121212]">0.5</div>
          </div>
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <line x1="120" y1="80" x2="280" y2="120" stroke="#121212" strokeWidth={w1 * 4} className="opacity-10" />
            <line x1="120" y1="160" x2="280" y2="120" stroke="#121212" strokeWidth={w2 * 4} className="opacity-10" />
          </svg>
          <div className="flex flex-col items-center">
             <div className="w-12 h-12 rotate-45 border-2 border-[#121212] flex items-center justify-center transition-all duration-500" style={{ backgroundColor: `rgba(42, 77, 105, ${activation})`, transform: `scale(${0.9 + activation * 0.2}) rotate(45deg)` }}>
              <span className="font-mono text-[10px] font-bold text-white -rotate-45">{activation.toFixed(1)}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Weight α</label>
              <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{w1.toFixed(1)}</span>
            </div>
            <input type="range" min="0" max="1" step="0.1" value={w1} onChange={(e) => { setW1(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px bg-black/10 rounded-full appearance-none cursor-pointer accent-[#2A4D69]" />
          </div>
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Weight β</label>
              <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{w2.toFixed(1)}</span>
            </div>
            <input type="range" min="0" max="1" step="0.1" value={w2} onChange={(e) => { setW2(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px bg-black/10 rounded-full appearance-none cursor-pointer accent-[#2A4D69]" />
          </div>
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

export default NeuralNetSim;
