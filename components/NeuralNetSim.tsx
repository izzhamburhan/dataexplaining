
import React, { useState, useMemo, useEffect } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

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
  { message: "Neurons process signals. Each connection has a 'Weight' that scales the incoming information.", position: "top-[20%] left-[30%]" },
  { message: "The center node is the 'Activated Neuron'. It sums the weighted inputs and applies a ReLU function.", position: "top-[40%] left-[45%]" },
  { message: "Adjust the weights to see how the signal pulses change. Learning is simply the tuning of these strengths.", position: "bottom-[20%] left-[20%]" }
];

const NeuralNetSim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [w1, setW1] = useState(0.8);
  const [w2, setW2] = useState(0.4);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);

  useEffect(() => {
    if (isTourActive) setActiveTourIndex(0);
  }, [isTourActive]);

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

  const input1 = 1.0, input2 = 0.5;
  const rawSum = (input1 * w1 + input2 * w2);
  const activation = Math.max(0, rawSum); 

  const analysis = useMemo(() => {
    if (!hasActuallyInteracted) return { label: 'Signal Pending', color: 'text-slate-300', desc: 'Adjust synaptic weights to observe signal propagation.' };
    if (activation > 1.2) return { label: 'Hyper-Excited', color: 'text-emerald-600', desc: 'The neuron is firing at peak capacity.' };
    return { label: 'Active Process', color: 'text-amber-600', desc: 'Signals are being filtered through architecture.' };
  }, [activation, hasActuallyInteracted]);

  const handleTourNext = () => {
    audioService.play('click');
    if (activeTourIndex < TOUR_STEPS.length - 1) setActiveTourIndex(prev => prev + 1);
    else onTourClose?.();
  };

  return (
    <div className="bg-white p-8 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative">
      {isTourActive && (
        <GuidanceTooltip message={TOUR_STEPS[activeTourIndex].message} position={TOUR_STEPS[activeTourIndex].position} onNext={handleTourNext} onClose={() => onTourClose?.()} isLast={activeTourIndex === TOUR_STEPS.length - 1} />
      )}
      
      <div className="w-full flex justify-between items-end mb-6 border-b border-black/5 pb-4">
        <div>
          <h4 className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-1">Diagnostic Output</h4>
          <div className={`text-xl font-serif italic transition-colors duration-500 ${analysis.color}`}>{analysis.label}</div>
        </div>
        <div className="text-right flex space-x-8">
          <div>
            <div className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-1">Sum</div>
            <div className="text-xl font-mono font-bold tabular-nums">{rawSum.toFixed(2)}</div>
          </div>
          <div>
            <div className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-1">Activation</div>
            <div className="text-xl font-mono font-bold tabular-nums">{activation.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[240px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-8 flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="relative w-full h-full flex items-center justify-between px-20">
          <div className="flex flex-col justify-around h-48 z-10">
            <div className="w-12 h-12 rotate-45 border-2 border-black/5 bg-white shadow-sm flex items-center justify-center">
              <span className="font-mono text-[11px] font-bold -rotate-45">{input1.toFixed(1)}</span>
            </div>
            <div className="w-12 h-12 rotate-45 border-2 border-black/5 bg-white shadow-sm flex items-center justify-center">
              <span className="font-mono text-[11px] font-bold -rotate-45">{input2.toFixed(1)}</span>
            </div>
          </div>

          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <line x1="30%" y1="35%" x2="70%" y2="50%" stroke="#121212" strokeWidth={w1 * 8} strokeOpacity={0.05 + w1 * 0.2} className="transition-all duration-300" />
            <line x1="30%" y1="65%" x2="70%" y2="50%" stroke="#121212" strokeWidth={w2 * 8} strokeOpacity={0.05 + w2 * 0.2} className="transition-all duration-300" />
          </svg>

          <div className="relative z-10">
            <div 
              className="w-20 h-20 rotate-45 border-4 border-[#121212] flex items-center justify-center transition-all duration-700 shadow-2xl overflow-hidden" 
              style={{ backgroundColor: `rgba(42, 77, 105, ${Math.min(1, activation)})`, transform: `scale(${0.95 + Math.min(0.2, activation * 0.1)}) rotate(45deg)` }}
            >
              <div className="flex flex-col items-center -rotate-45">
                <span className="font-mono text-[14px] font-bold text-white">{activation.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-6">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-[9px] font-mono font-bold text-[#999] uppercase tracking-widest">Weight 1</label>
              <span className="text-[9px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{w1.toFixed(2)}</span>
            </div>
            <input type="range" min="0" max="1.5" step="0.05" value={w1} onChange={(e) => { setW1(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px appearance-none bg-black/10 rounded-full cursor-pointer accent-[#2A4D69]" />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-[9px] font-mono font-bold text-[#999] uppercase tracking-widest">Weight 2</label>
              <span className="text-[9px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{w2.toFixed(2)}</span>
            </div>
            <input type="range" min="0" max="1.5" step="0.05" value={w2} onChange={(e) => { setW2(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px appearance-none bg-black/10 rounded-full cursor-pointer accent-[#2A4D69]" />
          </div>
        </div>
        <div className="bg-[#F9F8F6] p-6 border-l-4 border-black/5">
          <h5 className="text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-[#999] mb-2">Intuition</h5>
          <p className="text-[11px] text-[#444] leading-relaxed italic font-serif">"{analysis.desc}"</p>
        </div>
      </div>

      <button 
        onClick={onNext}
        className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-4 px-10 font-bold uppercase tracking-[0.3em] text-[11px] transition-all shadow-xl flex items-center justify-center group ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}
      >
        {nextLabel || 'Advance Manuscript'}
      </button>
    </div>
  );
};

export default NeuralNetSim;
