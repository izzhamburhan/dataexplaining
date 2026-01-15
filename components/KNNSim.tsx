
import React, { useState, useMemo, useEffect } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

const INITIAL_POINTS = [
  { x: 50, y: 50, type: 'A' }, { x: 80, y: 120, type: 'A' }, { x: 120, y: 70, type: 'A' },
  { x: 350, y: 300, type: 'B' }, { x: 420, y: 280, type: 'B' }, { x: 380, y: 350, type: 'B' },
  { x: 100, y: 300, type: 'A' }, { x: 300, y: 100, type: 'B' }
];

interface Props {
  adjustment?: { parameter: string; value: number } | null;
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
}

const KNNSim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel }) => {
  const [testPoint, setTestPoint] = useState<{ x: number, y: number } | null>(null);
  const [k, setK] = useState(3);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);

  useEffect(() => {
    if (adjustment?.parameter === 'k') {
      setK(Math.round(adjustment.value));
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

  const getDist = (p1: { x: number, y: number }, p2: { x: number, y: number }) => 
    Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);

  const neighbors = useMemo(() => {
    if (!testPoint) return [];
    return [...INITIAL_POINTS]
      .sort((a, b) => getDist(a, testPoint) - getDist(b, testPoint))
      .slice(0, k);
  }, [testPoint, k]);

  const stats = useMemo(() => {
    if (neighbors.length === 0) return { classification: null, confidence: 0 };
    const counts = neighbors.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as any);
    const label = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    const confidence = (counts[label] / k) * 100;
    return { classification: label, confidence };
  }, [neighbors, k]);

  const analysis = useMemo(() => {
    if (!testPoint) return { label: 'Awaiting Input', color: 'text-slate-300', desc: 'Click the simulation grid to classify a hypothetical point.' };
    if (stats.confidence === 100) return { label: 'Absolute Consensus', color: 'text-emerald-600', desc: 'All nearest neighbors agree. The classification is highly stable.' };
    return { label: 'Strong Majority', color: 'text-amber-600', desc: 'The model has found a dominant class.' };
  }, [testPoint, stats]);

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative">
      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Confidence Level</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{stats.confidence.toFixed(0).padStart(3, '0')}%</div>
        </div>
      </div>

      <div className="relative w-full h-[340px] bg-[#FDFCFB] border border-black/5 overflow-hidden cursor-crosshair mb-12 shadow-[inset_0_2px_10_rgba(0,0,0,0.02)]" onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setTestPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top }); audioService.play('blip'); markInteraction(); }}>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(90deg, #000 1px, transparent 1px), linear-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        {INITIAL_POINTS.map((p, i) => (
          <div key={i} className={`absolute w-3 h-3 rotate-45 border border-white/50 shadow-sm ${p.type === 'A' ? 'bg-[#2A4D69]' : 'bg-[#E11D48]'}`} style={{ left: p.x, top: p.y, transform: 'translate(-50%, -50%) rotate(45deg)' }} />
        ))}
        {testPoint && (
          <>
            <div className={`absolute w-4 h-4 rounded-full border-2 border-white shadow-lg z-20 transition-colors duration-500 ${stats.classification === 'A' ? 'bg-[#2A4D69]' : 'bg-[#E11D48]'}`} style={{ left: testPoint.x, top: testPoint.y, transform: 'translate(-50%, -50%)' }} />
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {neighbors.map((n, i) => (
                <line key={i} x1={testPoint.x} y1={testPoint.y} x2={n.x} y2={n.y} stroke={n.type === 'A' ? '#2A4D69' : '#E11D48'} strokeWidth="1" strokeDasharray="4" className="opacity-20" />
              ))}
            </svg>
          </>
        )}
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Neighborhood Scope (K)</label>
              <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 border border-black/5 rounded">{k}</span>
            </div>
            <input type="range" min="1" max="7" step="1" value={k} onChange={(e) => { setK(parseInt(e.target.value) || 1); audioService.play('click'); markInteraction(); }} className="w-full h-px bg-black/10 rounded-full appearance-none cursor-pointer accent-[#2A4D69]" />
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

export default KNNSim;
