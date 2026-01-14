
import React from 'react';
import { Lesson } from '../types';

interface Props {
  lesson: Lesson;
  onClick: () => void;
}

const LessonCard: React.FC<Props> = ({ lesson, onClick }) => {
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Beginner': return 'bg-green-100 text-green-700';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'Advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer bg-white border border-gray-200 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:border-blue-400 transform hover:-translate-y-1"
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase">{lesson.category}</span>
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getDifficultyColor(lesson.difficulty)}`}>
          {lesson.difficulty}
        </span>
      </div>
      <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">{lesson.title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{lesson.shortDescription}</p>
      <div className="mt-6 flex items-center text-blue-600 font-semibold text-sm">
        Start Lesson
        <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </div>
  );
};

export default LessonCard;
