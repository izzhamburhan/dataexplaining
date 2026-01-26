
import React, { useState } from 'react';
import { generateModelImage, generateModelDescription } from '../services/geminiService';
import { audioService } from '../services/audioService';
import { UserContext } from '../types';

interface Props {
  modelName: string;
  userContext: UserContext | null;
}

const ImageGenerator: React.FC<Props> = ({ modelName, userContext }) => {
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
      const [url, desc] = await Promise.all([
        generateModelImage(modelName, '1K', userContext),
        generateModelDescription(modelName, userContext)
      ]);

      setImageUrl(url);
      setDescription(desc);
      audioService.play('success');
    } catch (err: any) {
      console.error("handleGenerate error:", err);
      setError("Failed to visualize. Please try again later.");
    } finally {
      setIsLoading(false);
    }
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
    <div className="mt-10 pt-10 border-t border-black/5">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <label className="text-[10px] font-mono font-bold text-[#AAA] uppercase tracking-[0.3em]">
              Roman Art Visualization
            </label>
            {userContext && (
              <span className="text-[7px] font-mono text-emerald-600 font-bold uppercase tracking-widest mt-1">
                ● Personalization Applied
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full bg-[#F9F8F6] border border-black/10 hover:border-[#2A4D69] text-[#2A4D69] py-3 px-2 text-[9px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-sm"
        >
          {isLoading ? (
            <span className="animate-pulse flex items-center whitespace-nowrap">
              <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-[#2A4D69]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Synthesizing Prophecy...
            </span>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="whitespace-nowrap">Visualize Real-World Application</span>
            </>
          )}
        </button>

        {error && (
          <p className="text-[10px] text-rose-600 italic animate-in fade-in duration-300 px-1">{error}</p>
        )}

        {imageUrl && !isLoading && (
          <div className="mt-2 group relative overflow-hidden border border-black/5 shadow-2xl rounded-sm">
            <img 
              src={imageUrl} 
              alt={modelName} 
              className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-700 cursor-pointer"
              onClick={() => { setIsModalOpen(true); audioService.play('click'); }}
            />
            <div 
              onClick={() => { setIsModalOpen(true); audioService.play('click'); }}
              className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-start justify-end p-8 cursor-pointer"
            >
              <h4 className="text-white font-serif italic text-2xl mb-2">Prophecy of {modelName}</h4>
              <p className="text-white/70 font-serif text-[11px] leading-relaxed italic line-clamp-2 mb-4">
                {getDescriptionPreview(description)}
              </p>
              <span className="text-white font-mono text-[8px] uppercase tracking-[0.4em]">Full Manuscript →</span>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && imageUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-[#121212]/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div 
            className="relative bg-[#FDFCFB] max-w-6xl w-full h-[85vh] shadow-[0_50px_100px_rgba(0,0,0,0.6)] flex flex-col md:flex-row overflow-hidden border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 z-50 p-2 bg-[#121212]/5 hover:bg-[#121212]/10 text-[#121212] rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="w-full md:w-[55%] h-full bg-black shrink-0 relative overflow-hidden">
              <img 
                src={imageUrl} 
                alt={modelName} 
                className="w-full h-full object-cover opacity-95 hover:opacity-100 transition-opacity duration-1000"
              />
              <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-md px-4 py-2 border border-white/10 rounded-sm">
                <span className="text-[8px] font-mono text-white uppercase tracking-[0.3em]">Prophetic Vision Rendered</span>
              </div>
            </div>

            <div className="w-full md:w-[45%] flex flex-col h-full bg-[#FDFCFB] border-l border-black/5 overflow-hidden">
              <div className="p-8 md:p-12 pb-6 shrink-0 bg-[#F9F8F6] border-b border-black/[0.03]">
                <span className="font-mono text-[9px] font-bold text-[#CCC] uppercase tracking-[0.5em] block mb-4">Historical Fragment</span>
                <h3 className="text-3xl md:text-4xl font-serif italic text-[#121212] leading-tight">
                  The {modelName}
                </h3>
              </div>

              <div className="flex-grow min-h-0 overflow-y-auto px-8 md:p-12 py-10">
                <div className="space-y-8">
                  <div className="border-l-2 border-[#2A4D69] pl-6 py-2">
                    <label className="font-mono text-[9px] font-bold text-[#AAA] uppercase tracking-[0.3em] block mb-4">Real-World Application</label>
                    <div className="text-base md:text-lg font-serif leading-[1.8] text-[#333] italic">
                      {renderFormattedText(description)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 md:px-12 md:py-8 shrink-0 bg-[#F9F8F6] border-t border-black/5">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-mono text-[7px] text-[#BBB] uppercase tracking-widest mb-1">Asset Fidelity</span>
                    <span className="font-mono text-[10px] font-bold text-[#121212]">Neural Render</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="font-mono text-[7px] text-[#BBB] uppercase tracking-widest mb-1">Aethelgard Engine</span>
                    <span className="font-mono text-[10px] font-bold text-[#2A4D69]">Gemini 2.5 Flash</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 -z-10" onClick={() => setIsModalOpen(false)}></div>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;
