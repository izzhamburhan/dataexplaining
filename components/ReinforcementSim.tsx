
import React, { useState, useEffect, useMemo } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

const WALLS = [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }];
const GOAL = { x: 4, y: 4 };

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
  { message: "The blue glows indicate 'Q-Values'. These represent the agent's memory of which paths are profitable.", position: "top-[45%] left-[45%]" },
  { message: "Initiate training and watch the agent fail initially, then slowly discover the goal through reinforcement.", position: "bottom-[20%] left-[20%]" }
];

const ReinforcementSim: React.FC<Props> = ({ currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [agentPos, setAgentPos] = useState({ x: 0, y: 0 });
  const [qTable, setQTable] = useState<number[][]>(Array.from({ length: 25 }, () => [0, 0, 0, 0]));
  const [isTraining, setIsTraining] = useState(false);
  const [episodes, setEpisodes] = useState(0);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);

  useEffect(() => { if (isTourActive) setActiveTourIndex(0); }, [isTourActive]);
  useEffect(() => { setHasActuallyInteracted(currentStep === 0); }, [currentStep]);

  const markInteraction = () => { if (!hasActuallyInteracted) { setHasActuallyInteracted(true); onInteract?.(); } };

  useEffect(() => {
    let interval: any;
    if (isTraining) {
      interval = setInterval(() => {
        setAgentPos(prev => {
          const state = prev.y * 5 + prev.x, actions = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
          const actionIdx = Math.random() < 0.15 ? Math.floor(Math.random() * 4) : qTable[state].indexOf(Math.max(...qTable[state]));
          const action = actions[actionIdx];
          const nx = Math.max(0, Math.min(4, prev.x + action.x)), ny = Math.max(0, Math.min(4, prev.y + action.y));
          const isWall = WALLS.some(w => w.x === nx && w.y === ny);
          const isGoal = nx === GOAL.x && ny === GOAL.y;
          const r = isGoal ? 100 : (isWall ? -100 : -1);
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
  }, [isTraining, qTable]);

  const analysis = useMemo(() => ({
    label: episodes > 5 ? 'Policy Converged' : 'Agent Exploring',
    color: episodes > 5 ? 'text-emerald-600' : 'text-amber-600',
    desc: episodes > 5 ? 'The agent has found a reliable path to the reward. Q-values are stabilizing.' : 'Agent is building spatial memory of the environment via trial and error.'
  }), [episodes]);

  const handleTourNext = () => {
    audioService.play('click');
    if (activeTourIndex < TOUR_STEPS.length - 1) setActiveTourIndex(prev => prev + 1);
    else onTourClose?.();
  };

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-none flex flex-col items-center relative select-none transition-all duration-700">
      {isTourActive && (
        <GuidanceTooltip 
          message={TOUR_STEPS[activeTourIndex].message}
          position={TOUR_STEPS[activeTourIndex].position}
          onNext={handleTourNext}
          onClose={() => onTourClose?.()}
          isLast={activeTourIndex === TOUR_STEPS.length - 1}
        />
      )}
      <div className="w-full flex justify-between items-end mb-10 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Successive Episodes</div>
          <div className="text-2xl font-mono font-bold tabular-nums text-[#121212]">{episodes.toString().padStart(3, '0')} Runs</div>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1.5 p-2 bg-[#F9F8F6] border border-black/5 mb-12 w-full h-[400px] shadow-inner">
        {Array.from({ length: 25 }).map((_, i) => {
          const x = i % 5, y = Math.floor(i / 5), isWall = WALLS.some(w => w.x === x && w.y === y), isGoal = x === GOAL.x && y === GOAL.y;
          const maxQ = Math.max(...qTable[i]), intensity = Math.min(1, Math.max(0, (maxQ + 20) / 100));
          return (
            <div key={i} className={`relative border border-black/[0.03] transition-all duration-300 ${isWall ? 'bg-[#121212]' : 'bg-white'}`} style={{ backgroundColor: !isWall && !isGoal ? `rgba(42, 77, 105, ${intensity * 0.4})` : undefined }}>
              {isGoal && <div className="absolute inset-0 flex items-center justify-center text-emerald-600 font-bold text-xs tracking-widest uppercase animate-pulse">Goal Reached</div>}
              {agentPos.x === x && agentPos.y === y && <div className="absolute inset-0 flex items-center justify-center"><div className="w-10 h-10 bg-[#121212] rotate-45 border-4 border-white shadow-2xl transition-all duration-75" /></div>}
            </div>
          );
        })}
      </div>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <button onClick={() => { setIsTraining(!isTraining); audioService.play('blip'); markInteraction(); }} className={`w-full py-5 text-[11px] font-bold uppercase tracking-[0.3em] transition-all shadow-xl ${isTraining ? 'bg-transparent border border-black/10 text-[#666]' : 'bg-[#121212] text-white hover:bg-[#2A4D69]'}`}>
          {isTraining ? 'Halt Agent Learning' : 'Initiate Training Protocol'}
        </button>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5 min-h-[140px] flex items-center">
          <p className="text-sm text-[#444] italic font-serif leading-relaxed">"{analysis.desc}"</p>
        </div>
      </div>
      <button onClick={onNext} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-5 font-bold uppercase tracking-[0.3em] text-xs transition-all shadow-xl ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>Advance Manuscript</button>
    </div>
  );
};

export default ReinforcementSim;
