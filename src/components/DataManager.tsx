
import React, { useEffect, useRef, useState } from 'react';
import { Cloud, RefreshCcw, ExternalLink, Box, Terminal, FileSpreadsheet, Activity, ShieldCheck, Database, Calculator } from 'lucide-react';
import { SyncMetadata } from '../types';
import { FOLDER_ID, SHEET_ID } from '../constants';
import { MarketingSettings } from './MarketingSettings';

interface DataManagerProps {
  onSyncDrive: () => void;
  isSyncing: boolean;
  isConnected: boolean;
  onConnect: () => void;
  externalLogs?: string[];
  syncMetadata: SyncMetadata | null;
  pendingCount?: number;
  autoSyncEnabled?: boolean;
  setAutoSyncEnabled?: (val: boolean) => void;
}

const DataManager: React.FC<DataManagerProps> = ({ 
  onSyncDrive, isSyncing, isConnected, onConnect, externalLogs = [], syncMetadata, pendingCount = 0
}) => {
  const logEndRef = useRef<HTMLDivElement>(null);
  
  const [marketplaceFees, setMarketplaceFees] = useState(() => {
    const saved = localStorage.getItem('provencelia_marketplace_fees');
    return saved ? JSON.parse(saved) : {
      amazon: 15,
      shopify: 2.9,
      ebay: 12,
      home24: 10,
      allegro: 8,
      kaufland: 13
    };
  });

  const [shippingCosts, setShippingCosts] = useState(() => {
    const saved = localStorage.getItem('provencelia_shipping_costs_v2');
    return saved ? JSON.parse(saved) : {
      'DB Schenker': 35,
      'GLS': 9
    };
  });

  const [cnbRates, setCnbRates] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const { getCnbRates } = await import('../services/geminiService');
        const rates = await getCnbRates();
        setCnbRates(rates);
      } catch (error) {
        // Silently fail and use fallbacks
      }
    };
    fetchRates();
  }, []);

  useEffect(() => {
    localStorage.setItem('provencelia_marketplace_fees', JSON.stringify(marketplaceFees));
  }, [marketplaceFees]);

  useEffect(() => {
    localStorage.setItem('provencelia_shipping_costs_v2', JSON.stringify(shippingCosts));
  }, [shippingCosts]);
  
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [externalLogs]);

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 animate-in pb-24">
      
      {/* Cloud Connectivity Status */}
      <div className={`border-2 rounded-[40px] p-8 flex items-start gap-6 transition-all duration-500 shadow-sm ${isConnected ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
        <div className={`${isConnected ? 'bg-emerald-600' : 'bg-rose-600'} text-white p-4 rounded-3xl shadow-lg`}>
          <FileSpreadsheet size={28} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className={`font-black text-lg tracking-tighter ${isConnected ? 'text-emerald-900' : 'text-rose-900'}`}>
              {isConnected ? 'Core Database Synchronized' : 'Cloud Disconnected'}
            </h3>
            {isConnected && <ShieldCheck className="text-emerald-500" size={20} />}
          </div>
          <p className={`text-sm leading-relaxed font-medium max-w-2xl ${isConnected ? 'text-emerald-700/70' : 'text-rose-700/70'}`}>
            {isConnected 
              ? `System is currently bridged to the Google Sheets production ledger (ID: ${SHEET_ID}). All ledger modifications are automatically pushed to the cloud in real-time.` 
              : 'The system requires an active Google Workspace connection to synchronize fiscal records and perform AI-driven OCR analysis.'}
          </p>
          {isConnected && (
            <a 
              href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`} 
              target="_blank" 
              className="inline-flex items-center gap-2 mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 hover:text-emerald-800 transition-colors group"
            >
              Access Production Sheet <ExternalLink size={14} className="group-hover:translate-x-1 transition-transform" />
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#2F4D36] flex items-center gap-4 tracking-tighter">
            <Database className="text-[#2F4D36]" size={36} /> Infrastructure Sync
          </h1>
          <p className="text-slate-400 text-[10px] font-black mt-3 uppercase tracking-[0.3em] flex items-center gap-2">
            <Cloud size={12} /> Target Directory ID: <span className="font-mono text-[#2F4D36] tracking-normal">{FOLDER_ID}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {!isConnected ? (
            <button onClick={onConnect} className="bg-[#2F4D36] text-white px-12 py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.25em] shadow-2xl shadow-[#2F4D36]/30 hover:opacity-90 transition-all active:scale-95">
              Connect to Workspace
            </button>
          ) : (
            <button 
              onClick={onSyncDrive} disabled={isSyncing}
              className="bg-[#2F4D36] text-white px-12 py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.25em] shadow-2xl shadow-[#2F4D36]/30 flex items-center gap-4 hover:opacity-95 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSyncing ? <RefreshCcw className="animate-spin" size={20} /> : <Activity size={20} />}
              {pendingCount > 0 ? `Process AI Batch (${pendingCount})` : 'Crawl for New Assets'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm group hover:shadow-xl transition-all duration-500">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Last Sync Timestamp</h4>
          <p className="text-xl font-black text-[#2F4D36] tracking-tighter">{syncMetadata?.lastSyncTimestamp || 'Awaiting Initial Sync'}</p>
        </div>
        <div className="bg-rose-50/50 p-10 rounded-[48px] border border-rose-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 text-rose-200 opacity-20 group-hover:scale-110 transition-transform"><Box size={100} /></div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400 mb-2">Queued for AI OCR</h4>
          <p className="text-3xl font-black text-rose-600 tracking-tighter">{pendingCount} <span className="text-xs uppercase tracking-widest ml-1">Assets</span></p>
        </div>
        <div className="bg-emerald-50/50 p-10 rounded-[48px] border border-emerald-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 text-emerald-200 opacity-20 group-hover:scale-110 transition-transform"><ShieldCheck size={100} /></div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-2">Verified Artifacts</h4>
          <p className="text-3xl font-black text-emerald-600 tracking-tighter">
            {syncMetadata?.totalFilesFound ? syncMetadata.totalFilesFound - pendingCount : 0}
          </p>
        </div>
        <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm group hover:shadow-xl transition-all duration-500">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Global Inventory</h4>
          <p className="text-xl font-black text-slate-700 tracking-tighter">{syncMetadata?.totalFilesFound || 0} Files Found</p>
        </div>
      </div>

      {/* Integration Guide */}
      <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[24px]">
            <Cloud size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#2F4D36] tracking-tighter">Google Integration Guide</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Setup Instructions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="font-black text-[#2F4D36] flex items-center gap-2">
              <FileSpreadsheet size={18} /> Orders Sheet
            </h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Connect your Google Sheet containing order data. The system expects columns for:
              <br/>
              <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">Order ID</code>, 
              <code className="bg-slate-100 px-2 py-0.5 rounded text-xs ml-1">Date</code>, 
              <code className="bg-slate-100 px-2 py-0.5 rounded text-xs ml-1">Total</code>, 
              <code className="bg-slate-100 px-2 py-0.5 rounded text-xs ml-1">Currency</code>, 
              <code className="bg-slate-100 px-2 py-0.5 rounded text-xs ml-1">Channel</code>.
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Sheet ID</p>
              <code className="text-xs font-mono text-[#2F4D36] break-all">{SHEET_ID}</code>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-black text-[#2F4D36] flex items-center gap-2">
              <Database size={18} /> Invoice Drive Folder
            </h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Point the system to a Google Drive folder containing your invoice PDFs or images. 
              The AI will automatically scan, OCR, and extract data from new files found here.
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Folder ID</p>
              <code className="text-xs font-mono text-[#2F4D36] break-all">{FOLDER_ID}</code>
            </div>
          </div>
        </div>
        
        <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 flex gap-4 items-start">
          <Terminal size={20} className="text-amber-500 mt-1" />
          <div>
             <h5 className="font-bold text-amber-800 text-sm">Developer Note & Troubleshooting</h5>
             <p className="text-xs text-amber-700/70 mt-1 leading-relaxed">
               To change these IDs, update the <code className="font-mono">constants.tsx</code> file in the source code. 
               Ensure your Google Cloud Project has the Drive and Sheets APIs enabled and the OAuth consent screen configured.
             </p>
             <div className="mt-3 pt-3 border-t border-amber-200/50">
               <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Fix "redirect_uri_mismatch" Error</p>
               <p className="text-xs text-amber-700/70 leading-relaxed">
                 1. Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="underline hover:text-amber-900 font-bold">Google Cloud Console &gt; Credentials</a>.<br/>
                 2. Edit your OAuth 2.0 Client ID.<br/>
                 3. Add these exact URLs to <strong>Authorized JavaScript origins</strong> and <strong>Authorized redirect URIs</strong>:<br/>
                 <code className="bg-white/50 px-2 py-1 rounded mt-2 block w-full select-all font-mono text-[10px]">https://ais-dev-7oujqp4cjxvyurghf2jedh-38526737019.asia-east1.run.app</code>
                 <code className="bg-white/50 px-2 py-1 rounded mt-1 block w-full select-all font-mono text-[10px]">https://ais-pre-7oujqp4cjxvyurghf2jedh-38526737019.asia-east1.run.app</code>
                 <br/>
                 <em>Note: It may take up to 5 minutes for Google to apply the changes.</em>
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* Modern Console View */}
      <div className="bg-[#121a14] rounded-[48px] border border-white/5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col h-[450px]">
        <div className="px-10 py-6 bg-[#1a2b1e] flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <Terminal size={18} className="text-white/40" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">System Activity Stream</span>
          </div>
          {isSyncing && (
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em]">AI Agent: Interrogating Assets...</span>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-10 font-mono text-[11px] space-y-3.5 bg-black/10 custom-scrollbar-dark">
          {externalLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/10 space-y-4">
              <Activity size={40} />
              <div className="text-center">
                <p className="font-black uppercase tracking-[0.3em]">No activity logged</p>
                <p className="text-[9px] font-medium opacity-50 mt-1">Initiate crawl to populate stream</p>
              </div>
            </div>
          ) : (
            externalLogs.map((log, i) => (
              <div key={i} className={`flex gap-6 animate-slide-in ${log.startsWith('❌') ? 'text-rose-400' : log.startsWith('📄') ? 'text-indigo-400' : 'text-white/80'}`}>
                <span className="text-white/20 shrink-0 font-bold border-r border-white/10 pr-6">[{new Date().toLocaleTimeString('en-GB')}]</span>
                <span className="font-medium tracking-tight">{log}</span>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Commission & Shipping Variables */}
      <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-[24px]">
            <Calculator size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#2F4D36] tracking-tighter">Commission & Shipping Variables</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Global settings for Sales & Profit calculations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="font-black text-[#2F4D36] text-sm uppercase tracking-widest border-b border-slate-100 pb-2">Marketplace Fees (%)</h4>
            {Object.entries(marketplaceFees).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{key}</label>
                <input 
                  type="number" 
                  value={value as number}
                  onChange={(e) => setMarketplaceFees({...marketplaceFees, [key]: Number(e.target.value)})}
                  className="w-24 px-4 py-2 bg-[#F6F6F0] border-none rounded-2xl text-sm font-bold text-slate-800 text-right outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h4 className="font-black text-[#2F4D36] text-sm uppercase tracking-widest border-b border-slate-100 pb-2">Shipping Costs (EUR)</h4>
            {Object.entries(shippingCosts).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{key}</label>
                <input 
                  type="number" 
                  value={value as number}
                  onChange={(e) => setShippingCosts({...shippingCosts, [key]: Number(e.target.value)})}
                  className="w-24 px-4 py-2 bg-[#F6F6F0] border-none rounded-2xl text-sm font-bold text-slate-800 text-right outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CNB Exchange Rates */}
      <div className="bg-white p-8 lg:p-12 rounded-[48px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6 mb-8">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-[24px]">
            <Activity size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#2F4D36] tracking-tighter">Live Exchange Rates (CNB)</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Current daily rates from Czech National Bank</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cnbRates ? (
            Object.entries(cnbRates).map(([currency, rate]) => (
              <div key={currency} className="bg-[#F6F6F0] p-6 rounded-[32px] flex flex-col items-center justify-center text-center">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">1 {currency}</div>
                <div className="text-2xl font-black text-[#2F4D36] tracking-tighter">{rate.toFixed(3)} CZK</div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-slate-400 font-bold text-sm uppercase tracking-widest">
              Fetching live rates...
            </div>
          )}
        </div>
      </div>

      {/* Marketing Integrations */}
      <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm overflow-hidden">
        <MarketingSettings />
      </div>
    </div>
  );
};

export default DataManager;
