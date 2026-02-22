
import React, { useEffect, useRef } from 'react';
import { Cloud, RefreshCcw, ExternalLink, Box, Terminal, FileSpreadsheet, Activity, ShieldCheck, Database, UploadCloud, FileText } from 'lucide-react';
import { SyncMetadata } from '../types';
import { FOLDER_ID, SHEET_ID } from '../constants';

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
  isGoogleSheetsConnected?: boolean;
  onConnectGoogleSheets?: () => void;
  onRefreshGoogleSheets?: () => void;
  lastSheetsSync?: string | null;
  onUploadAmazonReport?: (file: File) => void;
}

const DataManager: React.FC<DataManagerProps> = ({ 
  onSyncDrive, isSyncing, isConnected, onConnect, externalLogs = [], syncMetadata, pendingCount = 0,
  isGoogleSheetsConnected, onConnectGoogleSheets, onRefreshGoogleSheets, lastSheetsSync, onUploadAmazonReport
}) => {
  const logEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [externalLogs]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUploadAmazonReport) {
      onUploadAmazonReport(file);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 animate-in pb-24">
      
      {/* Cloud Connectivity Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <div className={`border-2 rounded-[40px] p-8 flex items-start gap-6 transition-all duration-500 shadow-sm ${isGoogleSheetsConnected ? 'bg-indigo-50/50 border-indigo-100' : 'bg-amber-50/50 border-amber-100'}`}>
          <div className={`${isGoogleSheetsConnected ? 'bg-indigo-600' : 'bg-amber-600'} text-white p-4 rounded-3xl shadow-lg`}>
            <Database size={28} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className={`font-black text-lg tracking-tighter ${isGoogleSheetsConnected ? 'text-indigo-900' : 'text-amber-900'}`}>
                {isGoogleSheetsConnected ? 'Orders & Prices Connected' : 'Sheets Integration Required'}
              </h3>
              {isGoogleSheetsConnected && <ShieldCheck className="text-indigo-500" size={20} />}
            </div>
            <p className={`text-sm leading-relaxed font-medium max-w-2xl ${isGoogleSheetsConnected ? 'text-indigo-700/70' : 'text-amber-700/70'}`}>
              {isGoogleSheetsConnected 
                ? `Successfully connected to Orders and Purchase Prices sheets. Margin calculations are now based on real-time data.` 
                : 'Connect to the specific Orders and Prices spreadsheets to enable automatic margin and profit calculations.'}
            </p>
            <div className="flex items-center gap-4 mt-5">
              {!isGoogleSheetsConnected ? (
                <button onClick={onConnectGoogleSheets} className="bg-amber-600 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all">
                  Connect Sheets
                </button>
              ) : (
                <button onClick={onRefreshGoogleSheets} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2">
                  <RefreshCcw size={12} /> Sync Data
                </button>
              )}
              {lastSheetsSync && (
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Last sync: {new Date(lastSheetsSync).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
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

      {/* Manual Data Ingestion */}
      <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
        <h3 className="text-xl font-black text-[#2F4D36] tracking-tighter mb-6 flex items-center gap-3">
          <UploadCloud size={24} /> Manual Data Ingestion
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group cursor-pointer"
               onClick={() => fileInputRef.current?.click()}>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv,.xlsx,.xls" 
              onChange={handleFileChange}
            />
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText className="text-slate-400 group-hover:text-indigo-500" size={32} />
            </div>
            <h4 className="font-bold text-slate-700 mb-2">Amazon PPC Reports</h4>
            <p className="text-sm text-slate-400 mb-4">Upload Sponsored Products report (CSV) to include Amazon ad spend in profitability analysis.</p>
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 uppercase tracking-wider group-hover:border-indigo-200 group-hover:text-indigo-600">
              Select File
            </button>
          </div>
          
          <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 opacity-60">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4">
              <Database className="text-slate-300" size={32} />
            </div>
            <h4 className="font-bold text-slate-500 mb-2">Other Platforms</h4>
            <p className="text-sm text-slate-400">Support for Facebook Ads, TikTok, and other manual CSV imports coming soon.</p>
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
    </div>
  );
};

export default DataManager;
