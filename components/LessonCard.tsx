
import React from 'react';
import { Lesson } from '../types';

interface Props {
  lesson: Lesson;
  onClick: () => void;
}

const LessonCard: React.FC<Props> = ({ lesson, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="cursor-pointer group flex flex-col h-full bg-white border border-black/5 p-8 transition-all hover:shadow-[0_20px_60px_rgba(0,0,0,0.05)] hover:border-black/10"
    >
      <div className="mb-6 flex items-center justify-between border-b border-black/5 pb-2">
        <span className="text-[10px] font-mono font-bold tracking-widest text-[#999] uppercase">{lesson.category}</span>
        <span className="text-[9px] font-mono font-bold uppercase text-[#CCC]">{lesson.difficulty}</span>
      </div>

      <div className="w-full aspect-video bg-[#FDFCFB] border border-black/[0.03] mb-8 flex items-center justify-center p-10 group-hover:bg-white transition-colors duration-500 overflow-hidden">
        <div className="w-24 h-24 text-[#121212] group-hover:text-[#2A4D69] transition-all duration-700 transform group-hover:scale-110">
          {lesson.icon}
        </div>
      </div>
      
      <h3 className="text-2xl font-serif italic mb-4 text-[#121212] group-hover:text-[#2A4D69] transition-colors leading-tight">
        {lesson.title}
      </h3>
      
      <p className="text-sm text-[#666] font-normal leading-relaxed mb-8 flex-grow">
        {lesson.shortDescription}
      </p>
      
      <div className="flex items-center text-[10px] font-bold uppercase tracking-[0.3em] text-[#121212] pt-4 border-t border-black/5 group-hover:border-[#2A4D69] transition-colors">
        Begin Inquiry
        <svg className="ml-3 w-3 h-3 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </div>
  );
};

export default LessonCard;
