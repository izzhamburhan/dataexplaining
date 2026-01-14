
import React, { useState } from 'react';

const RandomForestSim: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [votes, setVotes] = useState<('Apple' | 'Orange')[]>([]);

  const runForest = () => {
    setIsRunning(true);
    setVotes([]);
    let count = 0;
    const interval = setInterval(() => {
        setVotes(prev => [...prev, Math.random() > 0.4 ? 'Apple' : 'Orange']);
        count++;
        if (count >= 15) {
            clearInterval(interval);
            setIsRunning(false);
        }
    }, 100);
  };

  const finalResult = votes.length === 15 ? (votes.filter(v => v === 'Apple').length > 7 ? 'Apple' : 'Orange') : null;

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100">
      <h4 className="font-bold text-gray-800 uppercase mb-6 text-center">Ensemble Voting</h4>
      
      <div className="grid grid-cols-5 gap-3 mb-8">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className={`h-12 flex flex-col items-center justify-center rounded-lg border-2 transition-all duration-300 ${
            votes[i] ? (votes[i] === 'Apple' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200') : 'bg-gray-50 border-gray-100'
          }`}>
            <div className={`w-3 h-3 rounded-full mb-1 ${votes[i] ? (votes[i] === 'Apple' ? 'bg-red-500' : 'bg-orange-500') : 'bg-gray-200'}`} />
            <span className="text-[8px] font-bold text-gray-400">Tree {i+1}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
        {finalResult ? (
          <div className="text-center animate-in zoom-in">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Majority Verdict</p>
            <p className={`text-3xl font-black ${finalResult === 'Apple' ? 'text-red-600' : 'text-orange-600'}`}>
                {finalResult}!
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">Predicting the fruit...</p>
        )}
      </div>

      <button 
        onClick={runForest}
        disabled={isRunning}
        className="w-full mt-6 bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 transition-all shadow-lg active:scale-95"
      >
        {isRunning ? 'Gathering Votes...' : 'Classify Fruit'}
      </button>
    </div>
  );
};

export default RandomForestSim;
