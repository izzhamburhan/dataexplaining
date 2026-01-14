
import React, { useState, useRef, useEffect } from 'react';
import { createChatSession } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AiChatbot: React.FC<Props> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Researcher, what inquiry can I assist with regarding this statistical unit?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatRef.current) {
      chatRef.current = createChatSession();
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const result = await chatRef.current.sendMessage({ message: userMessage });
      const text = result.text;
      setMessages(prev => [...prev, { role: 'model', text: text || "Null hypothesis response." }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Critical transmission failure.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-0 w-full sm:w-[500px] h-full sm:h-[700px] bg-white border-l border-black/5 flex flex-col z-[100] shadow-[0_0_100px_rgba(0,0,0,0.1)] animate-in slide-in-from-right-full duration-500">
      {/* Editorial Header */}
      <div className="px-12 py-10 border-b border-black/5 flex items-center justify-between bg-[#F9F8F6]">
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-[#CCC] mb-1">Library Records</h4>
          <h5 className="text-xl font-serif italic text-[#121212]">Research Assistant</h5>
        </div>
        <button onClick={onClose} className="p-2 text-[#999] hover:text-[#121212] transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Field Notes (Messages) */}
      <div ref={scrollRef} className="flex-grow overflow-y-auto p-12 space-y-12 scroll-smooth bg-white">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-[#CCC] mb-4">
              {msg.role === 'user' ? 'Inquiry' : 'Dissertation'}
            </span>
            <div className={`max-w-[85%] text-sm leading-loose ${
              msg.role === 'user' ? 'text-[#121212] font-bold text-right' : 'text-[#444] font-normal font-serif'
            }`}>
              {msg.text}
            </div>
            {i < messages.length - 1 && <div className="w-full h-px bg-black/5 mt-8"></div>}
          </div>
        ))}
        {isLoading && <div className="font-mono text-[8px] font-bold uppercase tracking-widest text-[#2A4D69] animate-pulse">Consulting references...</div>}
      </div>

      {/* Inquiry Input */}
      <form onSubmit={handleSend} className="p-12 pt-6 bg-[#F9F8F6] border-t border-black/5">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter search term or question..."
            className="w-full bg-transparent border-b border-black/10 py-4 text-sm font-normal focus:border-[#2A4D69] outline-none transition-all placeholder:text-[#BBB] placeholder:italic"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-0 top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#999] hover:text-[#2A4D69] disabled:opacity-0 transition-all"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default AiChatbot;
