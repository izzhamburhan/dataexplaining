
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
  { message: "Decision Trees split data into subsets. The goal is to reach nodes containing only one class.", position: "top-[20%] left-[30%]" },
  { message: "Switch between X and Y dimensions to see which feature provides the best separation.", position: "bottom-[25%] left-[10%]" },
  { message: "In Phase 2, observe how a 'pure' split can sometimes target a specific demographic unfairly.", position: "bottom-[15%] left-[20%]" }
];

const DATA_POINTS = [
  { x: 50, y: 50, label: 'A', group: 'Minority' }, 
  { x: 100, y: 120, label: 'A', group: 'Majority' }, 
  { x: 150, y: 80, label: 'A', group: 'Majority' },
  { x: 400, y: 350, label: 'B', group: 'Majority' }, 
  { x: 350, y: 420, label: 'B', group: 'Minority' }, 
  { x: 450, y: 380, label: 'B', group: 'Majority' },
  { x: 100, y: 400, label: 'A', group: 'Minority' }, 
  { x: 400, y: 100, label: 'B', group: 'Majority' },
  { x: 200, y: 250, label: 'A', group: 'Majority' }, 
  { x: 300, y: 250, label: 'B', group: 'Minority' }
];

const DecisionTreeSim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [splitVal, setSplitVal] = useState(250);
  const [feature, setFeature] = useState<'X' | 'Y'>('X');
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);
  const [geminiDesc, setGeminiDesc] = useState<string>('Syncing...');
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const debounceTimer = useRef<any>(null);

  const isIntro = currentStep === 0;
  const isBiasPhase = currentStep === 1;

  useEffect(() => { if (isTourActive) setActiveTourIndex(0); }, [isTourActive]);
  useEffect(() => { if (adjustment?.parameter === 'splitVal') { setSplitVal(adjustment.value); markInteraction(); } }, [adjustment]);
  useEffect(() => { setHasActuallyInteracted(isIntro); }, [currentStep, isIntro]);

  const markInteraction = () => { if (!hasActuallyInteracted) { setHasActuallyInteracted(true); onInteract?.(); } };

  const { leftLeaf, rightLeaf } = useMemo(() => {
    const left = DATA_POINTS.filter(p => feature === 'X' ? p.x <= splitVal : p.y <= splitVal);
    const right = DATA_POINTS.filter(p => feature === 'X' ? p.x > splitVal : p.y > splitVal);
    return { leftLeaf: left, rightLeaf: right };
  }, [splitVal, feature]);

  const metrics = useMemo(() => {
    const getPurity = (leaf: typeof DATA_POINTS) => { if (leaf.length === 0) return 0; const aCount = leaf.filter(p => p.label === 'A').length; return (Math.max(aCount, leaf.length - aCount) / leaf.length) * 100; };
    const avgPurity = (getPurity(leftLeaf) + getPurity(rightLeaf)) / 2;
    const minorityHired = DATA_POINTS.filter(p => p.group === 'Minority' && (feature === 'X' ? p.x > splitVal : p.y > splitVal)).length;
    const minorityTotal = DATA_POINTS.filter(p => p.group === 'Minority').length;
    return { avgPurity, disparateImpact: isBiasPhase ? (1 - (minorityHired / minorityTotal)) * 100 : 0 };
  }, [leftLeaf, rightLeaf, isBiasPhase, splitVal, feature]);

  const analysis = useMemo(() => {
    if (isBiasPhase && metrics.disparateImpact > 60) return { label: 'Systemic Bias Detected', color: 'text-rose-600', desc: 'The model is using this feature as a proxy to exclude a specific demographic, regardless of merit.' };
    if (metrics.avgPurity > 85) return { label: 'High Information Gain', color: 'text-emerald-600', desc: 'The split creates highly pure leaf nodes, maximizing the signal in the data.' };
    return { label: 'Suboptimal Split', color: 'text-amber-600', desc: 'The current threshold leaves significant impurity in the resulting branches.' };
  }, [metrics, isBiasPhase]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setIsGeminiLoading(true);
      const params = `Feature: ${feature}, Threshold: ${splitVal}, Purity: ${metrics.avgPurity.toFixed(0)}%, Impact: ${metrics.disparateImpact.toFixed(0)}%`;
      const res = await getMicroExplanation("Decision Trees", params);
      setGeminiDesc(res);
      setIsGeminiLoading(false);
    }, 1500);
    return () => clearTimeout(debounceTimer.current);
  }, [feature, splitVal, metrics.avgPurity, metrics.disparateImpact]);

  const handleTourNext = () => {
    audioService.play('click');
    if (activeTourIndex < TOUR_STEPS.length - 1) setActiveTourIndex(prev => prev + 1);
    else onTourClose?.();
  };

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative transition-all duration-700">
      {isTourActive && <GuidanceTooltip message={TOUR_STEPS[activeTourIndex].message} position={TOUR_STEPS[activeTourIndex].position} onNext={handleTourNext} onClose={() => onTourClose?.()} isLast={activeTourIndex === TOUR_STEPS.length - 1} />}
      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div><h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4><div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div></div>
        <div className="flex space-x-12 text-right"><div><div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Node Purity</div><div className="text-2xl font-mono font-bold tabular-nums">{metrics.avgPurity.toFixed(0)}%</div></div>{isBiasPhase && <div className="animate-in slide-in-from-right-4 duration-500"><div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-rose-300 mb-2">Disparate Impact</div><div className="text-2xl font-mono font-bold tabular-nums text-rose-600">{metrics.disparateImpact.toFixed(0)}%</div></div>}</div>
      </div>
      <div className="relative w-full h-[320px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
        
        {/* Color Legend */}
        <div className="absolute top-4 right-4 z-30 bg-white/90 backdrop-blur-sm border border-black/5 p-3 flex flex-col space-y-2 shadow-sm pointer-events-none">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-[#2A4D69] rotate-45 border border-white/50" />
            <span className="font-mono text-[8px] font-bold uppercase tracking-widest text-[#666]">Class Alpha</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-[#E11D48] rotate-45 border border-white/50" />
            <span className="font-mono text-[8px] font-bold uppercase tracking-widest text-[#666]">Class Beta</span>
          </div>
        </div>

        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 500" preserveAspectRatio="none">
          <g stroke="#F0F0F0" strokeWidth="1">
            {Array.from({length: 6}).map((_, i) => <React.Fragment key={i}>
              <line x1={i * 100} y1="0" x2={i * 100} y2="500" />
              <line x1="0" y1={i * 100} x2="500" y2={i * 100} />
            </React.Fragment>)}
          </g>
          {isBiasPhase && feature === 'Y' && <rect x="0" y="300" width="500" height="200" fill="#E11D48" fillOpacity="0.05" className="animate-pulse" />}
          
          {/* Split Line */}
          <line 
            x1={feature === 'X' ? splitVal : 0} 
            y1={feature === 'Y' ? splitVal : 0} 
            x2={feature === 'X' ? splitVal : 500} 
            y2={feature === 'Y' ? splitVal : 500} 
            stroke="#121212" 
            strokeWidth="2" 
            strokeDasharray="8,4" 
            className="transition-all duration-300 opacity-40" 
          />

          {/* Threshold Label */}
          <text
            x={feature === 'X' ? splitVal + 10 : 10}
            y={feature === 'Y' ? splitVal - 10 : 20}
            className="font-mono text-[10px] font-bold fill-[#121212] opacity-50 select-none transition-all duration-300"
          >
            Threshold: {splitVal}
          </text>

          {/* Region Labels */}
          <text
            x={feature === 'X' ? (splitVal / 2) : 250}
            y={feature === 'Y' ? (splitVal / 2) : 480}
            textAnchor="middle"
            className="font-mono text-[8px] font-bold uppercase tracking-widest fill-[#CCC] select-none transition-all duration-300"
          >
            {feature === 'X' ? `X ≤ ${splitVal}` : `Y ≤ ${splitVal}`}
          </text>
          <text
            x={feature === 'X' ? (splitVal + (500 - splitVal) / 2) : 250}
            y={feature === 'Y' ? (splitVal + (500 - splitVal) / 2) : 20}
            textAnchor="middle"
            className="font-mono text-[8px] font-bold uppercase tracking-widest fill-[#CCC] select-none transition-all duration-300"
          >
            {feature === 'X' ? `X > ${splitVal}` : `Y > ${splitVal}`}
          </text>
        </svg>

        {/* X Axis Label */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="font-mono text-[8px] font-bold text-[#CCC] uppercase tracking-[0.4em]">Feature X Domain</span>
        </div>
        {/* Y Axis Label */}
        <div className="absolute top-1/2 left-2 -translate-y-1/2 -rotate-90 origin-left pointer-events-none">
          <span className="font-mono text-[8px] font-bold text-[#CCC] uppercase tracking-[0.4em]">Feature Y Domain</span>
        </div>

        <div className="absolute inset-0 pointer-events-none">{DATA_POINTS.map((p, i) => <div key={i} className={`absolute w-3 h-3 rotate-45 border border-white/50 shadow-sm transition-all duration-500 ${p.label === 'A' ? 'bg-[#2A4D69]' : 'bg-[#E11D48]'}`} style={{ left: `${(p.x / 500) * 100}%`, top: `${(p.y / 500) * 100}%`, transform: 'translate(-50%, -50%) rotate(45deg)' }}>{isBiasPhase && p.group === 'Minority' && <div className="absolute inset-[-6px] rounded-full border border-[#D4A017] border-dashed animate-spin-slow pointer-events-none" />}</div>)}</div>
      </div>
      <div className={`w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8 transition-all duration-700 ${isIntro ? 'opacity-20 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'}`}>
        <div className="space-y-6"><div className="grid grid-cols-2 gap-4"><button onClick={() => { setFeature('X'); audioService.play('click'); markInteraction(); }} className={`py-3 text-[10px] font-mono font-bold uppercase tracking-widest border transition-all ${feature === 'X' ? 'bg-[#121212] text-white border-[#121212]' : 'border-black/5 text-[#999]'}`}>{isBiasPhase ? 'Experience (X)' : 'Feature X'}</button><button onClick={() => { setFeature('Y'); audioService.play('click'); markInteraction(); }} className={`py-3 text-[10px] font-mono font-bold uppercase tracking-widest border transition-all ${feature === 'Y' ? 'bg-[#121212] text-white border-[#121212]' : 'border-black/5 text-[#999]'}`}>{isBiasPhase ? 'Demographic (Y)' : 'Feature Y'}</button></div><div><div className="flex justify-between mb-3"><label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Split Threshold</label><span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-3 py-1 border border-black/5 rounded shadow-sm">{splitVal} units</span></div><input type="range" min="50" max="450" step="5" value={splitVal} onChange={(e) => { setSplitVal(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px bg-black/10 rounded-full appearance-none cursor-pointer accent-[#2A4D69]" /></div></div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5 min-h-[140px] flex flex-col justify-center">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#999] mb-3">Model Analysis</h5>
          <p className="text-xs text-[#444] leading-relaxed italic font-serif mb-4">"{analysis.desc}"</p>
          <div className="pt-4 border-t border-black/5">
            <span className="text-[8px] font-mono font-bold text-[#2A4D69] uppercase tracking-widest block mb-1">Neural Insight</span>
            <p className="text-[11px] text-[#2A4D69] font-serif italic">
              {isGeminiLoading ? 'Pruning...' : `"${geminiDesc}"`}
            </p>
          </div>
        </div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onNext?.(); }} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 px-10 font-bold uppercase tracking-[0.3em] text-sm transition-all shadow-xl flex items-center justify-center group ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>{nextLabel || 'Advance Manuscript'}<svg className="ml-4 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></button>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-spin-slow { animation: spin-slow 12s linear infinite; transform-origin: center; }`}} />
    </div>
  );
};

export default DecisionTreeSim;
