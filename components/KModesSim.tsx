
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';
import { getMicroExplanation } from '../services/geminiService';
import GuidanceTooltip from './GuidanceTooltip';

type ColorAttr = 'teal' | 'rose' | 'gold';
type ShapeAttr = 'circle' | 'square' | 'triangle';
const COLORS: ColorAttr[] = ['teal', 'rose', 'gold'];
const SHAPES: ShapeAttr[] = ['circle', 'square', 'triangle'];
interface CategoricalPoint { id: number; color: ColorAttr; shape: ShapeAttr; }
const ATTRIBUTES: CategoricalPoint[] = [{ id: 1, color: 'teal', shape: 'circle' }, { id: 2, color: 'teal', shape: 'square' }, { id: 3, color: 'teal', shape: 'circle' }, { id: 4, color: 'rose', shape: 'triangle' }, { id: 5, color: 'rose', shape: 'triangle' }, { id: 6, color: 'rose', shape: 'circle' }, { id: 7, color: 'gold', shape: 'square' }, { id: 8, color: 'gold', shape: 'square' }, { id: 9, color: 'gold', shape: 'triangle' }, { id: 10, color: 'teal', shape: 'triangle' }, { id: 11, color: 'rose', shape: 'square' }, { id: 12, color: 'gold', shape: 'circle' }];
interface Centroid { color: ColorAttr; shape: ShapeAttr; }

interface Props {
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isTourActive?: boolean;
  onTourClose?: () => void;
  adjustment?: { parameter: string; value: number; id: number } | null;
}

const TOUR_STEPS = [
  { message: "K-Modes clusters data where features are discrete categories. Averages don't work here.", position: "top-[20%] left-[10%]" },
  { message: "Look at the dots! The '✓' and '✗' show which traits match the group leader.", position: "top-[45%] left-[45%]" },
  { message: "Hamming Distance is just the count of '✗' (mismatches). Goal: minimize the mismatches.", position: "bottom-[40%] left-[20%]" }
];

const KModesSim: React.FC<Props> = ({ currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose, adjustment }) => {
  const [centroids, setCentroids] = useState<Centroid[]>([{ color: 'rose', shape: 'square' }, { color: 'gold', shape: 'circle' }, { color: 'teal', shape: 'triangle' }]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);
  const [geminiDesc, setGeminiDesc] = useState<string>('Syncing...');
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const debounceTimer = useRef<any>(null);

  const isIntro = currentStep === 0;

  useEffect(() => { if (isTourActive) setActiveTourIndex(0); }, [isTourActive]);
  useEffect(() => { setHasActuallyInteracted(isIntro); }, [currentStep, isIntro]);
  useEffect(() => { if (adjustment?.parameter === 'color') { const nc = [...centroids]; nc[0].color = COLORS[Math.floor(adjustment.value) % COLORS.length]; setCentroids(nc); markInteraction(); } if (adjustment?.parameter === 'shape') { const nc = [...centroids]; nc[0].shape = SHAPES[Math.floor(adjustment.value) % SHAPES.length]; setCentroids(nc); markInteraction(); } }, [adjustment?.id]);
  const markInteraction = () => { if (!hasActuallyInteracted) { setHasActuallyInteracted(true); onInteract?.(); } };

  const results = useMemo(() => {
    const assignments = ATTRIBUTES.map(p => { let minDist = Infinity; let clusterIdx = 0; centroids.forEach((c, idx) => { let d = 0; if (p.color !== c.color) d++; if (p.shape !== c.shape) d++; if (d < minDist) { minDist = d; clusterIdx = idx; } }); return { ...p, clusterIdx, dist: minDist }; });
    return { assignments, totalDissimilarity: assignments.reduce((acc, p) => acc + p.dist, 0) };
  }, [centroids]);

  const toggleAttribute = (idx: number, type: 'color' | 'shape') => { markInteraction(); audioService.play('click'); const nc = [...centroids]; if (type === 'color') { nc[idx].color = COLORS[(COLORS.indexOf(nc[idx].color) + 1) % COLORS.length]; } else { nc[idx].shape = SHAPES[(SHAPES.indexOf(nc[idx].shape) + 1) % SHAPES.length]; } setCentroids(nc); };

  const runModeUpdate = () => {
    markInteraction(); audioService.play('blip'); setIsProcessing(true);
    setTimeout(() => {
      const nc = [...centroids]; let changed = false;
      for (let i = 0; i < 3; i++) {
        const group = results.assignments.filter(a => a.clusterIdx === i);
        if (group.length > 0) {
          const cCounts: any = {}; group.forEach(p => cCounts[p.color] = (cCounts[p.color] || 0) + 1); const mc = Object.keys(cCounts).reduce((a, b) => cCounts[a] > cCounts[b] ? a : b) as ColorAttr;
          const sCounts: any = {}; group.forEach(p => sCounts[p.shape] = (sCounts[p.shape] || 0) + 1); const ms = Object.keys(sCounts).reduce((a, b) => sCounts[a] > sCounts[b] ? a : b) as ShapeAttr;
          if (nc[i].color !== mc || nc[i].shape !== ms) { changed = true; } nc[i] = { color: mc, shape: ms };
        }
      }
      if (changed) audioService.play('success'); setCentroids(nc); setIsProcessing(false);
    }, 400);
  };

  const analysis = useMemo(() => {
    if (results.totalDissimilarity < 5) return { label: 'Optimal Grouping', color: 'text-emerald-600', desc: 'The leaders (Modes) match the traits of almost every item.' };
    return { label: 'High Dissimilarity', color: 'text-amber-600', desc: 'Items differ significantly from their leaders. Click update to fix.' };
  }, [results.totalDissimilarity]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setIsGeminiLoading(true);
      const params = `Dissimilarity: ${results.totalDissimilarity}, Leaders: ${centroids.length}`;
      const res = await getMicroExplanation("K-Modes Clustering", params);
      setGeminiDesc(res);
      setIsGeminiLoading(false);
    }, 1500);
    return () => clearTimeout(debounceTimer.current);
  }, [results.totalDissimilarity, centroids]);

  const renderShape = (shape: ShapeAttr, color: ColorAttr, size: string = 'w-10 h-10', opacity: string = 'opacity-100') => {
    const colorHex = { teal: '#2A4D69', rose: '#E11D48', gold: '#D4A017' }[color];
    const baseClass = `${size} ${opacity} transition-all duration-500`;
    if (shape === 'circle') return <div className={`${baseClass} rounded-full`} style={{ backgroundColor: colorHex }} />;
    if (shape === 'square') return <div className={`${baseClass}`} style={{ backgroundColor: colorHex }} />;
    return (<div className={`${baseClass} flex items-center justify-center`} style={{ color: colorHex }}><svg viewBox="0 0 100 100" className="w-full h-full fill-current"><path d="M50 10 L90 90 L10 90 Z" /></svg></div>);
  };

  const handleTourNext = () => { audioService.play('click'); if (activeTourIndex < TOUR_STEPS.length - 1) setActiveTourIndex(prev => prev + 1); else onTourClose?.(); };

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-none flex flex-col items-center relative select-none transition-all duration-700">
      {isTourActive && <GuidanceTooltip message={TOUR_STEPS[activeTourIndex].message} position={TOUR_STEPS[activeTourIndex].position} onNext={handleTourNext} onClose={() => onTourClose?.()} isLast={activeTourIndex === TOUR_STEPS.length - 1} />}
      <div className="w-full flex justify-between items-end mb-10 border-b border-black/5 pb-6">
        <div><h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Categorical Consensus</h4><div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div></div>
        <div className="text-right flex space-x-12"><div><div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Total Mismatches</div><div className="text-2xl font-mono font-bold tabular-nums text-[#121212]">{results.totalDissimilarity.toString().padStart(2, '0')}</div></div></div>
      </div>
      <div className={`w-full grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-12 p-12 bg-[#F9F8F6] border border-black/5 mb-12 shadow-inner min-h-[400px] transition-opacity duration-300 ${isProcessing ? 'opacity-40' : 'opacity-100'}`}>{results.assignments.map((p) => { const leader = centroids[p.clusterIdx]; const cm = p.color === leader.color; const sm = p.shape === leader.shape; return (<div key={p.id} className="flex flex-col items-center group relative"><div className="p-4 bg-white border-2 rounded transition-all duration-500 relative" style={{ borderColor: !isIntro ? ['#2A4D69', '#E11D48', '#D4A017'][p.clusterIdx] : 'transparent', boxShadow: !isIntro ? `0 0 0 2px #fff, 0 0 0 6px ${['#2A4D691A', '#E11D481A', '#D4A0171A'][p.clusterIdx]}` : 'none' }}>{renderShape(p.shape, p.color)}{!isIntro && (<div className="absolute -bottom-2 -right-2 flex space-x-1"><div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border ${cm ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-rose-500 text-white border-rose-400'}`}>{cm ? '✓' : '✗'}</div><div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border ${sm ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-rose-500 text-white border-rose-400'}`}>{sm ? '✓' : '✗'}</div></div>)}</div>{!isIntro && (<div className="mt-4 text-center"><span className="font-mono text-[7px] font-bold uppercase tracking-widest text-[#AAA] block">Hamming Dist</span><span className={`font-mono text-[10px] font-bold ${p.dist === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{p.dist} {p.dist === 1 ? 'Mismatch' : p.dist === 0 ? 'Perfect' : 'Mismatches'}</span></div>)}</div>); })}</div>
      <div className="w-full grid grid-cols-3 gap-8 mb-12">{centroids.map((c, i) => (<div key={i} className="flex flex-col items-center p-6 bg-white border border-black/5 rounded-sm shadow-sm relative group"><span className="font-mono text-[8px] font-bold text-[#CCC] uppercase tracking-[0.4em] mb-4">Leader (Mode) #{i+1}</span><div className="flex space-x-4 items-center"><div className={`p-3 bg-[#F9F8F6] rounded transition-transform duration-300 ${isProcessing ? 'scale-90 opacity-50' : ''}`}>{renderShape(c.shape, c.color, 'w-12 h-12')}</div><div className="flex flex-col space-y-1"><button onClick={() => toggleAttribute(i, 'color')} className="font-mono text-[9px] font-bold text-[#2A4D69] uppercase hover:underline text-left">Color: {c.color}</button><button onClick={() => toggleAttribute(i, 'shape')} className="font-mono text-[9px] font-bold text-[#666] uppercase hover:underline text-left">Shape: {c.shape}</button></div></div>{!isIntro && (<div className="absolute -top-2 -right-2 bg-[#2A4D69] text-white text-[7px] font-mono px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">Toggle Traits</div>)}</div>))}</div>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-6"><button onClick={runModeUpdate} disabled={isIntro || isProcessing} className={`w-full py-5 text-[11px] font-bold uppercase tracking-[0.3em] transition-all shadow-xl ${isIntro || isProcessing ? 'bg-[#F9F8F6] border border-black/5 text-[#CCC]' : 'bg-[#121212] text-white hover:bg-[#2A4D69]'}`}>{isProcessing ? 'Calculating Consensus Traits...' : 'Recalculate Group Leaders'}</button></div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5 min-h-[140px] flex flex-col justify-center">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#999] mb-3">Model Analysis</h5>
          <p className="text-sm text-[#444] italic font-serif leading-relaxed mb-4">"{analysis.desc}"</p>
          <div className="pt-4 border-t border-black/5">
            <span className="text-[8px] font-mono font-bold text-[#2A4D69] uppercase tracking-widest block mb-1">Neural Insight</span>
            <p className="text-[11px] text-[#2A4D69] font-serif italic">
              {isGeminiLoading ? 'Matching...' : `"${geminiDesc}"`}
            </p>
          </div>
        </div>
      </div>
      <button onClick={onNext} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 font-bold uppercase tracking-[0.3em] text-xs transition-all shadow-xl flex items-center justify-center group ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>{nextLabel || 'Advance Manuscript'}<svg className="ml-4 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></button>
    </div>
  );
};

export default KModesSim;
