
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

interface Props {
  activeLessonTitle: string;
  isActive: boolean;
  onClose: () => void;
}

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

function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const LiveVoiceSession: React.FC<Props> = ({ activeLessonTitle, isActive, onClose }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<any>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const [waveformData, setWaveformData] = useState<number[]>(new Array(20).fill(5));

  useEffect(() => {
    if (isActive && !sessionRef.current) {
      startSession();
    } else if (!isActive && sessionRef.current) {
      stopSession();
    }
  }, [isActive]);

  const stopSession = () => {
    sessionRef.current?.close?.();
    sessionRef.current = null;
    audioContextInRef.current?.close();
    audioContextOutRef.current?.close();
    audioContextInRef.current = null;
    audioContextOutRef.current = null;
    setIsConnecting(false);
  };

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log('Live Session Connected');
            setIsConnecting(false);
            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = (inputData[i] as number) * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
              
              const slice = Array.from(inputData.slice(0, 20)).map((v: number) => 5 + Math.abs(v) * 20);
              setWaveformData(slice);
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextOutRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextOutRef.current.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextOutRef.current, 24000, 1);
              const source = audioContextOutRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioContextOutRef.current.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => setError("Laboratory connection error."),
          onclose: () => console.log('Live Session Closed'),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: `You are a Live Data Science Lab Assistant. The user is currently studying ${activeLessonTitle}. Explain what they are doing in the simulation based on their audio questions. Be concise and helpful.`,
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      setError("Microphone access required for Voice Lab.");
      setIsConnecting(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[200] animate-in slide-in-from-right-full duration-500">
      <div className="bg-white border border-black/10 shadow-2xl p-6 flex items-center space-x-6">
        <div className="flex flex-col">
          <span className="font-mono text-[8px] font-bold text-[#CCC] uppercase tracking-[0.4em] mb-1">Laboratory_Voice_Link</span>
          <h4 className="text-xs font-bold font-serif text-[#121212]">{isConnecting ? 'Establishing Signal...' : 'Live Interaction Active'}</h4>
          {error && <span className="text-[8px] text-rose-500 font-mono mt-1">{error}</span>}
        </div>
        
        <div className="flex items-end space-x-1 h-8 w-24">
          {waveformData.map((h, i) => (
            <div key={i} className="bg-[#2A4D69] w-1 transition-all duration-75" style={{ height: `${h}px` }} />
          ))}
        </div>

        <button 
          onClick={onClose}
          className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2 rounded-full transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
};

export default LiveVoiceSession;
