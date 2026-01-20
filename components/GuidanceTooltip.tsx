
import React from 'react';

interface Props {
  message: string;
  position: string;
  onNext?: () => void;
  onClose: () => void;
  isLast?: boolean;
  // Optional direction prop to support different tooltip orientations used in specific simulations like Overfitting
  direction?: 'left' | 'right' | 'top' | 'bottom';
}

const GuidanceTooltip: React.FC<Props> = ({ message, position, onNext, onClose, isLast, direction }) => {
  return (
    <div className={`absolute z-[150] animate-in fade-in zoom-in duration-300 pointer-events-auto ${position}`}>
      <div className="relative bg-[#FFF9E5] border border-[#D4A017] p-5 shadow-[0_20px_60px_rgba(212,160,23,0.2)] max-w-[260px]">
        <div className="flex flex-col">
          <div className="flex items-start space-x-3 mb-4">
            <div className="w-2.5 h-2.5 bg-[#D4A017] rounded-full mt-1 animate-pulse shrink-0 shadow-[0_0_10px_rgba(212,160,23,0.5)]" />
            <span className="font-mono text-[10px] font-bold text-[#856404] leading-relaxed uppercase tracking-tight">
              {message}
            </span>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-[#D4A017]/20">
            <button 
              onClick={onClose}
              className="font-mono text-[8px] text-[#D4A017] uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
            >
              Dismiss
            </button>
            {onNext && (
              <button 
                onClick={onNext}
                className="bg-[#D4A017] text-white px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest hover:bg-[#856404] transition-colors shadow-sm"
              >
                {isLast ? 'Finish' : 'Next Tip'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidanceTooltip;
