
import React, { useState, useEffect } from 'react';

interface Props {
  message: string;
  position: string;
  currentStep: number;
}

const GuidanceTooltip: React.FC<Props> = ({ message, position, currentStep }) => {
  const [visible, setVisible] = useState(true);

  // Reset visibility when the step changes
  useEffect(() => {
    setVisible(true);
  }, [currentStep]);

  // Global listener to dismiss
  useEffect(() => {
    const handleDismiss = () => {
      if (visible) setVisible(false);
    };
    window.addEventListener('click', handleDismiss);
    return () => window.removeEventListener('click', handleDismiss);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={`absolute z-50 animate-in fade-in zoom-in duration-500 pointer-events-none ${position}`}>
      <div className="relative bg-[#FFF9E5] border border-[#D4A017] p-4 shadow-xl max-w-[220px]">
        <div className="flex items-start space-x-3">
          <div className="w-2 h-2 bg-[#D4A017] rounded-full mt-1.5 animate-ping shrink-0" />
          <div className="flex flex-col">
            <span className="font-mono text-[10px] font-bold text-[#856404] leading-relaxed uppercase tracking-tight">
              {message}
            </span>
            <span className="mt-2 font-mono text-[7px] text-[#D4A017] uppercase tracking-widest opacity-60">
              Click anywhere to dismiss
            </span>
          </div>
        </div>
        {/* Tooltip Arrow */}
        <div className="absolute -left-1.5 top-6 w-3 h-3 bg-[#FFF9E5] border-l border-b border-[#D4A017] rotate-45" />
      </div>
    </div>
  );
};

export default GuidanceTooltip;
