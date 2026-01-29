
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { audioService } from '../services/audioService';
import { getMicroExplanation } from '../services/geminiService';
import GuidanceTooltip from './GuidanceTooltip';

const WALLS = [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }];
const GOAL = { x: 4, y: 4 };
const HAZARDS = [{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }];

interface Props {
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isTourActive?: boolean;
  onTourClose?: () => void;
}

const TOUR_STEPS = [
  { message: "The agent (black diamond) learns by receiving rewards and penalties.", position: "top-[20%] left-[10%]" },
  { message: "The blue glows indicate 'Q-Values'. These represent the agent's memory of profitable paths.", position: "top-[45%] left-[45%]" },
  { message: "In Phase 2, adjust 'Risk Tolerance' to see if the agent dares to cross the Hazard zone.", position: "bottom-[20%] left-[30%]" },
  { message: "In Phase 3, observe how systemic costs in Zone B lead the agent to 'Redline' entire neighborhoods.", position: "bottom-[15%] left-[20%]" }
];

const ReinforcementSim: React.FC<Props> = ({ currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [agentPos, setAgentPos] = useState({ x: 0, y: 0 });
  const [qTable, setQTable] = useState<number[][]>(Array.from({ length: 25 }, () => [0, 0, 0, 0]));
  const [isTraining, setIsTraining] = useState(false);
  const [episodes, setEpisodes] = useState(0);
  const [riskTolerance, setRiskTolerance] = useState(0.5);
  const [biasSkew, setBiasSkew] = useState(0.5);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);
  const [geminiDesc, setGeminiDesc] = useState<string>('Syncing...');
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const debounceTimer = useRef<any>(null);

  const isFoundation = currentStep === 0;
  const isRiskReward = currentStep === 1;
  const isBiasLoop = currentStep === 2;

  useEffect(() => { if (isTourActive) setActiveTourIndex(0); }, [isTourActive]);
  useEffect(() => { setHasActuallyInteracted(isFoundation); setAgentPos({ x: 0, y: 0 }); setQTable(Array.from({ length: 25 }, () => [0, 0, 0, 0])); setEpisodes(0); setIsTraining(false); }, [currentStep, isFoundation]);
  const markInteraction = () => { if (!hasActuallyInteracted) { setHasActuallyInteracted(true); onInteract?.(); } };

  useEffect(() => {
    let interval: any;
    if (isTraining) {
      interval = setInterval(() => {
        setAgentPos(prev => {
          const state = prev.y * 5 + prev.x;
          const actions = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
          const actionIdx = Math.random() < 0.1 ? Math.floor(Math.random() * 4) : qTable[state].indexOf(Math.max(...qTable[state]));
          const action = actions[actionIdx];
          const nx = Math.max(0, Math.min(4, prev.x + action.x));
          const ny = Math.max(0, Math.min(4, prev.y + action.y));
          const isWall = !isBiasLoop && WALLS.some(w => w.x === nx && w.y === ny);
          const isHazard = isRiskReward && HAZARDS.some(h => h.x === nx && h.y === ny);
          const isGoal = nx === GOAL.x && ny === GOAL.y;
          let r = -1; if (isGoal) r = 100; if (isWall) r = -100; if (isHazard) r = -100 * (1 - riskTolerance); if (isBiasLoop && nx >= 3) r -= 5 * biasSkew;
          const maxNextQ = Math.max(...qTable[ny * 5 + nx]);
          const nextQ = [...qTable];
          nextQ[state][actionIdx] += 0.5 * (r + 0.9 * maxNextQ - nextQ[state][actionIdx]);
          setQTable(nextQ);
          if (isGoal) { audioService.play('success'); setEpisodes(e => e + 1); markInteraction(); return { x: 0, y: 0 }; }
          return isWall ? prev : { x: nx, y: ny };
        });
      }, 70);
    }
    return () => clearInterval(interval);
  }, [isTraining, qTable, riskTolerance, biasSkew, isRiskReward, isBiasLoop]);

  const analysis = useMemo(() => {
    if (isBiasLoop) { const zoneBUsage = qTable.slice(15).reduce((acc, row) => acc + Math.max(...row), 0); if (zoneBUsage < -10) return { label: 'Automated Redlining', color: 'text-rose-600', desc: 'The agent learned that Zone B is too "expensive" to service.' }; return { label: 'Equitable Distribution', color: 'text-slate-400', desc: 'The agent is exploring both zones relatively fairly.' }; }
    if (isRiskReward) { if (episodes > 5 && riskTolerance > 0.7) return { label: 'High-Risk Strategy', color: 'text-amber-600', desc: 'The agent is cutting through hazards to reach the goal.' }; return { label: 'Safe Navigation', color: 'text-emerald-600', desc: 'The agent is taking the long way around.' }; }
    return { label: episodes > 5 ? 'Policy Converged' : 'Agent Exploring', color: episodes > 5 ? 'text-emerald-600' : 'text-amber-600', desc: episodes > 5 ? 'The agent has found a reliable path.' : 'Building spatial memory of rewards.' };
  }, [episodes, qTable, isBiasLoop, isRiskReward, riskTolerance]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setIsGeminiLoading(true);
      const params = `Episodes: ${episodes}, Risk: ${riskTolerance.toFixed(2)}, Friction: ${biasSkew.toFixed(2)}, Status: ${analysis.label}`;
      const res = await getMicroExplanation("Reinforcement Learning", params);
      setGeminiDesc(res);
      setIsGeminiLoading(false);
    }, 1500);
    return () => clearTimeout(debounceTimer.current);
  }, [episodes, riskTolerance, biasSkew, analysis.label]);

  const handleTourNext = () => { audioService.play('click'); if (activeTourIndex < TOUR_STEPS.length - 1) setActiveTourIndex(prev => prev + 1); else onTourClose?.(); };

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-none flex flex-col items-center relative select-none transition-all duration-700">
      {isTourActive && <GuidanceTooltip message={TOUR_STEPS[activeTourIndex].message} position={TOUR_STEPS[activeTourIndex].position} onNext={handleTourNext} onClose={() => onTourClose?.()} isLast={activeTourIndex === TOUR_STEPS.length - 1} />}
      <div className="w-full flex justify-between items-end mb-10 border-b border-black/5 pb-6">
        <div><h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4><div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div></div>
        <div className="text-right flex space-x-12">{isBiasLoop && <div className="animate-in slide-in-from-right-4"><div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-rose-300 mb-2">Systemic Friction</div><div className="text-2xl font-mono font-bold tabular-nums text-rose-600">{(biasSkew * 10).toFixed(1)}x</div></div>}<div><div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Successful Trials</div><div className="text-2xl font-mono font-bold tabular-nums text-[#121212]">{episodes.toString().padStart(3, '0')}</div></div></div>
      </div>
      <div className="grid grid-cols-5 gap-1.5 p-2 bg-[#F9F8F6] border border-black/5 mb-12 w-full h-[400px] shadow-inner relative">{Array.from({ length: 25 }).map((_, i) => { const x = i % 5; const y = Math.floor(i / 5); const isWall = !isBiasLoop && WALLS.some(w => w.x === x && w.y === y); const isGoal = x === GOAL.x && y === GOAL.y; const isHazard = isRiskReward && HAZARDS.some(h => h.x === x && h.y === y); const isZoneB = isBiasLoop && x >= 3; const maxQ = Math.max(...qTable[i]); const intensity = Math.min(1, Math.max(0, (maxQ + 20) / 100)); return (<div key={i} className={`relative border border-black/[0.03] transition-all duration-300 ${isWall ? 'bg-[#121212]' : 'bg-white'}`} style={{ backgroundColor: !isWall && !isGoal ? (isHazard ? `rgba(212, 160, 23, ${0.1 + intensity * 0.4})` : isZoneB ? `rgba(225, 29, 72, ${0.05 + intensity * 0.2})` : `rgba(42, 77, 105, ${intensity * 0.4})`) : undefined }}>{isGoal && <div className="absolute inset-0 flex items-center justify-center text-emerald-600 font-mono font-bold text-[8px] tracking-widest uppercase animate-pulse">Goal</div>}{isHazard && <div className="absolute inset-0 flex items-center justify-center text-amber-600/40 font-mono font-bold text-[7px] uppercase">Hazard</div>}{isZoneB && <div className="absolute top-1 right-1 font-mono text-[6px] text-rose-300 font-bold uppercase">Zone B</div>}{agentPos.x === x && agentPos.y === y && (<div className="absolute inset-0 flex items-center justify-center z-10"><div className={`w-10 h-10 bg-[#121212] rotate-45 border-4 border-white shadow-2xl transition-all duration-75 ${isTraining ? 'scale-110' : ''}`} /></div>)}</div>); })}</div>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-8"><button onClick={() => { setIsTraining(!isTraining); audioService.play('blip'); markInteraction(); }} className={`w-full py-5 text-[11px] font-bold uppercase tracking-[0.3em] transition-all shadow-xl ${isTraining ? 'bg-transparent border border-black/10 text-[#666]' : 'bg-[#121212] text-white hover:bg-[#2A4D69]'}`}>{isTraining ? 'Halt Training' : 'Initiate Training Protocol'}</button>{isRiskReward && (<div className="animate-in fade-in slide-in-from-bottom-2"><div className="flex justify-between mb-2"><label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Risk Tolerance</label><span className="text-[10px] font-mono font-bold text-[#121212]">{riskTolerance.toFixed(2)}</span></div><input type="range" min="0" max="1" step="0.05" value={riskTolerance} onChange={(e) => { setRiskTolerance(parseFloat(e.target.value)); audioService.play('click'); }} className="w-full h-px appearance-none bg-black/10 accent-amber-500" /></div>)}{isBiasLoop && (<div className="animate-in fade-in slide-in-from-bottom-2"><div className="flex justify-between mb-2"><label className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest">Systemic Bias Skew</label><span className="text-[10px] font-mono font-bold text-rose-600">{biasSkew.toFixed(2)}</span></div><input type="range" min="0" max="1" step="0.05" value={biasSkew} onChange={(e) => { setBiasSkew(parseFloat(e.target.value)); audioService.play('click'); }} className="w-full h-px appearance-none bg-rose-100 accent-rose-500" /></div>)}</div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5 min-h-[140px] flex flex-col justify-center">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#999] mb-3">Model Analysis</h5>
          <p className="text-sm text-[#444] italic font-serif leading-relaxed mb-4">"{analysis.desc}"</p>
          <div className="pt-4 border-t border-black/5">
            <span className="text-[8px] font-mono font-bold text-[#2A4D69] uppercase tracking-widest block mb-1">Neural Insight</span>
            <p className="text-[11px] text-[#2A4D69] font-serif italic">
              {isGeminiLoading ? 'Reasoning...' : `"${geminiDesc}"`}
            </p>
          </div>
        </div>
      </div>
      <button onClick={onNext} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 font-bold uppercase tracking-[0.3em] text-xs transition-all shadow-xl flex items-center justify-center group ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>{nextLabel || 'Advance Manuscript'}<svg className="ml-4 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></button>
    </div>
  );
};

export default ReinforcementSim;
