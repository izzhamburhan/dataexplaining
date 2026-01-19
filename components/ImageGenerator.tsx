
import React, { useState } from 'react';
import { generateModelImage, generateModelDescription } from '../services/geminiService';
import { audioService } from '../services/audioService';

interface Props {
  modelName: string;
}

const ImageGenerator: React.FC<Props> = ({ modelName }) => {
  const [size, setSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    audioService.play('blip');

    try {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        setError("API_KEY_REQUIRED");
        setIsLoading(false);
        return;
      }

      const [url, desc] = await Promise.all([
        generateModelImage(modelName, size),
        generateModelDescription(modelName)
      ]);

      setImageUrl(url);
      setDescription(desc);
      audioService.play('success');
    } catch (err: any) {
      if (err.message === "API_KEY_ERROR") {
        setError("API_KEY_REQUIRED");
      } else {
        setError("Failed to visualize. Please check your project billing or try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openKeyPicker = async () => {
    await (window as any).aistudio.openSelectKey();
    setError(null);
    handleGenerate();
  };

  const renderFormattedText = (text: string | null) => {
    if (!text) return null;
    
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = text.split(boldRegex);
    
    return (
      <div className="whitespace-pre-wrap">
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            return <strong key={index} className="font-bold text-[#121212]">{part}</strong>;
          }
          return part;
        })}
      </div>
    );
  };

  const getDescriptionPreview = (text: string | null) => {
    if (!text) return "";
    return text.replace(/\*\*/g, "");
  };

  return (
    <div className="mt-8 pt-8 border-t border-black/5">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">
            Roman Art Visualization
          </label>
          <div className="flex space-x-2">
            {(['1K', '2K', '4K'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`text-[8px] font-mono font-bold px-2 py-0.5 border rounded transition-all ${
                  size === s ? 'bg-[#121212] text-white border-[#121212]' : 'bg-white text-[#999] border-black/5 hover:border-black/20'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full bg-[#F9F8F6] border border-black/10 hover:border-[#2A4D69] text-[#2A4D69] py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <span className="animate-pulse">Synthesizing Imagery...</span>
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Visualize Real-World Application</span>
            </>
          )}
        </button>

        {error === "API_KEY_REQUIRED" && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded">
            <p className="text-[10px] text-rose-700 font-medium leading-relaxed mb-3">
              This feature requires a paid Gemini API key. Please select a key from a project with billing enabled.
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="ml-1 underline">Documentation</a>
            </p>
            <button
              onClick={openKeyPicker}
              className="w-full py-2 bg-rose-600 text-white text-[9px] font-bold uppercase tracking-widest hover:bg-rose-700 transition-colors"
            >
              Select API Key
            </button>
          </div>
        )}

        {error && error !== "API_KEY_REQUIRED" && (
          <p className="text-[10px] text-rose-600 italic">{error}</p>
        )}

        {isLoading && (
          <div className="p-4 bg-slate-50 border border-slate-100 italic text-[10px] text-slate-500 text-center animate-in fade-in duration-700">
            "Deep in the digital archives, we are rendering your model as a Roman masterpiece..."
          </div>
        )}

        {imageUrl && !isLoading && (
          <div className="mt-4 group relative overflow-hidden border border-black/5 shadow-2xl animate-in zoom-in-95 duration-500 rounded-sm">
            <img 
              src={imageUrl} 
              alt={`${modelName} Application`} 
              className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-700 cursor-pointer"
              onClick={() => { setIsModalOpen(true); audioService.play('click'); }}
            />
            <div 
              onClick={() => { setIsModalOpen(true); audioService.play('click'); }}
              className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-start justify-end p-8 cursor-pointer backdrop-blur-[2px]"
            >
              <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 w-full">
                <h4 className="text-white font-serif italic text-2xl mb-2 border-b border-white/10 pb-2">
                  Prophecy of the {modelName}
                </h4>
                <p className="text-white/70 font-serif text-[11px] leading-relaxed italic line-clamp-3 mb-4">
                  {getDescriptionPreview(description)}
                </p>
                <div className="flex items-center space-x-2">
                   <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                   <span className="text-white font-mono text-[8px] uppercase tracking-[0.4em]">
                     Full Manuscript →
                   </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && imageUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-[#121212]/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div 
            className="relative bg-[#FDFCFB] max-w-6xl w-full h-[90vh] shadow-[0_50px_100px_rgba(0,0,0,0.6)] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 z-50 p-2 bg-[#121212]/5 hover:bg-[#121212]/10 text-[#121212] rounded-full transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Left Column: Image Area (Full Use) */}
            <div className="w-full md:w-[55%] bg-[#000] flex items-center justify-center relative group md:h-full shrink-0">
              <img 
                src={imageUrl} 
                alt={`${modelName} Prophecy`} 
                className="w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-all duration-1000"
              />
              <div className="absolute bottom-6 left-6 flex items-center space-x-3 bg-black/40 backdrop-blur-md px-4 py-2 border border-white/10 rounded-sm">
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div>
                <span className="text-[8px] font-mono text-white uppercase tracking-[0.3em]">Neural Frame Captured</span>
              </div>
            </div>

            {/* Right Column: Context/Description (Fixed Header/Footer, Scrollable Body) */}
            <div className="w-full md:w-[45%] flex flex-col bg-[#FDFCFB] border-l border-black/5 h-full overflow-hidden">
              {/* Header (Fixed) */}
              <div className="p-8 md:p-12 pb-6 shrink-0 bg-[#FDFCFB] border-b border-black/[0.03]">
                <span className="font-mono text-[10px] font-bold text-[#CCC] uppercase tracking-[0.5em] block mb-4">Historical Fragment</span>
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-serif italic text-[#121212] leading-tight mb-4">
                  Prophecy of the {modelName}
                </h3>
                <div className="w-16 h-0.5 bg-[#2A4D69]"></div>
              </div>

              {/* Scrollable Description Body */}
              <div className="flex-grow min-h-0 overflow-y-auto px-8 md:px-12 py-10 custom-scrollbar bg-[#FDFCFB]">
                <div className="space-y-6">
                  <label className="font-mono text-[9px] font-bold text-[#AAA] uppercase tracking-[0.3em] block border-b border-black/5 pb-2">Future Real-World Insight</label>
                  <div className="text-base md:text-lg font-serif leading-[1.8] text-[#333] italic">
                    {renderFormattedText(description) || "The algorithm is eternal, its applications manifold across the empires of time."}
                  </div>
                </div>
              </div>

              {/* Footer (Fixed) */}
              <div className="p-8 md:px-12 md:py-8 shrink-0 bg-[#F9F8F6] border-t border-black/5">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-mono text-[7px] text-[#BBB] uppercase tracking-widest mb-1">Asset Fidelity</span>
                    <span className="font-mono text-[10px] font-bold text-[#121212]">{size} Neural Render</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="font-mono text-[7px] text-[#BBB] uppercase tracking-widest mb-1">Aethelgard Engine</span>
                    <span className="font-mono text-[10px] font-bold text-[#2A4D69]">Gemini 3 Pro</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 -z-10" onClick={() => setIsModalOpen(false)}></div>
          
          <style dangerouslySetInnerHTML={{ __html: `
            .custom-scrollbar::-webkit-scrollbar {
              width: 5px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #FDFCFB;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #E5E5E5;
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #D4D4D4;
            }
          `}} />
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;
