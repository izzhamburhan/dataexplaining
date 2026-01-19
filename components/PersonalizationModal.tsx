
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
        className="bg-white max-w-lg w-full p-10 shadow-2xl border border-black/5 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-8 border-b border-black/5 pb-6">
          <span className="font-mono text-[10px] font-bold text-[#CCC] uppercase tracking-[0.4em] block mb-2">User Protocol</span>
          <h3 className="text-3xl font-serif italic text-[#121212]">Personalize Experience</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-[9px] font-mono font-bold text-[#999] uppercase tracking-widest block mb-2">Job / Role</label>
              <input 
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                className="w-full bg-[#F9F8F6] border border-black/5 p-3 text-xs outline-none focus:border-[#2A4D69]"
                placeholder="e.g. Architect"
              />
            </div>
            <div>
              <label className="text-[9px] font-mono font-bold text-[#999] uppercase tracking-widest block mb-2">Industry</label>
              <input 
                value={formData.industry}
                onChange={e => setFormData({...formData, industry: e.target.value})}
                className="w-full bg-[#F9F8F6] border border-black/5 p-3 text-xs outline-none focus:border-[#2A4D69]"
                placeholder="e.g. Healthcare"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-mono font-bold text-[#999] uppercase tracking-widest block mb-2">Skill Level</label>
            <div className="flex space-x-2">
              {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setFormData({...formData, skillLevel: lvl})}
                  className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest border transition-all ${formData.skillLevel === lvl ? 'bg-[#121212] text-white' : 'bg-white text-[#999] border-black/5'}`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[9px] font-mono font-bold text-[#999] uppercase tracking-widest block mb-2">Primary Goals</label>
            <textarea 
              value={formData.goals}
              onChange={e => setFormData({...formData, goals: e.target.value})}
              className="w-full bg-[#F9F8F6] border border-black/5 p-3 text-xs outline-none focus:border-[#2A4D69] h-20 resize-none"
              placeholder="What do you want to learn?"
            />
          </div>

          <div>
            <label className="text-[9px] font-mono font-bold text-[#999] uppercase tracking-widest block mb-2">Constraints</label>
            <input 
              value={formData.constraints}
              onChange={e => setFormData({...formData, constraints: e.target.value})}
              className="w-full bg-[#F9F8F6] border border-black/5 p-3 text-xs outline-none focus:border-[#2A4D69]"
              placeholder="e.g. Simple math only"
            />
          </div>

          <div className="pt-6 flex space-x-4">
            <button 
              type="button"
              onClick={handleClear}
              className="flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#E11D48] border border-[#E11D48]/20 hover:bg-[#E11D48]/5 transition-all"
            >
              Clear Data
            </button>
            <button 
              type="submit"
              className="flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.2em] bg-[#121212] text-white hover:bg-[#2A4D69] transition-all"
            >
              Apply Protocol
            </button>
          </div>
        </form>
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-[#999] hover:text-[#121212]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose}></div>
    </div>
  );
};

export default PersonalizationModal;
