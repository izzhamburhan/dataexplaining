
import React, { useState, useEffect } from 'react';

interface Candidate {
  id: number;
  name: string;
  gender: 'Male' | 'Female';
  experience: number;
  status: 'pending' | 'hired' | 'rejected';
}

const INITIAL_CANDIDATES: Candidate[] = [
  { id: 1, name: "Alex P.", gender: 'Male', experience: 65, status: 'pending' },
  { id: 2, name: "Jordan S.", gender: 'Female', experience: 95, status: 'pending' },
  { id: 3, name: "Casey R.", gender: 'Male', experience: 30, status: 'pending' },
  { id: 4, name: "Taylor L.", gender: 'Female', experience: 82, status: 'pending' }
];

interface Props {
  step: number;
}

const BiasSim: React.FC<Props> = ({ step }) => {
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Interactive parameters
  const [genderBias, setGenderBias] = useState(0.8); // 80% Male in training
  const [experienceWeight, setExperienceWeight] = useState(0.3); // How much the model "actually" looks at merit

  const runModel = () => {
    setIsProcessing(true);
    setShowResults(false);
    
    setTimeout(() => {
      setCandidates(prev => prev.map(c => {
        // Model logic influenced by parameters
        // The higher the genderBias, the more the model "cheats" for males
        const genderScore = c.gender === 'Male' ? (genderBias * 100) : ((1 - genderBias) * 100);
        const finalScore = (c.experience * experienceWeight) + (genderScore * (1 - experienceWeight));
        
        return { ...c, status: finalScore > 50 ? 'hired' : 'rejected' };
      }));
      setIsProcessing(false);
      setShowResults(true);
    }, 1200);
  };

  useEffect(() => {
    // Reset if we move between steps
    setCandidates(INITIAL_CANDIDATES);
    setShowResults(false);
  }, [step]);

  if (step === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100">
        <h4 className="text-center font-bold text-gray-800 mb-4 uppercase tracking-tight">Step 1: Configure Training Data Bias</h4>
        
        <div className="mb-8 space-y-6">
          <div>
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-blue-600">Male Hires: {(genderBias * 100).toFixed(0)}%</span>
              <span className="text-pink-500">Female Hires: {((1 - genderBias) * 100).toFixed(0)}%</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.05" 
              value={genderBias} onChange={(e) => setGenderBias(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="grid grid-cols-10 gap-1.5 p-2 bg-gray-50 rounded-lg border border-gray-100">
            {Array.from({ length: 100 }).map((_, i) => (
              <div 
                key={i} 
                className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${i < (genderBias * 100) ? 'bg-blue-500' : 'bg-pink-400 opacity-80'}`}
              />
            ))}
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-xs text-blue-800 leading-relaxed">
            <b>The Situation:</b> Your historical data is skewed. In the next step, we'll see how a model trained on this "Garbage" data makes decisions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100 max-h-[85vh] overflow-y-auto custom-scrollbar">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h4 className="font-bold text-gray-800 uppercase">Step 2: Prediction Results</h4>
          <p className="text-xs text-gray-500">How did the model weigh the variables?</p>
        </div>
        <button 
          onClick={runModel}
          disabled={isProcessing}
          className="w-full md:w-auto bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100 transition-all shrink-0"
        >
          {isProcessing ? 'Thinking...' : 'Run Prediction'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {candidates.map(c => (
          <div key={c.id} className={`p-4 rounded-2xl border-2 transition-all duration-500 relative overflow-hidden ${
            c.status === 'hired' ? 'border-green-500 bg-green-50' : 
            c.status === 'rejected' ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-white'
          }`}>
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-bold text-gray-900">{c.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                    c.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                  }`}>{c.gender}</span>
                </div>
                <div className="text-[10px] font-bold text-gray-400">EXP: {c.experience}%</div>
              </div>
              <div className="text-right">
                {c.status !== 'pending' && (
                  <span className={`text-xs font-black uppercase px-2 py-1 rounded ${
                    c.status === 'hired' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {c.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showResults && (
        <div className="mt-8 space-y-8 animate-in slide-in-from-top-4 duration-700">
          <div className="p-6 bg-slate-900 rounded-2xl text-white">
            <div className="flex justify-between items-center mb-6">
              <h5 className="font-bold text-sm uppercase tracking-widest text-slate-400">Learned Weights</h5>
              <div className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">Based on Training Data</div>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">Gender Proxy (Historical Preference)</span>
                  <span className="font-black text-indigo-400">{(genderBias * 100).toFixed(0)}% Importance</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${genderBias * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">Actual Experience/Merit</span>
                  <span className="font-black text-emerald-400">{(100 - (genderBias * 100)).toFixed(0)}% Importance</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(1 - genderBias) * 100}%` }}></div>
                </div>
              </div>
            </div>

            <p className="mt-6 text-xs text-slate-400 leading-relaxed italic border-t border-slate-800 pt-4">
              "Because the training data was biased, the model 'learned' that being <b>{genderBias > 0.5 ? 'Male' : 'Female'}</b> is a key factor for success, often ignoring real merit."
            </p>
          </div>

          <div className="border-t border-gray-100 pt-8">
            <h5 className="font-bold text-gray-800 text-lg mb-4">Real-World Impact</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <div className="flex items-center space-x-2 mb-2 text-orange-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth