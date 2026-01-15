
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

const DecisionTreeSim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel }) => {
  const [splitVal, setSplitVal] = useState(250);
  const [feature, setFeature] = useState<'X' | 'Y'>('X');
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);

  useEffect(() => {
    if (adjustment?.parameter === 'splitVal') {
      setSplitVal(adjustment.value);
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

  const points = useMemo(() => [
    { x: 50, y: 50, label: 'A' }, { x: 100, y: 120, label: 'A' }, { x: 150, y: 80, label: 'A' },
    { x: 400, y: 350, label: 'B' }, { x: 350, y: 420, label: 'B' }, { x: 450, y: 380, label: 'B' },
    { x: 100, y: 400, label: 'A' }, { x: 400, y: 100, label: 'B' },
    { x: 200, y: 250, label: 'A' }, { x: 300, y: 250, label: 'B' }
  ], []);

  const { leftLeaf, rightLeaf } = useMemo(() => {
    const left = points.filter(p => feature === 'X' ? p.x <= splitVal : p.y <= splitVal);
    const right = points.filter(p => feature === 'X' ? p.x > splitVal : p.y > splitVal);
    return { leftLeaf: left, rightLeaf: right };
  }, [splitVal, feature, points]);

  const getPurity = (leaf: typeof points) => {
    if (leaf.length === 0) return 0;
    const aCount = leaf.filter(p => p.label === 'A').length;
    const maxCount = Math.max(aCount, leaf.length - aCount);
    return (maxCount / leaf.length) * 100;
  };

  const avgPurity = (getPurity(leftLeaf) + getPurity(rightLeaf)) / 2;

  const analysis = useMemo(() => {
    if (avgPurity > 90) return { label: 'High Informational Gain', color: 'text-emerald-600', desc: 'The split creates highly pure leaf nodes. This threshold effectively separates the different classes.' };
    if (avgPurity > 70) return { label: 'Incomplete Separation', color: 'text-amber-600', desc: 'The groups are becoming distinct, but significant "impurity" remains. Further splits or a different threshold may be needed.' };
    return { label: 'High Structural Entropy', color: 'text-rose-600', desc: 'The classes are mixed within the leaves. This split provides very little predictive value.' };
  }, [avgPurity]);

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative">
      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Split Purity</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{avgPurity.toFixed(0).padStart(3, '0')}%</div>
        </div>
      </div>

      <div className="relative w-full h-[300px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(90deg, #000 1px, transparent 1px), linear-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        {points.map((p, i) => (
          <div key={i} className={`absolute w-2 h-2 rotate-45 border border-white/50 shadow-sm transition-opacity duration-300 ${p.label === 'A' ? 'bg-[#2A4D69]' : 'bg-[#E11D48]'}`} style={{ left: (p.x / 500) * 100 + '%', top: (p.y / 500) * 100 + '%', transform: 'translate(-50%, -50%) rotate(45deg)' }} />
        ))}
        <div className="absolute border-[#2A4D69] transition-all duration-300 pointer-events-none" style={{ left: feature === 'X' ? (splitVal / 500) * 100 + '%' : '0%', top: feature === 'Y' ? (splitVal / 500) * 100 + '%' : '0%', width: feature === 'X' ? '1px' : '100%', height: feature === 'Y' ? '1px' : '100%', borderStyle: 'dashed', borderWidth: feature === 'X' ? '0 0 0 1px' : '1px 0 0 0', opacity: 0.3 }} />
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => { setFeature('X'); audioService.play('click'); markInteraction(); }} className={`py-3 text-[10px] font-mono font-bold uppercase tracking-widest border transition-all ${feature === 'X' ? 'bg-[#121212] text-white' : 'border-black/5 text-[#999]'}`}>Dim. X</button>
            <button onClick={() => { setFeature('Y'); audioService.play('click'); markInteraction(); }} className={`py-3 text-[10px] font-mono font-bold uppercase tracking-widest border transition-all ${feature === 'Y' ? 'bg-[#121212] text-white' : 'border-black/5 text-[#999]'}`}>Dim. Y</button>
          </div>
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Split Threshold</label>
              <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{splitVal}</span>
            </div>
            <input type="range" min="50" max="450" step="10" value={splitVal} onChange={(e) => { setSplitVal(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px bg-black/10 rounded-full appearance-none cursor-pointer accent-[#2A4D69]" />
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

export default DecisionTreeSim;
