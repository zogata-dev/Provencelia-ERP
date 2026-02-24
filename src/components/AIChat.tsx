import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Invoice, Order } from '../types';

interface AIChatProps {
  invoices: Invoice[];
  orders: Order[];
  isOpen: boolean;
  onClose: () => void;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const AIChat: React.FC<AIChatProps> = ({ invoices, orders, isOpen, onClose }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'Hello! I am your Provencelia AI Assistant. Ask me about your orders, invoices, or profitability.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // Prepare context summary to avoid token limits
      const context = `
        Current Date: ${new Date().toLocaleDateString()}
        Total Orders: ${orders.length}
        Total Invoices: ${invoices.length}
        Recent Orders: ${JSON.stringify(orders.slice(0, 5))}
        Recent Invoices: ${JSON.stringify(invoices.slice(0, 5))}
        
        You are a business intelligence assistant for "Provencelia". 
        Answer questions based on the provided data context. 
        If the user asks about specific IDs not in the snippet, explain you only have a summary view but can analyze general trends.
        Keep answers concise and professional.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Context: ${context}\n\nUser Question: ${userMsg}`,
      });

      const text = response.text || "I apologize, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'ai', text }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I encountered an error connecting to the AI service." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-[90vw] md:w-[400px] h-[600px] bg-white rounded-[32px] shadow-2xl border border-slate-100 flex flex-col z-50 animate-in overflow-hidden">
      {/* Header */}
      <div className="bg-[#2F4D36] p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md">
            <Bot className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">AI Assistant</h3>
            <p className="text-white/50 text-[10px] uppercase tracking-widest font-bold">Online</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-[#2F4D36] text-white rounded-tr-sm' 
                : 'bg-white text-slate-600 border border-slate-100 rounded-tl-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-[#2F4D36]" />
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about revenue, orders..."
            className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-6 pr-14 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#2F4D36]/10 transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 p-2 bg-[#2F4D36] text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
