import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Loader2, Sparkles, BarChart3, TrendingUp, AlertCircle, HelpCircle } from 'lucide-react';
import { ChatMessage, Order, Invoice, MarketingSpend, GoogleAdsDailyData } from '../types';
import { queryBusinessIntelligence } from '../services/geminiService';

interface BusinessChatProps {
  orders: Order[];
  invoices: Invoice[];
  marketingSpends: MarketingSpend[];
  googleAdsData: { daily: GoogleAdsDailyData[] };
}

const BusinessChat: React.FC<BusinessChatProps> = ({ orders, invoices, marketingSpends, googleAdsData }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your AI Business Intelligence Analyst. I have access to your live orders, invoices, and marketing data. Ask me anything about your business performance, trends, or profitability.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Prepare context data (summarized to save tokens)
      const context = {
        totalRevenue: orders.reduce((sum, o) => sum + o.totalValue, 0),
        totalOrders: orders.length,
        recentOrders: orders.slice(0, 20), // Last 20 orders
        totalExpenses: invoices.reduce((sum, i) => sum + (i.eurValue || 0), 0),
        marketingSpend: googleAdsData.daily.reduce((sum, d) => sum + d.cost, 0),
        adsData: googleAdsData.daily.slice(0, 30), // Last 30 days
      };

      const responseText = await queryBusinessIntelligence(input, context);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText || "I'm sorry, I couldn't process that request right now.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered an error analyzing your data. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    "What is our current MER?",
    "How much did we spend on ads last week?",
    "Which sales channel is most profitable?",
    "Are there any anomalies in our costs?"
  ];

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto h-[calc(100vh-100px)] flex flex-col animate-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-t-[32px] border-b border-slate-100 flex items-center gap-4 shadow-sm">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-[#2F4D36] tracking-tighter">Business Intelligence Chat</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by Gemini 2.0 Flash</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-slate-50 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
              msg.role === 'user' ? 'bg-[#2F4D36] text-white' : 'bg-white text-indigo-600 border border-indigo-100'
            }`}>
              {msg.role === 'user' ? <UserIcon size={20} /> : <Bot size={20} />}
            </div>
            
            <div className={`max-w-[80%] p-5 rounded-2xl shadow-sm text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-[#2F4D36] text-white rounded-tr-none' 
                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
            }`}>
              <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
              <div className={`text-[10px] mt-2 font-bold uppercase tracking-widest ${
                msg.role === 'user' ? 'text-white/40' : 'text-slate-300'
              }`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-white text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 shadow-sm">
              <Bot size={20} />
            </div>
            <div className="bg-white p-5 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-6 rounded-b-[32px] border-t border-slate-100 shadow-xl">
        {messages.length < 3 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s)}
                className="whitespace-nowrap px-4 py-2 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-xl text-xs font-bold border border-slate-100 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        
        <div className="relative flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your business data..."
            className="flex-1 bg-slate-50 border-none rounded-2xl py-4 pl-6 pr-14 text-slate-700 font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2.5 bg-[#2F4D36] text-white rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg shadow-[#2F4D36]/20"
          >
            {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-300 font-bold uppercase tracking-widest mt-4">
          AI can make mistakes. Verify important financial decisions.
        </p>
      </div>
    </div>
  );
};

export default BusinessChat;
