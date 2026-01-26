
import React, { useState, useRef } from 'react';
import { generateEthicsDebateAudio } from '../services/geminiService';
import { audioService } from '../services/audioService';

interface Props {
  topic: string;
}

const EthicsDebate: React.FC<Props> = ({ topic }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  function decode(base64: string) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  const handleStartDebate = async () => {
    setIsLoading(true);
    audioService.play('blip');
    const base64 = await generateEthicsDebateAudio(topic);
    setIsLoading(false);

    if (base64) {
      setIsPlaying(true);
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const buffer = await decodeAudioData(decode(base64), audioContextRef.current, 24000, 1);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-black/5">
      <div className="bg-[#F9F8F6] p-6 border border-black/5 relative overflow-hidden">
        <div className="relative z-10">
          <span className="font-mono text-[8px] font-bold text-[#CCC] uppercase tracking-[0.4em] block mb-2">Ethics_Chamber_Debate</span>
          <h5 className="text-sm font-serif italic text-[#121212] mb-4">Multi-Speaker Discourse on {topic}</h5>
          
          <button 
            onClick={handleStartDebate}
            disabled={isLoading || isPlaying}
            className="w-full py-4 bg-white border border-black/10 hover:border-rose-300 text-[10px] font-bold uppercase tracking-widest text-[#121212] flex items-center justify-center space-x-3 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-pulse">Convening Council...</span>
            ) : isPlaying ? (
              <span className="flex items-center">
                <div className="flex space-x-0.5 mr-2">
                  <div className="w-0.5 h-3 bg-rose-500 animate-bounce" />
                  <div className="w-0.5 h-4 bg-rose-500 animate-bounce delay-75" />
                  <div className="w-0.5 h-2 bg-rose-500 animate-bounce delay-150" />
                </div>
                In Session
              </span>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                <span>Hear the Experts Debate</span>
              </>
            )}
          </button>
        </div>
        
        {/* Decorative background speaker icons */}
        <div className="absolute top-0 right-0 opacity-5 -translate-y-2 translate-x-2">
          <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
        </div>
      </div>
    </div>
  );
};

export default EthicsDebate;
