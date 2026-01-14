
import React, { useState, useMemo } from 'react';

const DecisionTreeSim: React.FC = () => {
  const [splitVal, setSplitVal] = useState(250);
  const [feature, setFeature] = useState<'X' | 'Y'>('X');

  // Generate 2D points for splitting
  const points = useMemo(() => [
    { x: 50, y: 50, label: 'A' }, { x: 100, y: 120, label: 'A' }, { x: 150, y: 80, label: 'A' },
    { x: 400, y: 350, label: 'B' }, { x: 350, y: 420, label: 'B' }, { x: 450, y: 380, label: 'B' },
    { x: 100, y: 400, label: 'A' }, { x: 400, y: 100, label: 'B' },
    { x: 200, y: 250, label: 'A' }, { x: 300, y: 250, label: 'B' }
  ], []);

  const { leftLeaf, rightLeaf } = useMemo(() => {
    const left = points.filter(p => feature === 'X' ? p.x <= splitVal : p.y <= splitVal);
    const right = points.filter(p => feature === 'X' ? p.x > splitVal : p.y > splitVal);
    return { leftLeaf: left, rightLeaf: right };
  }, [splitVal, feature, points]);

  const getPurity = (leaf: typeof points) => {
    if (leaf.length === 0) return 0;
    const aCount = leaf.filter(p => p.label === 'A').length;
    const maxCount = Math.max(aCount, leaf.length - aCount);
    return (maxCount / leaf.length) * 100;
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100">
      <h4 className="font-bold text-gray-800 uppercase mb-6 text-center">Interactive Decision Tree</h4>
      
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Data View */}
        <div className="relative w-full md:w-1/2 h-[300px] bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
           {points.map((p, i) => (
             <div 
               key={i} 
               className={`absolute w-3 h-3 rounded-full border border-white shadow-sm transition-opacity duration-300 ${
                 p.label === 'A' ? 'bg-emerald-500' : 'bg-indigo-500'
               }`}
               style={{ left: (p.x / 500) * 100 + '%', top: (p.y / 500) * 100 + '%' }}
             />
           ))}
           {/* Split Line */}
           <div 
             className="absolute bg-blue-500 bg-opacity-30 border-blue-600 transition-all duration-300"
             style={{
               left: feature === 'X' ? (splitVal / 500) * 100 + '%' : '0%',
               top: feature === 'Y' ? (splitVal / 500) * 100 + '%' : '0%',
               width: feature === 'X' ? '2px' : '100%',
               height: feature === 'Y' ? '2px' : '100%',
               borderStyle: 'dashed',
               borderWidth: feature === 'X' ? '0 0 0 2px' : '2px 0 0 0'
             }}
           />
        </div>

        {/* Tree Structure */}
        <div className="w-full md:w-1/2 space-y-6">
          <div className="flex flex-col items-center">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold shadow-md text-sm mb-4">
              Split on {feature} at {splitVal}
            </div>
            
            <div className="flex justify-between w-full space-x-4">
              <div className="flex-1 text-center">
                 <div className="text-[10px] font-black uppercase text-gray-400 mb-1">Left Leaf</div>
                 <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl h-24 flex flex-col justify-center">
                    <span className="text-lg font-black text-emerald-700">{leftLeaf.length}</span>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">Purity: {getPurity(leftLeaf).toFixed(0)}%</span>
                 </div>
              </div>
              <div className="flex-1 text-center">
                 <div className="text-[10px] font-black uppercase text-gray-400 mb-1">Right Leaf</div>
                 <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl h-24 flex flex-col justify-center">
                    <span className="text-lg font-black text-indigo-700">{rightLeaf.length}</span>
                    <span className="text-[10px] text-indigo-600 font-bold uppercase">Purity: {getPurity(rightLeaf).toFixed(0)}%</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
             <p className="text-xs text-gray-500 leading-relaxed italic">
               Decision trees pick splits that result in the highest <b>"Purity"</b> (or Information Gain). Move the slider to see which value best separates the green and purple dots!
             </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Split Feature</label>
          <div className="flex bg-gray-100 rounded-xl p-1">
            {['X', 'Y'].map(f => (
              <button
                key={f}
                onClick={() => setFeature(f as any)}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
                  feature === f ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'
                }`}
              >
                {f} Coordinate
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Threshold: {splitVal}</label>
          <input 
            type="range" min="50" max="450" step="10" value={splitVal} 
            onChange={(e) => setSplitVal(parseInt(e.target.value))}
            className="w-full h-2.5 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>
    </div>
  );
};

export default DecisionTreeSim;
