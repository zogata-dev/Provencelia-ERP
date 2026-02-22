
import React, { useState, useEffect } from 'react';
import { Sparkles, Languages, Image as ImageIcon, Link as LinkIcon, Search, Send, FileText, Globe, Target, Loader2, Download, Copy, Check, ExternalLink, BarChart3, TrendingUp } from 'lucide-react';
import { generateSEOContent, generateSEOImage } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SEOContent {
  title: string;
  metaDescription: string;
  h1: string;
  content: string;
  keywords: string[];
  suggestedLinks: { text: string, url: string }[];
}

interface MultiLangContent {
  cs: SEOContent;
  de: SEOContent;
  pl: SEOContent;
  sk: SEOContent;
}

interface SearchConsoleData {
  siteUrl: string;
  daily: { date: string, clicks: number, impressions: number, avgPosition: number }[];
  queries: { query: string, clicks: number, impressions: number, position: number }[];
  lowHangingFruit: { query: string, clicks: number, impressions: number, position: number }[];
}

const SEOStudio: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<MultiLangContent | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<keyof MultiLangContent>('cs');
  const [copied, setCopied] = useState(false);
  const [searchData, setSearchData] = useState<SearchConsoleData | null>(null);
  const [isLoadingSearchData, setIsLoadingSearchData] = useState(false);

  useEffect(() => {
    fetchSearchConsoleData();
  }, []);

  const fetchSearchConsoleData = async () => {
    setIsLoadingSearchData(true);
    try {
      const response = await fetch('/api/search-console/data');
      if (response.ok) {
        const data = await response.json();
        setSearchData(data);
      }
    } catch (error) {
      console.error('Error fetching Search Console data:', error);
    } finally {
      setIsLoadingSearchData(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    try {
      const content = await generateSEOContent(topic, targetUrl);
      if (content) {
        setGeneratedContent(content);
      }
    } catch (error) {
      console.error('Error generating SEO content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!topic.trim()) return;
    setIsGeneratingImage(true);
    try {
      const imageUrl = await generateSEOImage(topic);
      if (imageUrl) {
        setGeneratedImage(imageUrl);
      }
    } catch (error) {
      console.error('Error generating SEO image:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8 md:space-y-12 animate-in pb-24">
      {/* Search Console Insights */}
      {searchData && (
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#2F4D36] tracking-tighter">Search Performance</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Last 30 Days • {searchData.siteUrl}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={searchData.daily}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="clicks" fill="#6366f1" radius={[4, 4, 0, 0]} name="Clicks" />
                  <Bar dataKey="impressions" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Impressions" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 overflow-hidden flex flex-col">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Top Performing Queries</h4>
              <div className="overflow-y-auto custom-scrollbar flex-1 space-y-3">
                {searchData.queries.map((q, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-700 truncate max-w-[140px]">{q.query}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-indigo-600">{q.clicks} clicks</span>
                      <span className="text-[10px] font-bold text-slate-400">#{q.position.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {searchData.lowHangingFruit && searchData.lowHangingFruit.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="text-amber-500 w-5 h-5" />
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Low Hanging Fruit</h4>
                <span className="text-xs text-slate-400 font-medium">(High impressions, low clicks or position &gt; 10)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchData.lowHangingFruit.map((q, i) => (
                  <div key={i} className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-amber-50 transition-colors" onClick={() => setTopic(q.query)}>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-amber-900 truncate max-w-[180px]">{q.query}</span>
                      <span className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest mt-1">
                        {q.impressions} imp • {q.clicks} clicks
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-amber-100">
                      <span className="text-[10px] font-black text-amber-600">#{q.position.toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="bg-[#2F4D36] rounded-[40px] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-1000" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-xl border border-white/10 shadow-lg">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter">SEO Content Engine</h1>
              <p className="opacity-70 text-sm font-medium uppercase tracking-[0.2em] mt-1">Multi-language AI Copywriter & Visualizer</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Topic or Category Name</label>
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
                <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Luxury Garden Furniture, Bio Cosmetics..."
                  className="w-full bg-white/10 border border-white/10 rounded-3xl py-5 pl-14 pr-6 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/20 transition-all font-bold"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Target URL (Optional)</label>
              <div className="relative">
                <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
                <input 
                  type="text" 
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://your-eshop.com/category"
                  className="w-full bg-white/10 border border-white/10 rounded-3xl py-5 pl-14 pr-6 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/20 transition-all font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-8">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !topic}
              className="bg-white text-[#2F4D36] px-10 py-5 rounded-3xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl disabled:opacity-50 disabled:scale-100 flex items-center gap-3"
            >
              {isGenerating ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              Generate SEO Package
            </button>
            <button 
              onClick={handleGenerateImage}
              disabled={isGeneratingImage || !topic}
              className="bg-emerald-500 text-white px-10 py-5 rounded-3xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl disabled:opacity-50 disabled:scale-100 flex items-center gap-3"
            >
              {isGeneratingImage ? <Loader2 className="animate-spin w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
              Generate Visual
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {(generatedContent || generatedImage) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Content Column */}
          <div className="lg:col-span-2 space-y-8">
            {generatedContent && (
              <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Languages className="text-[#2F4D36] w-6 h-6" />
                    <h3 className="text-xl font-black text-[#2F4D36] tracking-tighter">Localized Content</h3>
                  </div>
                  <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                    {(['cs', 'de', 'pl', 'sk'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setActiveLang(lang)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          activeLang === lang ? 'bg-[#2F4D36] text-white shadow-lg' : 'text-slate-400 hover:text-[#2F4D36]'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-10 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">SEO Title</label>
                      <div className="p-5 bg-slate-50 rounded-2xl font-bold text-[#2F4D36] text-sm border border-slate-100 relative group">
                        {generatedContent[activeLang].title}
                        <button 
                          onClick={() => copyToClipboard(generatedContent[activeLang].title)}
                          className="absolute right-3 top-3 p-2 bg-white rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Keywords</label>
                      <div className="flex flex-wrap gap-2">
                        {generatedContent[activeLang].keywords.map((kw, i) => (
                          <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-tight border border-indigo-100">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meta Description</label>
                    <div className="p-5 bg-slate-50 rounded-2xl font-medium text-slate-600 text-sm border border-slate-100 leading-relaxed">
                      {generatedContent[activeLang].metaDescription}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Main Content (H1 + Body)</label>
                    <div className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm prose prose-slate max-w-none">
                      <h1 className="text-3xl font-black text-[#2F4D36] mb-6 tracking-tighter">{generatedContent[activeLang].h1}</h1>
                      <div className="text-slate-600 leading-loose whitespace-pre-wrap font-medium">
                        {generatedContent[activeLang].content}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Internal Linking Suggestions</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {generatedContent[activeLang].suggestedLinks.map((link, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl group">
                          <div className="flex items-center gap-3">
                            <LinkIcon className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-900">{link.text}</span>
                          </div>
                          <button className="text-emerald-400 group-hover:text-emerald-600 transition-colors">
                            <ExternalLink size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Visual Column */}
          <div className="space-y-8">
            {generatedImage && (
              <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm sticky top-8">
                <div className="flex items-center gap-3 mb-8">
                  <ImageIcon className="text-[#2F4D36] w-6 h-6" />
                  <h3 className="text-xl font-black text-[#2F4D36] tracking-tighter">Generated Visual</h3>
                </div>
                <div className="aspect-square rounded-[32px] overflow-hidden border border-slate-100 shadow-inner group relative">
                  <img 
                    src={generatedImage} 
                    alt="SEO Visual" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button className="p-4 bg-white rounded-2xl text-[#2F4D36] shadow-xl hover:scale-110 transition-all">
                      <Download size={20} />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-6 text-center">
                  Optimized for Social Media & Blog Headers
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!generatedContent && !generatedImage && !isGenerating && !isGeneratingImage && (
        <div className="bg-white rounded-[48px] border border-slate-100 p-20 text-center">
          <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 border border-slate-100">
            <Target className="w-10 h-10 text-slate-200" />
          </div>
          <h3 className="text-2xl font-black text-[#2F4D36] tracking-tighter">Ready to Dominate Search?</h3>
          <p className="text-slate-400 max-w-md mx-auto mt-4 font-medium">
            Enter a topic above to generate high-converting SEO content and visuals in 4 languages simultaneously.
          </p>
        </div>
      )}
    </div>
  );
};

export default SEOStudio;
