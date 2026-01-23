
import React, { useState } from 'react';
import { UserContext } from '../types';
import { audioService } from '../services/audioService';

interface Props {
  initialData: UserContext | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UserContext) => void;
  onClear: () => void;
}

const PersonalizationVisualizer: React.FC<{ data: UserContext }> = ({ data }) => {
  const isRoleActive = data.role.length > 0;
  const isIndustryActive = data.industry.length > 0;
  const isGoalsActive = data.goals.length > 0;
  const isConstraintsActive = data.constraints.length > 0;

  // Calculate "Activity Level" for animations
  const fillLevel = (Number(isRoleActive) + Number(isIndustryActive) + Number(isGoalsActive) + Number(isConstraintsActive)) / 4;

  return (
    <div className="w-full h-full relative flex items-center justify-center bg-[#FDFCFB] overflow-hidden">
      {/* Editorial Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#121212 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* The Modern Roman Bust Illustration */}
      <svg viewBox="0 0 200 240" className="w-4/5 h-4/5 z-10 transition-all duration-1000" style={{ transform: `translateY(${5 - fillLevel * 10}px)` }}>
        <defs>
          <linearGradient id="marbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDFCFB" />
            <stop offset="50%" stopColor="#F5F4F0" />
            <stop offset="100%" stopColor="#E8E6E1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Floating Architectural Fragments (Goals) */}
        {isGoalsActive && (
          <g className="animate-in fade-in duration-1000">
            <rect x="20" y="40" width="15" height="40" fill="#121212" opacity="0.05" transform="rotate(-15 20 40)">
              <animateTransform attributeName="transform" type="translate" values="0,0; 0,-10; 0,0" dur="4s" repeatCount="indefinite" />
            </rect>
            <rect x="160" y="150" width="10" height="60" fill="#121212" opacity="0.05" transform="rotate(10 160 150)">
               <animateTransform attributeName="transform" type="translate" values="0,0; 5,5; 0,0" dur="6s" repeatCount="indefinite" />
            </rect>
          </g>
        )}

        {/* The Pedestal (Skill Level) */}
        <g transform="translate(100, 210)" className="transition-all duration-700">
          <rect x="-40" y="0" width="80" height="15" fill="#E8E6E1" stroke="#121212" strokeWidth="0.5" />
          {data.skillLevel !== 'Beginner' && (
             <rect x="-50" y="15" width="100" height="10" fill="#121212" className="animate-in slide-in-from-bottom-2" />
          )}
          {data.skillLevel === 'Advanced' && (
             <g className="animate-in zoom-in">
                <line x1="-60" y1="25" x2="60" y2="25" stroke="#121212" strokeWidth="0.5" strokeDasharray="2,2" />
                <circle cx="0" cy="40" r="4" fill="#D4A017" filter="url(#glow)" />
             </g>
          )}
        </g>

        {/* The Bust - Main Classical Form */}
        <g transform="translate(100, 110)">
          {/* Shoulders */}
          <path d="M-60,80 Q-60,40 0,40 Q60,40 60,80 L60,100 L-60,100 Z" fill="url(#marbleGrad)" stroke="#121212" strokeWidth="0.75" />
          
          {/* Neck */}
          <rect x="-15" y="20" width="30" height="30" fill="url(#marbleGrad)" stroke="#121212" strokeWidth="0.75" />
          
          {/* Head / Face Silhouette */}
          <path d="M-35,-40 C-35,-80 35,-80 35,-40 C35,0 15,30 0,30 C-15,30 -35,0 -35,-40" fill="url(#marbleGrad)" stroke="#121212" strokeWidth="0.75" />

          {/* Industry Texture (Veins of Data) */}
          {isIndustryActive && (
            <g opacity="0.4" className="animate-in fade-in duration-1000">
               <path d="M-20,-60 Q-10,-40 -25,-20" fill="none" stroke="#2A4D69" strokeWidth="0.5" strokeDasharray="4,2" />
               <path d="M15,-55 Q25,-30 10,-10" fill="none" stroke="#2A4D69" strokeWidth="0.5" strokeDasharray="3,1" />
            </g>
          )}

          {/* Eyes - Geometric/Modern */}
          <g transform="translate(0, -40)">
             <rect x="-18" y="-2" width="10" height="2" fill={isRoleActive ? "#121212" : "#CCC"} className="transition-colors duration-500" />
             <rect x="8" y="-2" width="10" height="2" fill={isRoleActive ? "#121212" : "#CCC"} className="transition-colors duration-500" />
             {isIndustryActive && (
               <g filter="url(#glow)">
                 <circle cx="-13" cy="-1" r="1.5" fill="#2A4D69" />
                 <circle cx="13" cy="-1" r="1.5" fill="#2A4D69" />
               </g>
             )}
          </g>

          {/* The Laurel Wreath / Crown (Role) */}
          {isRoleActive && (
            <g className="animate-in slide-in-from-top-4 duration-700">
              <path d="M-40,-45 Q-45,-75 -20,-85" fill="none" stroke="#D4A017" strokeWidth="1.5" />
              <path d="M40,-45 Q45,-75 20,-85" fill="none" stroke="#D4A017" strokeWidth="1.5" />
              <circle cx="0" cy="-90" r="2" fill="#D4A017" />
              <line x1="-20" y1="-85" x2="20" y2="-85" stroke="#D4A017" strokeWidth="0.5" strokeDasharray="2,2" />
            </g>
          )}

          {/* Modern Wireframe Overlay (Complexity/Constraints) */}
          <g opacity={isConstraintsActive ? 0.6 : 0.05} className="transition-opacity duration-700">
            <path d="M-35,-40 L35,-40 L0,30 Z" fill="none" stroke="#121212" strokeWidth="0.25" />
            <line x1="0" y1="-75" x2="0" y2="30" stroke="#121212" strokeWidth="0.25" />
            {isConstraintsActive && (
              <circle cx="0" cy="30" r="2" fill="#121212" className="animate-pulse" />
            )}
          </g>
        </g>
      </svg>

      {/* Identity Telemetry Labels */}
      <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end pointer-events-none">
        <div className="space-y-1">
          <span className="block font-mono text-[7px] text-[#BBB] uppercase tracking-[0.2em]">Classical Form Synthesis</span>
          <div className="flex space-x-1.5">
            {Array.from({length: 4}).map((_, i) => (
              <div key={i} className={`w-3 h-0.5 ${fillLevel > i/4 ? 'bg-[#121212]' : 'bg-black/5'} transition-colors duration-500`} />
            ))}
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono text-[8px] font-bold text-[#121212] block tracking-widest">
            {data.role ? data.role.toUpperCase() : 'ANONYMOUS'}
          </span>
          <span className="font-mono text-[6px] text-[#CCC] uppercase tracking-[0.4em]">Researcher Descriptor</span>
        </div>
      </div>
    </div>
  );
};

const PersonalizationModal: React.FC<Props> = ({ initialData, isOpen, onClose, onSave, onClear }) => {
  const [formData, setFormData] = useState<UserContext>(initialData || {
    role: '',
    industry: '',
    skillLevel: 'Beginner',
    goals: '',
    constraints: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioService.play('success');
    onSave(formData);
    onClose();
  };

  const handleClear = () => {
    audioService.play('click');
    onClear();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#121212]/80 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-white max-w-5xl w-full shadow-2xl border border-black/5 animate-in zoom-in-95 duration-500 overflow-hidden flex flex-col md:flex-row min-h-[620px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT PANEL: THE "IDENTITY WEAVER" VISUALIZER */}
        <div className="w-full md:w-1/2 bg-[#F9F8F6] relative flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-black/5 overflow-hidden">
          <div className="absolute top-8 left-8 z-20">
            <span className="font-mono text-[8px] font-bold text-[#CCC] uppercase tracking-[0.4em] block mb-1">Identity_Synthesis</span>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-[#2A4D69] rounded-full animate-ping" />
              <span className="font-mono text-[7px] font-bold text-[#AAA] uppercase tracking-widest">Real-time Profiling</span>
            </div>
          </div>

          {/* DYNAMIC ILLUSTRATION CONTAINER */}
          <div className="w-full aspect-square md:aspect-auto md:h-full">
            <PersonalizationVisualizer data={formData} />
          </div>
        </div>

        {/* RIGHT PANEL: THE FORM */}
        <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center relative bg-white">
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-2 text-[#CCC] hover:text-[#121212] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="mb-10 border-b border-black/5 pb-8">
            <span className="font-mono text-[9px] font-bold text-[#CCC] uppercase tracking-[0.4em] block mb-2">Protocol Initialization</span>
            <h3 className="text-3xl font-serif italic text-[#121212]">Personalize Manuscript</h3>
            <p className="text-[11px] text-[#999] mt-2 italic font-serif leading-relaxed">Shape your identity within the compendium to receive tailored insights and scenarios.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[9px] font-mono font-bold text-[#AAA] uppercase tracking-widest block mb-2">Researcher Role</label>
                <input 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-[#F9F8F6] border border-black/5 p-4 text-xs outline-none focus:border-[#2A4D69] transition-all"
                  placeholder="e.g. Architect"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono font-bold text-[#AAA] uppercase tracking-widest block mb-2">Field of Study</label>
                <input 
                  value={formData.industry}
                  onChange={e => setFormData({...formData, industry: e.target.value})}
                  className="w-full bg-[#F9F8F6] border border-black/5 p-4 text-xs outline-none focus:border-[#2A4D69] transition-all"
                  placeholder="e.g. Healthcare"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-mono font-bold text-[#AAA] uppercase tracking-widest block mb-2">Knowledge Gradient</label>
              <div className="flex space-x-1">
                {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => {
                      setFormData({...formData, skillLevel: lvl});
                      audioService.play('click');
                    }}
                    className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-widest border transition-all ${formData.skillLevel === lvl ? 'bg-[#121212] text-white border-[#121212]' : 'bg-white text-[#999] border-black/5 hover:border-black/20'}`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[9px] font-mono font-bold text-[#AAA] uppercase tracking-widest block mb-2">Simulation Goals</label>
              <textarea 
                value={formData.goals}
                onChange={e => setFormData({...formData, goals: e.target.value})}
                className="w-full bg-[#F9F8F6] border border-black/5 p-4 text-xs outline-none focus:border-[#2A4D69] h-20 resize-none transition-all placeholder:italic"
                placeholder="Specify your primary learning objectives..."
              />
            </div>

            <div>
              <label className="text-[9px] font-mono font-bold text-[#AAA] uppercase tracking-widest block mb-2">Complexity Constraints</label>
              <input 
                value={formData.constraints}
                onChange={e => setFormData({...formData, constraints: e.target.value})}
                className="w-full bg-[#F9F8F6] border border-black/5 p-4 text-xs outline-none focus:border-[#2A4D69] transition-all"
                placeholder="e.g. Non-technical terminology"
              />
            </div>

            <div className="pt-8 flex space-x-4">
              <button 
                type="button"
                onClick={handleClear}
                className="flex-1 py-5 text-[9px] font-bold uppercase tracking-[0.3em] text-[#E11D48] border border-[#E11D48]/10 hover:bg-[#E11D48]/5 transition-all"
              >
                Clear Identity
              </button>
              <button 
                type="submit"
                className="flex-1 py-5 text-[9px] font-bold uppercase tracking-[0.3em] bg-[#121212] text-white hover:bg-[#2A4D69] transition-all shadow-xl"
              >
                Sync Profile
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose}></div>
    </div>
  );
};

export default PersonalizationModal;
