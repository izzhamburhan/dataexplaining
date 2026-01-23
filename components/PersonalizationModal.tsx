
import React, { useState } from 'react';
import { UserContext } from '../types';
import { audioService } from '../services/audioService';

const PersonalizationVisualizer: React.FC<{ data: UserContext }> = ({ data }) => {
  const isRoleActive = data.role.length > 0;
  const isIndustryActive = data.industry.length > 0;
  const isGoalsActive = data.goals.length > 0;
  const isConstraintsActive = data.constraints.length > 0;

  // Calculate "Activity Level" for the telemetry bar
  const activeCount = [isRoleActive, isIndustryActive, isGoalsActive, isConstraintsActive].filter(Boolean).length;

  return (
    <div className="w-full h-full relative flex items-center justify-center bg-[#FDFCFB] overflow-hidden">
      {/* Editorial Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#121212 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* The Identity Sequence Visualization */}
      <div className="relative w-full h-full z-10 flex items-center justify-center">
        <img 
          src="https://github.com/user-attachments/assets/8107962b-cf3f-40e7-81ef-a54d6ef337ea" 
          alt="Identity Visualization" 
          className="w-full h-full object-cover opacity-85 grayscale hover:grayscale-0 transition-all duration-1000 mix-blend-multiply"
          onError={(e) => {
            // Fallback if the asset fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
        {/* Subtle noise/texture overlay for the editorial look */}
        <div className="absolute inset-0 bg-[#FDFCFB]/5 pointer-events-none mix-blend-overlay" />
      </div>

      {/* Identity Telemetry Labels */}
      <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end pointer-events-none z-20">
        <div className="space-y-1">
          <span className="block font-mono text-[7px] text-[#BBB] uppercase tracking-[0.2em]">Neural Sequence Mapping</span>
          <div className="flex space-x-1.5">
            {Array.from({length: 4}).map((_, i) => (
              <div key={i} className={`w-3 h-0.5 ${activeCount > i ? 'bg-[#121212]' : 'bg-black/5'} transition-colors duration-500`} />
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

interface Props {
  initialData: UserContext | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UserContext) => void;
  onClear: () => void;
}

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
        {/* LEFT PANEL: THE VISUALIZER */}
        <div className="w-full md:w-1/2 bg-[#F9F8F6] relative flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-black/5 overflow-hidden">
          <div className="absolute top-8 left-8 z-20">
            <span className="font-mono text-[8px] font-bold text-[#CCC] uppercase tracking-[0.4em] block mb-1">Identity_Synthesis</span>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-[#2A4D69] rounded-full animate-ping" />
              <span className="font-mono text-[7px] font-bold text-[#AAA] uppercase tracking-widest">Active Link</span>
            </div>
          </div>

          <div className="w-full h-full">
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
