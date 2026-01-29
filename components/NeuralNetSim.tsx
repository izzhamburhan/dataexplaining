
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';
import { getMicroExplanation } from '../services/geminiService';
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
  { message: "Phase 2 introduces 'Hidden Layers'. They allow the network to model non-linear boundaries.", position: "top-[40%] left-[45%]" },
  { message: "Phase 3 is an Ethical Audit. High 'Training Skew' teaches the network to rely on zip codes as proxies for prejudice.", position: "bottom-[20%] left-[20%]" }
];

const NeuralNetSim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [w1, setW1] = useState(0.8);
  const [w2, setW2] = useState(0.4);
  const [trainingSkew, setTrainingSkew] = useState(0.5);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);
  const [geminiDesc, setGeminiDesc] = useState<string>('Syncing...');
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const debounceTimer = useRef<any>(null);

  const isFoundation = currentStep === 0;
  const isArchitecture = currentStep === 1;
  const isEthicalAudit = currentStep === 2;

  useEffect(() => { if (isTourActive) setActiveTourIndex(0); }, [isTourActive]);
  useEffect(() => {
    if (adjustment?.parameter === 'w1') { setW1(adjustment.value); markInteraction(); }
    if (adjustment?.parameter === 'w2') { setW2(adjustment.value); markInteraction(); }
    if (adjustment?.parameter === 'trainingSkew') { setTrainingSkew(adjustment.value); markInteraction(); }
  }, [adjustment]);
  useEffect(() => { setHasActuallyInteracted(isFoundation); if (isEthicalAudit) setTrainingSkew(0.5); }, [currentStep, isFoundation, isEthicalAudit]);

  const markInteraction = () => { if (!hasActuallyInteracted) { setHasActuallyInteracted(true); onInteract?.(); } };

  const inputs = { i1: 1.0, i2: 0.5 };
  const foundationActivation = Math.max(0, inputs.i1 * w1 + inputs.i2 * w2);
  const biasInfluence = isEthicalAudit ? (trainingSkew - 0.5) * 2 : 0;
  const biasedOutcome = Math.max(0, inputs.i1 * (1 - Math.abs(biasInfluence)) + inputs.i2 * biasInfluence);

  const analysis = useMemo(() => {
    if (isEthicalAudit) { if (Math.abs(trainingSkew - 0.5) > 0.3) return { label: 'Proxy Dominance', color: 'text-rose-600', desc: 'The network is ignoring primary merits in favor of discriminatory signals.' }; return { label: 'Equitable Weights', color: 'text-emerald-600', desc: 'The network maintains a balanced sensitivity to relevant inputs.' }; }
    const act = isFoundation ? foundationActivation : 0.8; if (act > 1.2) return { label: 'Strong Propagation', color: 'text-emerald-600', desc: 'The signal is firing at peak efficiency.' }; return { label: 'Stable Synapse', color: 'text-slate-400', desc: 'Signals are propagating through synaptic weights.' };
  }, [foundationActivation, trainingSkew, isEthicalAudit, isFoundation]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setIsGeminiLoading(true);
      const params = `W1: ${w1.toFixed(2)}, W2: ${w2.toFixed(2)}, Skew: ${trainingSkew.toFixed(2)}, Act: ${(isEthicalAudit ? biasedOutcome : foundationActivation).toFixed(2)}`;
      const res = await getMicroExplanation("Neural Networks", params);
      setGeminiDesc(res);
      setIsGeminiLoading(false);
    }, 1500);
    return () => clearTimeout(debounceTimer.current);
  }, [w1, w2, trainingSkew, biasedOutcome, foundationActivation, isEthicalAudit]);

  const handleTourNext = () => { audioService.play('click'); if (activeTourIndex < TOUR_STEPS.length - 1) setActiveTourIndex(prev => prev + 1); else onTourClose?.(); };

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-none flex flex-col items-center select-none relative transition-all duration-700">
      {isTourActive && <GuidanceTooltip message={TOUR_STEPS[activeTourIndex].message} position={TOUR_STEPS[activeTourIndex].position} onNext={handleTourNext} onClose={() => onTourClose?.()} isLast={activeTourIndex === TOUR_STEPS.length - 1} />}
      <div className="w-full flex justify-between items-end mb-10 border-b border-black/5 pb-6">
        <div><h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Neural Diagnostic</h4><div className={`text-2xl font-serif italic transition-colors duration-500 ${analysis.color}`}>{analysis.label}</div></div>
        <div className="text-right flex space-x-12">{isEthicalAudit && <div className="animate-in slide-in-from-right-4 duration-500"><div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-rose-300 mb-2">Proxy Weight</div><div className="text-2xl font-mono font-bold tabular-nums text-rose-600">{(Math.abs(biasInfluence) * 100).toFixed(0)}%</div></div>}<div><div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Activation</div><div className="text-2xl font-mono font-bold tabular-nums">{(isEthicalAudit ? biasedOutcome : foundationActivation).toFixed(2)}</div></div></div>
      </div>
      <div className="relative w-full h-[360px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 flex items-center justify-center shadow-inner"><div className="relative w-full h-full flex items-center justify-between px-24"><div className="flex flex-col justify-around h-64 z-10"><div className="group relative"><div className={`w-14 h-14 rotate-45 border-2 flex items-center justify-center transition-all duration-500 ${isEthicalAudit ? 'bg-white border-black/10' : 'bg-white border-black/5 shadow-lg'}`}><span className="font-mono text-[10px] font-bold -rotate-45">{inputs.i1.toFixed(1)}</span></div><span className="absolute -left-16 top-1/2 -translate-y-1/2 font-mono text-[8px] uppercase tracking-widest text-[#AAA]">{isEthicalAudit ? 'Income' : 'In 1'}</span></div><div className="group relative"><div className={`w-14 h-14 rotate-45 border-2 flex items-center justify-center transition-all duration-500 ${isEthicalAudit ? 'bg-rose-50 border-rose-200' : 'bg-white border-black/5 shadow-lg'}`}><span className={`font-mono text-[10px] font-bold -rotate-45 ${isEthicalAudit ? 'text-rose-600' : ''}`}>{inputs.i2.toFixed(1)}</span></div><span className="absolute -left-16 top-1/2 -translate-y-1/2 font-mono text-[8px] uppercase tracking-widest text-[#AAA]">{isEthicalAudit ? 'Zip Code' : 'In 2'}</span></div></div><svg className="absolute inset-0 w-full h-full pointer-events-none"><defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#CCC" /></marker><marker id="arrow-red" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#E11D48" /></marker></defs><line x1="28%" y1="32%" x2={isArchitecture ? "50%" : "72%"} y2={isArchitecture ? "32%" : "50%"} stroke={isEthicalAudit ? "#CCC" : "#121212"} strokeWidth={w1 * 8} strokeOpacity={0.1 + w1 * 0.2} markerEnd="url(#arrow)" /><line x1="28%" y1="68%" x2={isArchitecture ? "50%" : "72%"} y2={isArchitecture ? "68%" : "50%"} stroke={isEthicalAudit ? "#E11D48" : "#121212"} strokeWidth={isEthicalAudit ? Math.abs(biasInfluence) * 15 : w2 * 8} strokeOpacity={0.1 + w2 * 0.2} markerEnd={isEthicalAudit ? "url(#arrow-red)" : "url(#arrow)"} />{isArchitecture && (<><line x1="50%" y1="32%" x2="72%" y2="50%" stroke="#121212" strokeWidth="4" strokeOpacity="0.1" markerEnd="url(#arrow)" /><line x1="50%" y1="68%" x2="72%" y2="50%" stroke="#121212" strokeWidth="4" strokeOpacity="0.1" markerEnd="url(#arrow)" /></>)}</svg>{isArchitecture && (<div className="flex flex-col justify-around h-64 z-10 animate-in zoom-in fade-in duration-700"><div className="w-10 h-10 rotate-45 border border-black/20 bg-[#F9F8F6] shadow-sm flex items-center justify-center"><div className="w-1 h-1 bg-black/10 rounded-full animate-pulse" /></div><div className="w-10 h-10 rotate-45 border border-black/20 bg-[#F9F8F6] shadow-sm flex items-center justify-center"><div className="w-1 h-1 bg-black/10 rounded-full animate-pulse" /></div></div>)}<div className="relative z-10"><div className={`w-24 h-24 rotate-45 border-4 flex items-center justify-center transition-all duration-700 shadow-2xl ${isEthicalAudit ? 'border-rose-400' : 'border-[#121212]'}`} style={{ backgroundColor: isEthicalAudit ? `rgba(225, 29, 72, ${biasedOutcome * 0.4})` : `rgba(42, 77, 105, ${Math.min(1, foundationActivation)})`, transform: `scale(${0.95 + Math.min(0.2, (isEthicalAudit ? biasedOutcome : foundationActivation) * 0.1)}) rotate(45deg)` }}><div className="flex flex-col items-center -rotate-45"><span className={`font-mono text-lg font-bold tabular-nums ${isEthicalAudit && biasedOutcome > 0.5 ? 'text-white' : (isFoundation && foundationActivation > 0.5 ? 'text-white' : 'text-[#121212]')}`}>{(isEthicalAudit ? biasedOutcome : foundationActivation).toFixed(2)}</span>{isEthicalAudit && (<span className="text-[6px] font-mono font-bold uppercase tracking-tighter absolute -bottom-4 whitespace-nowrap opacity-60">{biasedOutcome > 0.5 ? 'DENY LOAN' : 'APPROVE'}</span>)}</div></div></div></div>{isEthicalAudit && (<div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-md border border-rose-100 p-4 animate-in slide-in-from-left-4 duration-700"><span className="font-mono text-[9px] font-bold text-rose-600 uppercase tracking-widest block mb-1">Ethical Audit Overlay</span><p className="text-[10px] font-serif italic text-slate-500">The red connection shows proxy signals overwhelming merit.</p></div>)}</div>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-10">{!isEthicalAudit ? (<><div><div className="flex justify-between mb-3"><label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Synaptic Weight (θ1)</label><span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-3 py-1 border border-black/5 rounded shadow-sm">{w1.toFixed(2)}</span></div><input type="range" min="0" max="1.5" step="0.05" value={w1} onChange={(e) => { setW1(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-1 appearance-none bg-black/10 rounded-full cursor-pointer accent-[#2A4D69]" /></div><div><div className="flex justify-between mb-3"><label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Synaptic Weight (θ2)</label><span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-3 py-1 border border-black/5 rounded shadow-sm">{w2.toFixed(2)}</span></div><input type="range" min="0" max="1.5" step="0.05" value={w2} onChange={(e) => { setW2(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-1 appearance-none bg-black/10 rounded-full cursor-pointer accent-[#2A4D69]" /></div></>) : (<div className="animate-in fade-in slide-in-from-bottom-2 duration-700"><div className="flex justify-between mb-3"><label className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest">Training Data Skew</label><span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-3 py-1 border border-rose-100 rounded shadow-sm">{trainingSkew < 0.4 ? 'Equitable' : (trainingSkew > 0.6 ? 'Heavily Biased' : 'Neutral')}</span></div><input type="range" min="0" max="1" step="0.01" value={trainingSkew} onChange={(e) => { setTrainingSkew(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px bg-rose-100 rounded-full appearance-none cursor-pointer accent-rose-500" /></div>)}</div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5 min-h-[140px] flex flex-col justify-center">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#999] mb-3">Model Analysis</h5>
          <p className="text-sm text-[#444] italic font-serif leading-relaxed mb-4">"{analysis.desc}"</p>
          <div className="pt-4 border-t border-black/5">
            <span className="text-[8px] font-mono font-bold text-[#2A4D69] uppercase tracking-widest block mb-1">Neural Insight</span>
            <p className="text-[11px] text-[#2A4D69] font-serif italic">
              {isGeminiLoading ? 'Synthesizing...' : `"${geminiDesc}"`}
            </p>
          </div>
        </div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onNext?.(); }} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 px-10 font-bold uppercase tracking-[0.3em] text-sm transition-all shadow-xl flex items-center justify-center group ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>{nextLabel || 'Advance Manuscript'}<svg className="ml-4 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></button>
    </div>
  );
};

export default NeuralNetSim;
