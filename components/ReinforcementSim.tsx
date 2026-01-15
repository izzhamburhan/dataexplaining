
import React, { useState, useEffect, useMemo } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

interface Props {
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
}

const WALLS = [
  { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 },
  { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }
];

const ReinforcementSim: React.FC<Props> = ({ currentStep = 0, onInteract, onNext, nextLabel }) => {
  const [agentPos, setAgentPos] = useState({ x: 0, y: 0 });
  const [qTable, setQTable] = useState<number[][]>(Array.from({ length: 25 }, () => [0, 0, 0, 0]));
  const [isTraining, setIsTraining] = useState(false);
  const [episodes, setEpisodes] = useState(0);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [rewardPop, setRewardPop] = useState<{ val: string, x: number, y: number } | null>(null);

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
                const state = prev.y * 5 + prev.x;
                const actions = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
                
                // Exploration (Epsilon-greedy)
                const explore = Math.random() < 0.2;
                let actionIdx = explore ? Math.floor(Math.random() * 4) : qTable[state].indexOf(Math.max(...qTable[state]));
                
                const action = actions[actionIdx];
                const nextX = Math.max(0, Math.min(4, prev.x + action.x));
                const nextY = Math.max(0, Math.min(4, prev.y + action.y));
                
                const isWall = WALLS.some(w => w.x === nextX && w.y === nextY);
                const isGoal = nextX === 4 && nextY === 4;
                
                const reward = isGoal ? 100 : (isWall ? -100 : -1);
                
                // Q-Learning Update
                const nextState = nextY * 5 + nextX;
                const maxNextQ = Math.max(...qTable[nextState]);
                const newQTable = [...qTable];
                newQTable[state][actionIdx] += 0.5 * (reward + 0.9 * maxNextQ - newQTable[state][actionIdx]);
                setQTable(newQTable);

                if (isGoal) { 
                    audioService.play('success'); 
                    setEpisodes(e => e + 1); 
                    markInteraction(); 
                    setRewardPop({ val: '+100', x: 4, y: 4 });
                    return { x: 0, y: 0 }; 
                }
                if (isWall) { 
                    audioService.play('failure'); 
                    setRewardPop({ val: '-100', x: nextX, y: nextY });
                    return prev; 
                }
                return { x: nextX, y: nextY };
            });
        }, 80);
    }
    return () => clearInterval(interval);
  }, [isTraining, qTable]);

  useEffect(() => {
    if (rewardPop) {
      const timer = setTimeout(() => setRewardPop(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [rewardPop]);

  const learningScore = useMemo(() => {
    return Math.min(100, (episodes / 20) * 100);
  }, [episodes]);

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-4xl flex flex-col items-center select-none relative">
      <div className="w-full flex justify-between items-end mb-12 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Diagnostic Output</h4>
          <div className="text-2xl font-serif italic text-emerald-600">State-Value Policy Analysis</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Policy Stability</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{learningScore.toFixed(0)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1 p-1 bg-[#FDFCFB] border border-black/5 relative mb-12 w-full h-[380px]">
        {Array.from({ length: 25 }).map((_, i) => {
            const x = i % 5, y = Math.floor(i / 5);
            const isWall = WALLS.some(w => w.x === x && w.y === y);
            const isGoal = x === 4 && y === 4;
            const qVal = Math.max(...qTable[i]);
            return (
                <div key={i} className={`relative flex flex-col items-center justify-center transition-all ${isWall ? 'bg-[#121212]' : isGoal ? 'bg-emerald-50' : 'bg-white border-[0.5px] border-black/5'}`} style={{ backgroundColor: !isWall && !isGoal ? `rgba(42, 77, 105, ${Math.min(0.6, qVal / 100)})` : undefined }}>
                    {!isWall && !isGoal && qVal > 1 && (
                      <span className="font-mono text-[6px] text-[#2A4D69] opacity-40 font-bold">{qVal.toFixed(0)}</span>
                    )}
                    {isGoal && <span className="font-mono text-[8px] text-emerald-600 font-bold animate-pulse">REWARD</span>}
                    {isWall && <span className="font-mono text-[8px] text-white/20 font-bold">WALL</span>}
                </div>
            );
        })}
        
        {/* Agent Icon */}
        <div className="absolute w-1/5 h-1/5 flex items-center justify-center transition-all duration-100 pointer-events-none" style={{ left: agentPos.x * 20 + '%', top: agentPos.y * 20 + '%' }}>
            <div className="w-8 h-8 bg-[#121212] rotate-45 border-2 border-white shadow-lg flex items-center justify-center">
               <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
        </div>

        {/* Reward Feedback Pop */}
        {rewardPop && (
          <div className="absolute w-1/5 h-1/5 flex items-center justify-center pointer-events-none animate-out fade-out slide-out-to-top-8 duration-1000" style={{ left: rewardPop.x * 20 + '%', top: rewardPop.y * 20 + '%' }}>
             <span className={`text-xl font-mono font-bold ${rewardPop.val.includes('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
               {rewardPop.val}
             </span>
          </div>
        )}
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="space-y-6">
           <button onClick={() => { setIsTraining(!isTraining); audioService.play('blip'); markInteraction(); }} className={`w-full py-5 text-[10px] font-bold uppercase tracking-[0.3em] transition-all border ${isTraining ? 'bg-transparent border-black/10 text-[#666]' : 'bg-[#121212] border-[#121212] text-white hover:bg-[#2A4D69]'}`}>
            {isTraining ? 'Halt Training Loop' : 'Execute Policy Iteration'}
           </button>
           <button onClick={() => { setQTable(Array.from({ length: 25 }, () => [0,0,0,0])); setEpisodes(0); setAgentPos({x:0,y:0}); }} className="w-full py-2 text-[8px] font-mono text-[#CCC] hover:text-[#121212] uppercase tracking-widest border-b border-transparent hover:border-black/5 transition-all">Reset Memory Banks</button>
        </div>
        <div className="bg-[#F9F8F6] p-6 border-l-2 border-black/5">
          <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#999] mb-3">Model Analysis</h5>
          <p className="text-xs text-[#444] leading-relaxed italic">"The agent starts with zero knowledge. Every $+100$ reward from the goal 'bleeds' back into previous states. Eventually, the agent follows the trail of high Q-values like a scent to the goal."</p>
        </div>
      </div>

      <div className={`w-full p-8 border-2 border-dashed border-[#A5C9FF]/50 transition-all duration-500 bg-[#F9FBFF]/30 mt-4 ${hasActuallyInteracted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <button onClick={onNext} className="w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 px-10 font-bold uppercase tracking-[0.3em] text-sm transition-all shadow-xl flex items-center justify-center group">
          {nextLabel || 'Advance Manuscript'}
          <svg className="ml-4 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </button>
      </div>
    </div>
  );
};

export default ReinforcementSim;
