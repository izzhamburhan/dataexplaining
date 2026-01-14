
import React, { useState, useEffect } from 'react';

const ReinforcementSim: React.FC = () => {
  const [agentPos, setAgentPos] = useState({ x: 0, y: 0 });
  const [qTable, setQTable] = useState<number[][]>(Array.from({ length: 25 }, () => [0, 0, 0, 0])); // Up, Down, Left, Right
  const [isTraining, setIsTraining] = useState(false);
  const [episodes, setEpisodes] = useState(0);

  const goal = { x: 4, y: 4 };
  const walls = [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }];

  const resetAgent = () => setAgentPos({ x: 0, y: 0 });

  useEffect(() => {
    let interval: any;
    if (isTraining) {
        interval = setInterval(() => {
            setAgentPos(prev => {
                const state = prev.y * 5 + prev.x;
                const actions = [
                    { x: 0, y: -1, idx: 0 }, // Up
                    { x: 0, y: 1, idx: 1 },  // Down
                    { x: -1, y: 0, idx: 2 }, // Left
                    { x: 1, y: 0, idx: 3 }   // Right
                ];

                // Epsilon-greedy (high exploration for demo)
                const explore = Math.random() < 0.2;
                let actionIdx;
                if (explore) {
                    actionIdx = Math.floor(Math.random() * 4);
                } else {
                    actionIdx = qTable[state].indexOf(Math.max(...qTable[state]));
                }

                const action = actions[actionIdx];
                const nextX = Math.max(0, Math.min(4, prev.x + action.x));
                const nextY = Math.max(0, Math.min(4, prev.y + action.y));
                const nextPos = { x: nextX, y: nextY };

                const isWall = walls.some(w => w.x === nextX && w.y === nextY);
                const isGoal = nextX === goal.x && nextY === goal.y;
                const reward = isGoal ? 10 : (isWall ? -5 : -0.1);

                // Update Q-Table
                const nextState = nextY * 5 + nextX;
                const maxNextQ = Math.max(...qTable[nextState]);
                const newQTable = [...qTable];
                newQTable[state][actionIdx] += 0.5 * (reward + 0.9 * maxNextQ - newQTable[state][actionIdx]);
                setQTable(newQTable);

                if (isGoal || (isWall && Math.random() < 0.5)) {
                    setEpisodes(e => e + 1);
                    return { x: 0, y: 0 };
                }
                
                return isWall ? prev : nextPos;
            });
        }, 50);
    }
    return () => clearInterval(interval);
  }, [isTraining, qTable]);

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-gray-800 uppercase">Reinforcement Agent</h4>
        <div className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-1 rounded">Episodes: {episodes}</div>
      </div>

      <div className="grid grid-cols-5 gap-2 p-2 bg-slate-100 rounded-2xl relative shadow-inner mb-6">
        {Array.from({ length: 25 }).map((_, i) => {
            const x = i % 5;
            const y = Math.floor(i / 5);
            const isGoal = x === goal.x && y === goal.y;
            const isWall = walls.some(w => w.x === x && w.y === y);
            const qValue = Math.max(...qTable[i]);

            return (
                <div key={i} className={`h-12 flex items-center justify-center rounded-lg relative overflow-hidden transition-colors duration-300 ${
                    isGoal ? 'bg-green-500' : isWall ? 'bg-slate-800' : 'bg-white'
                }`} style={{ backgroundColor: !isGoal && !isWall ? `rgba(59, 130, 246, ${Math.min(0.4, qValue / 5)})` : undefined }}>
                    {!isWall && !isGoal && qValue > 0.1 && (
                        <span className="text-[8px] font-bold text-blue-600 opacity-30">{qValue.toFixed(1)}</span>
                    )}
                    {isGoal && <span className="text-xl">🍪</span>}
                </div>
            );
        })}
        {/* Agent */}
        <div 
            className="absolute w-12 h-12 flex items-center justify-center transition-all duration-100 pointer-events-none"
            style={{ left: agentPos.x * 56 + 8, top: agentPos.y * 56 + 8 }}
        >
            <div className="w-8 h-8 bg-blue-600 rounded-full shadow-lg flex items-center justify-center border-2 border-white">
                <span className="text-sm">🤖</span>
            </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <button 
          onClick={() => setIsTraining(!isTraining)}
          className={`flex-1 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${
            isTraining ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'
          }`}
        >
          {isTraining ? 'Stop Training' : 'Start Learning Loop'}
        </button>
        <button 
          onClick={() => { setQTable(Array.from({ length: 25 }, () => [0,0,0,0])); setEpisodes(0); resetAgent(); }}
          className="px-4 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default ReinforcementSim;
