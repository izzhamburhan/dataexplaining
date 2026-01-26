
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';
import GuidanceTooltip from './GuidanceTooltip';

interface Point3D {
  x: number;
  y: number;
  z: number;
  group?: 'A' | 'B';
}

interface Props {
  adjustment?: { parameter: string; value: number } | null;
  currentStep?: number;
  onInteract?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isTourActive?: boolean;
  onTourClose?: () => void;
}

const generatePoints = (isBias: boolean): Point3D[] => {
  const points: Point3D[] = [];
  if (isBias) {
    for (let i = 0; i < 12; i++) {
      points.push({
        x: -60 + Math.random() * 40,
        y: -60 + Math.random() * 40,
        z: -30 + Math.random() * 30,
        group: 'A'
      });
      points.push({
        x: 20 + Math.random() * 40,
        y: 20 + Math.random() * 40,
        z: 10 + Math.random() * 30,
        group: 'B'
      });
    }
  } else {
    for (let i = 0; i < 25; i++) {
      const t = (Math.random() - 0.5) * 160;
      points.push({
        x: t + (Math.random() - 0.5) * 20,
        y: t * 0.6 + (Math.random() - 0.5) * 20,
        z: t * 0.3 + (Math.random() - 0.5) * 20
      });
    }
  }
  return points;
};

const TOUR_STEPS = [
  { message: "Principal Component Analysis reduces dimensionality. Switch between 2D and 3D views to see how information is compressed.", position: "top-[15%] left-[10%]" },
  { message: "In 3D mode, click and drag to orbit. In 2D mode, we focus on a flat XY plane.", position: "top-[40%] left-[5%]" },
  { message: "The 'Axis' sliders control the direction of our projection. Find the angle where the points are most spread out.", position: "bottom-[25%] left-[10%]" },
  { message: "Red lines represent 'Residual Error'—the variance lost when we flatten the space into a single axis.", position: "top-[30%] right-[10%]" }
];

const PCASim: React.FC<Props> = ({ adjustment, currentStep = 0, onInteract, onNext, nextLabel, isTourActive, onTourClose }) => {
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');
  const [pitch, setPitch] = useState(0.3);
  const [yaw, setYaw] = useState(0.5);
  const [axisTheta, setAxisTheta] = useState(45);
  const [axisPhi, setAxisPhi] = useState(30);
  const [hasActuallyInteracted, setHasActuallyInteracted] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ x: 0, y: 0 });

  const isIntuition = currentStep === 0;
  const isLoss = currentStep === 1;
  const isBias = currentStep === 2;

  const points = useMemo(() => generatePoints(isBias), [isBias]);

  useEffect(() => { if (isTourActive) setActiveTourIndex(0); }, [isTourActive]);
  
  useEffect(() => {
    if (adjustment?.parameter === 'theta') { setAxisTheta(adjustment.value); markInteraction(); }
    if (adjustment?.parameter === 'phi') { setAxisPhi(adjustment.value); markInteraction(); }
  }, [adjustment]);

  useEffect(() => { 
    setHasActuallyInteracted(isIntuition); 
    if (isBias) {
      setAxisTheta(45);
      setAxisPhi(45);
    }
  }, [currentStep, isIntuition, isBias]);

  const markInteraction = () => { if (!hasActuallyInteracted) { setHasActuallyInteracted(true); onInteract?.(); } };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (viewMode === '2D') return; // Disable orbit in 2D mode
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragRef.current = { x: clientX, y: clientY };
    markInteraction();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const deltaX = clientX - dragRef.current.x;
      const deltaY = clientY - dragRef.current.y;
      
      setYaw(prev => prev + deltaX * 0.01);
      setPitch(prev => Math.max(-1.5, Math.min(1.5, prev - deltaY * 0.01)));
      
      dragRef.current = { x: clientX, y: clientY };
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  const project = (x: number, y: number, z: number) => {
    if (viewMode === '2D') {
      // Simple XY projection with no rotation/perspective
      return { x: x * 1.5 + 250, y: -y * 1.5 + 200, z: 0 };
    }
    
    // 3D Perspective Projection
    let x1 = x * Math.cos(yaw) - z * Math.sin(yaw);
    let z1 = x * Math.sin(yaw) + z * Math.cos(yaw);
    let y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
    let z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
    const factor = 400 / (400 + z2);
    const screenX = x1 * factor + 250;
    const screenY = -y2 * factor + 200;
    return { x: screenX, y: screenY, z: z2 };
  };

  const axisVector = useMemo(() => {
    const t = axisTheta * (Math.PI / 180);
    const p = viewMode === '2D' ? Math.PI / 2 : axisPhi * (Math.PI / 180); // In 2D, lock to XY plane (phi = 90 deg)
    return {
      x: Math.sin(p) * Math.cos(t),
      y: Math.sin(p) * Math.sin(t),
      z: Math.cos(p)
    };
  }, [axisTheta, axisPhi, viewMode]);

  const projectedData = useMemo(() => {
    let sumSqDist = 0;
    let totalVar = 0;
    const results = points.map(p => {
      // For 2D mode, we only care about the X and Y coordinates for variance calculation
      const x = p.x;
      const y = p.y;
      const z = viewMode === '2D' ? 0 : p.z;

      const dot = x * axisVector.x + y * axisVector.y + z * axisVector.z;
      const projX = dot * axisVector.x;
      const projY = dot * axisVector.y;
      const projZ = dot * axisVector.z;
      
      totalVar += (x*x + y*y + z*z);
      sumSqDist += dot * dot;
      
      return { 
        ...p, 
        projX, projY, projZ,
        screen: project(x, y, z),
        screenProj: project(projX, projY, projZ)
      };
    });
    
    if (viewMode === '3D') {
      results.sort((a, b) => b.screen.z - a.screen.z);
    }
    
    const capture = Math.min(100, (sumSqDist / (totalVar * 0.8 || 1)) * 100);
    return { results, capture };
  }, [points, axisVector, pitch, yaw, viewMode]);

  const analysis = useMemo(() => {
    if (isBias) {
      if (projectedData.capture > 80) return { label: 'Stereotype Distillation', color: 'text-rose-600', desc: 'The reduction has collapsed complexity into a discriminatory proxy. Note how groups are now perfectly separable.' };
      return { label: 'Nuanced Feature Mixing', color: 'text-slate-400', desc: 'The axis captures variation that is not purely demographic, preserving some individual nuances.' };
    }
    return {
      label: projectedData.capture > 85 ? 'Principal Component Found' : 'Information Bleed',
      color: projectedData.capture > 85 ? 'text-emerald-600' : 'text-amber-600',
      desc: projectedData.capture > 85 ? 'The chosen axis aligns with the maximum spread of the data. Information loss is minimized.' : 'The projection discarded too much variance. The residuals (red lines) show the lost information.'
    };
  }, [projectedData.capture, isBias]);

  const handleTourNext = () => {
    audioService.play('click');
    if (activeTourIndex < TOUR_STEPS.length - 1) setActiveTourIndex(prev => prev + 1);
    else onTourClose?.();
  };

  const axisLength = viewMode === '2D' ? 150 : 200;
  const axisStart = project(-axisVector.x * axisLength, -axisVector.y * axisLength, -axisVector.z * axisLength);
  const axisEnd = project(axisVector.x * axisLength, axisVector.y * axisLength, axisVector.z * axisLength);

  const toggleView = (mode: '2D' | '3D') => {
    audioService.play('click');
    setViewMode(mode);
  };

  return (
    <div className="bg-white p-12 border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.03)] w-full max-w-none flex flex-col items-center relative select-none transition-all duration-700">
      {isTourActive && (
        <GuidanceTooltip 
          message={TOUR_STEPS[activeTourIndex].message}
          position={TOUR_STEPS[activeTourIndex].position}
          onNext={handleTourNext}
          onClose={() => onTourClose?.()}
          isLast={activeTourIndex === TOUR_STEPS.length - 1}
        />
      )}
      
      <div className="w-full flex justify-between items-end mb-10 border-b border-black/5 pb-6">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">{viewMode} Dimensional Analysis</h4>
          <div className={`text-2xl font-serif italic ${analysis.color} transition-colors duration-500`}>{analysis.label}</div>
        </div>
        <div className="text-right flex space-x-12">
          {isBias && (
            <div className="animate-in slide-in-from-right-4">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-rose-300 mb-2">Proxy Clarity</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-rose-600">{(projectedData.capture * 0.9).toFixed(0)}%</div>
            </div>
          )}
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCC] mb-2">Captured Variance</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-[#2A4D69]">{projectedData.capture.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <div 
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        className={`relative w-full h-[460px] bg-[#FDFCFB] border border-black/5 overflow-hidden mb-12 shadow-inner group transition-all duration-300 ${viewMode === '3D' ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
      >
        {/* View Toggle Button */}
        <div className="absolute top-4 right-4 z-30 flex space-x-1 bg-white/80 backdrop-blur-md p-1 border border-black/5 rounded-sm shadow-sm">
          <button 
            onClick={() => toggleView('2D')}
            className={`px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-widest transition-all ${viewMode === '2D' ? 'bg-[#121212] text-white' : 'text-[#999] hover:bg-black/5'}`}
          >
            2D View
          </button>
          <button 
            onClick={() => toggleView('3D')}
            className={`px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-widest transition-all ${viewMode === '3D' ? 'bg-[#121212] text-white' : 'text-[#999] hover:bg-black/5'}`}
          >
            3D View
          </button>
        </div>

        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 400" preserveAspectRatio="xMidYMid meet">
           <g opacity="0.05">
              {viewMode === '3D' ? [-100, -50, 0, 50, 100].map(v => {
                 const p1 = project(v, -100, -100);
                 const p2 = project(v, -100, 100);
                 const p3 = project(-100, -100, v);
                 const p4 = project(100, -100, v);
                 return (
                   <React.Fragment key={v}>
                     <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#121212" strokeWidth="1" />
                     <line x1={p3.x} y1={p3.y} x2={p4.x} y2={p4.y} stroke="#121212" strokeWidth="1" />
                   </React.Fragment>
                 );
              }) : (
                <>
                  {[-150, -100, -50, 0, 50, 100, 150].map(v => (
                    <React.Fragment key={v}>
                      <line x1={v * 1.5 + 250} y1="0" x2={v * 1.5 + 250} y2="400" stroke="#121212" strokeWidth="1" />
                      <line x1="0" y1={v * 1.5 + 200} x2="500" y2={v * 1.5 + 200} stroke="#121212" strokeWidth="1" />
                    </React.Fragment>
                  ))}
                </>
              )}
           </g>

          <line x1={axisStart.x} y1={axisStart.y} x2={axisEnd.x} y2={axisEnd.y} stroke="#121212" strokeWidth="2" strokeDasharray="8,4" opacity="0.15" />

          {projectedData.results.map((p, i) => (
            <g key={i}>
              {(isLoss || isBias) && (
                <line x1={p.screen.x} y1={p.screen.y} x2={p.screenProj.x} y2={p.screenProj.y} stroke={isLoss ? "#E11D48" : "#BBB"} strokeWidth={isLoss ? "1.5" : "0.5"} strokeDasharray="2,2" className={isLoss ? "animate-pulse" : "opacity-30"} />
              )}
              <circle 
                cx={p.screen.x} cy={p.screen.y} 
                r={viewMode === '3D' ? 4 * (400 / (400 + p.screen.z)) : 4} 
                fill={isBias ? (p.group === 'A' ? '#121212' : '#E11D48') : '#CCC'} 
                opacity={isBias ? 0.3 : 0.2} 
              />
              <circle 
                cx={p.screenProj.x} cy={p.screenProj.y} 
                r={viewMode === '3D' ? 5 * (400 / (400 + p.screenProj.z)) : 5} 
                fill={isBias ? (p.group === 'A' ? '#121212' : '#E11D48') : '#2A4D69'} 
                className="shadow-xl" 
                stroke="white" strokeWidth="0.5" 
              />
            </g>
          ))}
        </svg>

        <div className="absolute top-4 left-4 flex flex-col space-y-2 pointer-events-none">
           <div className="bg-white/90 backdrop-blur-md border border-black/5 p-3 animate-in slide-in-from-left-4">
              <span className="font-mono text-[8px] font-bold text-[#CCC] uppercase tracking-widest block mb-1">Perspective Protocol</span>
              <p className="text-[9px] italic font-serif text-[#666]">
                {viewMode === '3D' ? 'Data exists in R³ Space. View is projected via perspective geometry.' : 'Orthographic XY Projection. Depth is collapsed to zero.'}
              </p>
           </div>
           {viewMode === '3D' && (
             <div className="bg-[#2A4D69]/5 backdrop-blur-md border border-[#2A4D69]/10 p-2 animate-in slide-in-from-left-4 delay-75">
                <span className="font-mono text-[7px] font-bold text-[#2A4D69] uppercase tracking-widest block">Click & Drag to Orbit</span>
             </div>
           )}
           {isBias && (
             <div className="bg-white/90 backdrop-blur-md border border-rose-100 p-3 animate-in slide-in-from-left-4 delay-150">
                <span className="font-mono text-[8px] font-bold text-rose-600 uppercase tracking-widest block mb-1">Group Isolation Audit</span>
                <p className="text-[9px] italic font-serif text-slate-500">Notice how clusters separate when projected onto the axis.</p>
             </div>
           )}
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-12 items-start mb-8">
        <div className={`space-y-6 bg-[#F9F8F6] p-6 rounded-sm border border-black/5 transition-opacity ${viewMode === '2D' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
           <span className="text-[10px] font-mono font-bold text-[#AAA] uppercase tracking-widest block mb-4">Space Navigation</span>
           <div className="space-y-4">
              <div>
                <label className="text-[8px] font-mono font-bold text-[#999] uppercase tracking-widest block mb-2">Camera Pitch</label>
                <input type="range" min="-1.5" max="1.5" step="0.01" value={pitch} onChange={(e) => setPitch(parseFloat(e.target.value))} className="w-full h-1 appearance-none bg-black/10 accent-[#121212] cursor-pointer" />
              </div>
              <div>
                <label className="text-[8px] font-mono font-bold text-[#999] uppercase tracking-widest block mb-2">Camera Yaw</label>
                <input type="range" min="-3.14" max="3.14" step="0.01" value={yaw} onChange={(e) => setYaw(parseFloat(e.target.value))} className="w-full h-1 appearance-none bg-black/10 accent-[#121212] cursor-pointer" />
              </div>
           </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          <div className={`grid grid-cols-1 ${viewMode === '3D' ? 'md:grid-cols-2' : ''} gap-8`}>
             <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Axis Orientation (θ)</label>
                  <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 rounded border border-black/5">{axisTheta}°</span>
                </div>
                <input type="range" min="0" max="360" step="1" value={axisTheta} onChange={(e) => { setAxisTheta(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-1 appearance-none bg-black/10 accent-[#2A4D69] cursor-pointer" />
             </div>
             {viewMode === '3D' && (
               <div className="animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Axis Inclination (φ)</label>
                    <span className="text-[10px] font-mono font-bold text-[#121212] bg-[#F9F8F6] px-2 py-0.5 rounded border border-black/5">{axisPhi}°</span>
                  </div>
                  <input type="range" min="0" max="180" step="1" value={axisPhi} onChange={(e) => { setAxisPhi(parseInt(e.target.value)); audioService.play('click'); markInteraction(); }} className="w-full h-1 appearance-none bg-black/10 accent-[#2A4D69] cursor-pointer" />
               </div>
             )}
          </div>
          <div className="bg-[#F9F8F6] p-6 border-l-4 border-black/5 min-h-[100px] flex items-center">
            <p className="text-[13px] text-[#444] italic font-serif leading-relaxed">"{analysis.desc}"</p>
          </div>
        </div>
      </div>

      <button onClick={onNext} className={`w-full bg-[#121212] hover:bg-[#2A4D69] text-white py-6 font-bold uppercase tracking-[0.3em] text-xs transition-all shadow-xl flex items-center justify-center group ${hasActuallyInteracted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
        {nextLabel || 'Advance Manuscript'}
        <svg className="ml-4 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </button>
    </div>
  );
};

export default PCASim;
