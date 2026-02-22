
import React from 'react';
import { Play, Save, Wand2, MessageSquare, Send, Info, Sparkles } from 'lucide-react';
import { chatWithScript } from '../services/geminiService';

interface ScriptEditorProps {
  script: string;
  setScript: (script: string) => void;
  onDeploy: () => void;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({ script, setScript, onDeploy }) => {
  const [chatMessage, setChatMessage] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [isTyping, setIsTyping] = React.useState(false);

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    
    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await chatWithScript(script, userMsg);
      setChatHistory(prev => [...prev, { role: 'ai', text: response || "No response received." }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Apologies, I encountered a synthesis error." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-full p-4 md:p-8 gap-4 md:gap-8 flex-col animate-in pb-24 md:pb-8">
      {/* Logic Studio Info Header */}
      <div className="bg-[#2F4D36] text-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] flex flex-col sm:flex-row items-center gap-4 md:gap-6 shadow-2xl shadow-[#2F4D36]/30 relative overflow-hidden group">
        <div className="absolute right-0 top-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-700 hidden sm:block"><Sparkles size={100} /></div>
        <div className="bg-white/10 p-3 md:p-4 rounded-2xl md:rounded-3xl backdrop-blur-xl border border-white/10 shadow-lg shrink-0">
          <Info className="w-6 h-6 md:w-7 md:h-7" />
        </div>
        <div className="relative z-10 text-center sm:text-left">
          <h4 className="font-black text-lg md:text-xl tracking-tighter uppercase tracking-[0.05em]">Business Intelligence Core</h4>
          <p className="text-xs md:text-sm opacity-60 font-medium max-w-3xl mt-1 leading-relaxed">
            Define operational rules. Gemini interrogates this code to derive categories and metrics.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 md:gap-10 min-h-0">
        {/* Code Editor Panel */}
        <div className="flex-1 flex flex-col bg-white rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-xl overflow-hidden group hover:border-[#2F4D36]/20 transition-all min-h-[300px] lg:min-h-0">
          <div className="px-6 md:px-8 py-4 md:py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-rose-400 shadow-sm" />
              <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-amber-400 shadow-sm" />
              <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-emerald-400 shadow-sm" />
              <span className="ml-2 md:ml-4 text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.4em] truncate max-w-[100px]">logic.gs</span>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={onDeploy}
                className="flex items-center gap-2 bg-[#2F4D36] text-white px-4 md:px-8 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg active:scale-95"
              >
                <Play className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden xs:inline">Deploy</span>
              </button>
              <button className="p-2 md:p-3 text-slate-400 hover:text-[#2F4D36] hover:bg-white rounded-xl md:rounded-2xl transition-all border border-transparent hover:border-slate-100">
                <Save className="w-4.5 h-4.5 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
          
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full p-6 md:p-10 font-mono text-xs md:text-sm leading-loose bg-white outline-none resize-none text-slate-700 selection:bg-[#2F4D36]/10 custom-scrollbar"
            placeholder="// Define your custom Apps Script business logic here..."
          />
        </div>

        {/* AI Assistant Sidebar */}
        <div className="w-full lg:w-[400px] flex flex-col bg-white rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-xl overflow-hidden h-[400px] lg:h-auto">
          <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-3 md:gap-4 bg-[#F6F6F0]/50 relative shrink-0">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl md:rounded-3xl bg-[#2F4D36] flex items-center justify-center text-white shadow-lg shadow-[#2F4D36]/20">
              <Wand2 className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="font-black text-[#2F4D36] text-xs md:text-sm uppercase tracking-[0.1em] md:tracking-[0.2em]">Gemini Copilot</h3>
              <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">AI Assistant</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 md:space-y-6 custom-scrollbar bg-slate-50/20">
            {chatHistory.length === 0 ? (
              <div className="text-center py-10 md:py-20 px-4 md:px-8">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-[24px] md:rounded-[32px] flex items-center justify-center mx-auto mb-4 md:mb-6 text-slate-200 shadow-sm border border-slate-50">
                  <MessageSquare className="w-7 h-7 md:w-9 md:h-9" />
                </div>
                <p className="text-[#2F4D36] font-black text-[10px] md:text-xs uppercase tracking-[0.15em] leading-relaxed">Intelligence Ready</p>
                <p className="text-slate-400 text-[9px] md:text-[11px] font-medium mt-2 md:mt-3 leading-relaxed">Ask me to refactor code or analyze logic flows.</p>
              </div>
            ) : (
              chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in`}>
                  <div className={`max-w-[90%] md:max-w-[85%] p-4 md:p-5 rounded-2xl md:rounded-[24px] text-xs md:text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#2F4D36] text-white rounded-tr-none shadow-xl shadow-[#2F4D36]/20' 
                      : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 p-4 md:p-5 rounded-2xl md:rounded-[24px] rounded-tl-none flex gap-1.5 md:gap-2">
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 border-t border-slate-50 shrink-0">
            <div className="relative group">
              <input 
                type="text" 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Message Copilot..."
                className="w-full bg-[#F6F6F0] border-none rounded-2xl md:rounded-3xl py-4 md:py-5 pl-6 md:pl-8 pr-12 md:pr-16 text-xs md:text-sm font-bold text-[#2F4D36] outline-none ring-1 ring-slate-100 group-hover:ring-2 group-hover:ring-[#2F4D36]/10 focus:ring-2 focus:ring-[#2F4D36]/20 transition-all"
              />
              <button 
                onClick={handleSendMessage}
                className="absolute right-1.5 md:right-2 top-1.5 md:top-2 p-2.5 md:p-3 bg-[#2F4D36] text-white rounded-xl md:rounded-2xl hover:opacity-90 shadow-lg transition-all active:scale-90"
              >
                <Send className="w-4 h-4 md:w-4.5 md:h-4.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptEditor;
