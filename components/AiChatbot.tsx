
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
    { role: 'model', text: 'Hello! I am DataAI. Ask me anything about Data Science or Machine Learning!' }
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
      setMessages(prev => [...prev, { role: 'model', text: text || "I'm not sure how to answer that." }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col z-[100] animate-in slide-in-from-bottom-10 fade-in duration-300 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center font-bold text-xl">🤖</div>
          <div>
            <h4 className="font-bold leading-none">DataAI Tutor</h4>
            <span className="text-[10px] opacity-70 uppercase tracking-widest font-bold">Always Online</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-100' 
                : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none flex space-x-1">
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-75"></div>
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-30 disabled:hover:bg-blue-600 transition-all shadow-md shadow-blue-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2 font-medium">Powered by Gemini 3 Flash</p>
      </form>
    </div>
  );
};

export default AiChatbot;
