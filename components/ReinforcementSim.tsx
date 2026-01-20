
import React, { useState, useEffect, useMemo } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

interface Props {
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isTourActive?: boolean;
  onTourClose?: () => void;
}

const WALLS = [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }];
const GOAL = { x: 4, y: 4 };

const TOUR_STEPS = [
  { message: "In Reinforcement Learning, an agent explores an environment through trial and error, earning rewards (+100) or penalties (-100).", position: "top-[20%] left-[30%]" },
  { message: "The numbers and color intensity represent 'Q-Values'—the agent's estimation of how good each cell is for reaching the goal.", position: "top-[40%] left-[45%]" },
  { message: "Watch the 'Episodes' count. As the agent gains experience, it builds a stable policy and finds the shortest path autonomously.", position: "bottom-[20%] left-[10%]" }
];

const ReinforcementSim: React.FC<Props> = ({ currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [agentPos, setAgentPos] = useState({ x: 0, y: 0 });
  const [qTable, setQTable] = useState<number[][]>(Array.from({ length: 25 }, () => [0, 0, 0, 0]));
  const [isTraining, setIsTraining] = useState(false);
  const [episodes, setEpisodes] = useState(0);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);

  useEffect(() => {
    if (isTourActive) setActiveTourIndex(0);
  }, [isTourActive]);

  useEffect(() => {
    setHasActuallyInteracted(currentStep === 0);
  }, [currentStep]);

  const markInteraction = () => {
    if (!hasActuallyInteracted) {
      setHasActuallyInteracted(true);
      onInteract?.();
    }
  };

  useEffect(() => {
    let interval: any;
    if (isTraining) {
        interval = setInterval(() => {
            setAgentPos(prev => {
                const state = prev.y * 5 + prev.x, actions = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
                
                // Exploration vs Exploitation
                const actionIdx = Math.random() < 0.15 ? Math.floor(Math.random() * 4) : qTable[state].indexOf(Math.max(...qTable[state]));
                const action = actions[actionIdx];
                const nextX = Math.max(0, Math.min(4, prev.x + action.x));
                const nextY = Math.max(0, Math.min(4, prev.y + action.y));
                
                const isWall = WALLS.some(w => w.x === nextX && w.y === nextY);
                const isGoal = nextX === GOAL.x && nextY === GOAL.y;
                
                const reward = isGoal ? 100 : (isWall ? -100 : -1);
                const nextState = nextY * 5 + nextX;
                const maxNextQ = Math.max(...qTable[nextState]);
                
                // Q-Learning Update
                const newQTable = [...qTable];
                newQTable[state][actionIdx] += 0.5 * (reward + 0.9 * maxNextQ - newQTable[state][actionIdx]);
                setQTable(newQTable);
                
                if (isGoal) { 
                  audioService.play('success'); 
                  setEpisodes(e => e + 1); 
                  markInteraction(); 
                  return { x: 0, y: 0 }; 
                }
                if (isWall) { 
                  audioService.play('failure'); 
                  return prev; // Stay in place if hit a wall
                }
                return { x: nextX, y: nextY };
            });
        }, 100);
    }
    return () => clearInterval(interval);
  }, [isTraining, qTable]);

  const analysis = useMemo(() => {
    if (episodes === 0 && !isTraining) return { label: 'Policy Initialization', color: 'text-slate-300', desc: 'The agent is currently exploring randomly with zero spatial memory.' };
    if (episodes > 15) return { label: 'Converged Strategy', color: 'text-emerald-600', desc: 'The agent has built a robust Q-table. It successfully navigates the corridor without error.' };
    return { label: 'Active Exploration', color: 'text-amber-600', desc: 'The agent is updating its reward map. It has identified the negative utility of walls.' };
  }, [episodes, isTraining]);

  const handleTourNext = () => {
    audioService.play('click');
    if (activeTourIndex < TOUR_STEPS.length - 1) setActiveTourIndex(prev => prev + 1);
    else onTourClose?.();
  };

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative">
      {isTourActive && (
        <GuidanceTooltip message={TOUR_STEPS[activeTourIndex].message} position={TOUR_STEPS[activeTourIndex].position} onNext={handleTourNext} onClose={() => onTourClose?.()} isLast={activeTourIndex === TOUR_STEPS.length - 1} />
      )}
      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className={`text-2xl font-serif italic transition-colors duration-500 ${analysis.color}`}>{analysis.label}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Learning Episodes</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{episodes.toString().padStart(3, '0')}</div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 p-4 bg-[#F9F8F6] border border-black/5 relative mb-12 w-full h-[400px]">
        {Array.from({ length: 25 }).map((_, i) => {
          const x = i % 5, y = Math.floor(i / 5);
          const isWall = WALLS.some(w => w.x === x && w.y === y);
          const isGoal = x === GOAL.x && y === GOAL.y;
          const maxQ = Math.max(...qTable[i]);
          const intensity = Math.min(1, Math.max(0, (maxQ + 50) / 150));
          
          return (
            <div key={i} className={`relative flex flex-col items-center justify-center border transition-colors duration-300 ${isWall ? 'bg-[#121212]' : 'bg-white border-black/[0.03]'}`} style={{ backgroundColor: !isWall && !isGoal ? `rgba(42, 77, 105, ${intensity * 0.4})` : undefined }}>
              {!isWall && !isGoal && (
                <span className="font-mono text-[7px] text-[#999] opacity-40">{maxQ.toFixed(0)}</span>
              )}
              {isGoal && (
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 animate-pulse flex items-center justify-center text-white text-[10px]">★</div>
                  <span className="font-mono text-[7px] text-emerald-600 mt-1 uppercase font-bold tracking-widest">Goal</span>
                </div>
              )}
            </div>
          );
        })}
        
        {/* Agent Visualization */}
        <div 
          className="absolute w-1/5 h-1/5 flex items-center justify-center transition-all duration-100 pointer-events-none" 
          style={{ left: agentPos.x * 20 + '%', top: agentPos.y * 20 + '%' }}
        >
          <div className="w-10 h-10 bg-[#121212] rotate-45 border-4 border-white shadow-2xl flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-[#2A4D69]/20 animate-pulse" />
             <div className="w-1 h-1 bg-white rounded-full -rotate-45" />
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-6">
          <button onClick={() => { setIsTraining(!isTraining); audioService.play('blip'); markInteraction(); }} className="w-full py-5 text-[10px] font-bold uppercase tracking-[0.3em] bg-[#121212] text-white hover:bg-[#2A4D69] transition-all">
            {isTraining ? 'Halt Training Protocol' : 'Initiate Exploration Loop'}
          </button>
          <p className="text-[10px] text-[#666] leading-relaxed italic">The agent gains knowledge of the environment with every step, updating its internal reward map (Q-Table) based on the consequences of its actions.</p>
        </div>
        <div className="bg-[#F9F8F6] p-8 border-l-4 border-black/5">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#999] mb-4">Model intuition</h5>
          <p className="text-sm text-[#444] leading-relaxed italic font-serif">
            "{analysis.desc}"
          </p>
        </div>
      </div>

      <div className={`w-full p-8 border-2 border-dashed border-[#A5C9FF]/50 transition-all duration-500 bg-[#F9FBFF]/30 mt-4 ${hasActuallyInteracted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <button onClick={onNext} className="w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 px-10 font-bold uppercase tracking-[0.3em] text-sm transition-all shadow-xl flex items-center justify-center group">
          {nextLabel || 'Advance Manuscript'}
        </button>
      </div>
    </div>
  );
};

export default ReinforcementSim;
