
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

const DATA_POINTS = [
  { x: 150, y: 100, type: 'A', group: 'Majority' }, { x: 220, y: 150, type: 'A', group: 'Majority' }, { x: 130, y: 220, type: 'A', group: 'Minority' }, { x: 180, y: 300, type: 'A', group: 'Majority' }, { x: 280, y: 120, type: 'A', group: 'Majority' }, { x: 200, y: 50, type: 'A', group: 'Majority' },
  { x: 550, y: 400, type: 'B', group: 'Majority' }, { x: 620, y: 450, type: 'B', group: 'Majority' }, { x: 720, y: 360, type: 'B', group: 'Majority' }, { x: 580, y: 250, type: 'B', group: 'Minority' }, { x: 680, y: 500, type: 'B', group: 'Minority' }, { x: 500, y: 480, type: 'B', group: 'Majority' }
];

const TOUR_STEPS = [
  { message: "SVMs seek a 'Maximum Margin'—a clear path or 'street' that separates different classes.", position: "top-[20%] left-[30%]" },
  { message: "The points touching the edge of the street are 'Support Vectors'. They are the only points that matter for the boundary.", position: "top-[45%] left-[45%]" },
  { message: "In Phase 2, we reveal how the widest 'street' can sometimes be built on top of demographic redlines.", position: "bottom-[20%] left-[15%]" }
];

const SVMSim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [slope, setSlope] = useState(0.85);
  const [margin, setMargin] = useState(30);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);
  const [geminiDesc, setGeminiDesc] = useState<string>('Syncing...');
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const debounceTimer = useRef<any>(null);

  const isIntro = currentStep === 0;
  const isBiasPhase = currentStep === 1;

  useEffect(() => { if (isTourActive) setActiveTourIndex(0); }, [isTourActive]);
  useEffect(() => {
    if (adjustment?.parameter === 'slope') { setSlope(adjustment.value); markInteraction(); }
    if (adjustment?.parameter === 'margin') { setMargin(adjustment.value); markInteraction(); }
  }, [adjustment]);
  useEffect(() => { setHasActuallyInteracted(isIntro); }, [currentStep, isIntro]);

  const markInteraction = () => { if (!hasActuallyInteracted) { setHasActuallyInteracted(true); onInteract?.(); } };

  const modelMetrics = useMemo(() => {
    const centerX = 400, centerY = 280;
    const results = DATA_POINTS.map(p => {
      const a = slope, b = -1, c = centerY - slope * centerX;
      const dist = (a * p.x + b * p.y + c) / Math.sqrt(a * a + b * b);
      const absDist = Math.abs(dist);
      return { ...p, absDist, isViolation: absDist < margin || (dist > 0 ? 'B' : 'A') !== p.type, isSupportVector: Math.abs(absDist - margin) < 15 };
    });
    const minorityPoints = results.filter(p => p.group === 'Minority');
    const minorityDenied = minorityPoints.filter(p => p.absDist > 0 && (slope * p.x + (centerY - slope * centerX) > p.y)).length;
    return { results, violations: results.filter(p => p.isViolation).length, fairnessRatio: isBiasPhase ? (minorityDenied / Math.max(1, minorityPoints.length)) * 100 : 0 };
  }, [slope, margin, isBiasPhase]);

  const analysis = useMemo(() => {
    if (isBiasPhase && modelMetrics.fairnessRatio > 60) return { label: 'Redlining Pattern', color: 'text-rose-600', desc: 'The algorithm has maximized its margin by perfectly excluding a protected group.' };
    if (modelMetrics.violations > 0) return { label: 'Boundary Conflict', color: 'text-amber-600', desc: 'Data points are breaching the street. Adjust the angle to find a clearer path.' };
    return { label: 'Optimal Margin', color: 'text-emerald-600', desc: 'The widest possible street has been found. This is the most confident divider.' };
  }, [modelMetrics.violations, modelMetrics.fairnessRatio, isBiasPhase]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setIsGeminiLoading(true);
      const params = `Slope: ${slope.toFixed(2)}, Margin: ${margin}, Violations: ${modelMetrics.violations}, Skew: ${modelMetrics.fairnessRatio.toFixed(0)}%`;
      const res = await getMicroExplanation("Support Vector Machines", params);
      setGeminiDesc(res);
      setIsGeminiLoading(false);
    }, 1500);
    return () => clearTimeout(debounceTimer.current);
  }, [slope, margin, modelMetrics.violations, modelMetrics.fairnessRatio]);

  const handleTourNext = () => {
    audioService.play('click');
    if (activeTourIndex < TOUR_STEPS.length - 1) setActiveTourIndex(prev => prev + 1);
    else onTourClose?.();
  };

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative transition-all duration-700">
      {isTourActive && <GuidanceTooltip message={TOUR_STEPS[activeTourIndex].message} position={TOUR_STEPS[activeTourIndex].position} onNext={handleTourNext} onClose={() => onTourClose?.()} isLast={activeTourIndex === TOUR_STEPS.length - 1} />}
      <div className="w-full flex justify-between items-end mb-10 border-b border-black/5 pb-6">
        <div><h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4><div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-300`}>{analysis.label}</div></div>
        <div className="flex space-x-12 text-right"><div><div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Margin Width</div><div className="text-2xl font-mono font-bold tabular-nums text-[#121212]">{margin.toString().padStart(3, '0')}</div></div>{isBiasPhase && <div className="animate-in slide-in-from-right-4 duration-500"><div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-rose-300 mb-2">Bias Skew</div><div className="text-2xl font-mono font-bold tabular-nums text-rose-600">{modelMetrics.fairnessRatio.toFixed(0)}%</div></div>}</div>
      </div>
      <div className="relative w-full h-[420px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 560" preserveAspectRatio="none"><g stroke="#F0F0F0" strokeWidth="1">{Array.from({ length: 9 }).map((_, i) => <React.Fragment key={i}><line x1={i * 100} y1="0" x2={i * 100} y2="560" /><line x1="0" y1={i * 70} x2="800" y2={i * 70} /></React.Fragment>)}</g><g transform="translate(400, 280)"><g transform={`rotate(${Math.atan(slope) * (180/Math.PI)})`}><rect x="-3000" y={-margin} width="6000" height={margin * 2} fill="rgba(42, 77, 105, 0.05)" className="transition-all duration-300" /><line x1="-3000" y1={-margin} x2="3000" y2={-margin} stroke="#AAA" strokeWidth="1" strokeDasharray="6,6" className="opacity-20" /><line x1="-3000" y1={margin} x2="3000" y2={margin} stroke="#AAA" strokeWidth="1" strokeDasharray="6,6" className="opacity-20" /><line x1="-3000" y1="0" x2="3000" y2="0" stroke="#121212" strokeWidth="2" strokeDasharray="10,5" className="opacity-30" /></g></g></svg>
        <div className="absolute inset-0 pointer-events-none">{modelMetrics.results.map((p, i) => <div key={i} className={`absolute w-3 h-3 rotate-45 border border-white/50 shadow-sm transition-all duration-500 ${p.type === 'A' ? 'bg-[#2A4D69]' : 'bg-[#E11D48]'} ${p.isViolation ? 'ring-8 ring-rose-100' : ''}`} style={{ left: `${(p.x / 800) * 100}%`, top: `${(p.y / 560) * 100}%`, transform: 'translate(-50%, -50%) rotate(45deg)' }}>{p.isSupportVector && <div className="absolute inset-[-8px] rounded-full border-2 border-[#D4A017] border-dashed animate-spin-slow" />}{isBiasPhase && p.group === 'Minority' && <div className="absolute inset-[-4px] rounded-full border border-rose-400 opacity-60 animate-ping" />}</div>)}</div>
      </div>
      <div className={`w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8 transition-all duration-700 ${isIntro ? 'opacity-20 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'}`}>
        <div className="space-y-10">
          <div><div className="flex justify-between mb-3"><label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Boundary Angle (θ)</label><span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-3 py-1 border border-black/5 rounded shadow-sm">{slope.toFixed(2)}</span></div><input type="range" min="-2.5" max="2.5" step="0.05" value={slope} onChange={(e) => { setSlope(parseFloat(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px appearance-none bg-black/10 accent-[#2A4D69] cursor-pointer" /></div>
          <div><div className="flex justify-between mb-3"><label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Margin Width</label><span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-3 py-1 border border-black/5 rounded shadow-sm">{margin} units</span></div><input type="range" min="5" max="80" step="1" value={margin} onChange={(e) => { setMargin(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-px appearance-none bg-black/10 accent-[#2A4D69] cursor-pointer" /></div>
        </div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5 min-h-[140px] flex flex-col justify-center">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#999] mb-3">Model Analysis</h5>
          <p className="text-xs text-[#444] italic font-serif leading-relaxed mb-4">"{analysis.desc}"</p>
          <div className="pt-4 border-t border-black/5">
            <span className="text-[8px] font-mono font-bold text-[#2A4D69] uppercase tracking-widest block mb-1">Neural Insight</span>
            <p className="text-[11px] text-[#2A4D69] font-serif italic">
              {isGeminiLoading ? 'Separating...' : `"${geminiDesc}"`}
            </p>
          </div>
        </div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onNext?.(); }} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 font-bold uppercase tracking-[0.3em] text-xs transition-all shadow-xl flex items-center justify-center group ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>{nextLabel || 'Advance Manuscript'}<svg className="ml-4 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></button>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-spin-slow { animation: spin-slow 18s linear infinite; transform-origin: center; }`}} />
    </div>
  );
};

export default SVMSim;
