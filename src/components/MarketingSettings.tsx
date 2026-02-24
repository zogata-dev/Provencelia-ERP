import React, { useState, useEffect } from 'react';
import { Target, Facebook, Chrome, CheckCircle2, AlertCircle } from 'lucide-react';

export const MarketingSettings: React.FC = () => {
  const [metaToken, setMetaToken] = useState('');
  const [metaAccountId, setMetaAccountId] = useState('');
  const [googleDeveloperToken, setGoogleDeveloperToken] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [googleRefreshToken, setGoogleRefreshToken] = useState('');
  const [googleCustomerId, setGoogleCustomerId] = useState('');

  const [metaStatus, setMetaStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [googleStatus, setGoogleStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');

  useEffect(() => {
    // Load saved credentials from localStorage
    const savedMetaToken = localStorage.getItem('meta_access_token');
    const savedMetaAccountId = localStorage.getItem('meta_account_id');
    if (savedMetaToken && savedMetaAccountId) {
      setMetaToken(savedMetaToken);
      setMetaAccountId(savedMetaAccountId);
      setMetaStatus('connected');
    }

    const savedGoogleDevToken = localStorage.getItem('google_developer_token');
    if (savedGoogleDevToken) {
      setGoogleDeveloperToken(savedGoogleDevToken);
      setGoogleClientId(localStorage.getItem('google_client_id') || '');
      setGoogleClientSecret(localStorage.getItem('google_client_secret') || '');
      setGoogleRefreshToken(localStorage.getItem('google_refresh_token') || '');
      setGoogleCustomerId(localStorage.getItem('google_customer_id') || '');
      setGoogleStatus('connected');
    }
  }, []);

  const handleConnectMeta = async () => {
    try {
      // Real integration test for Meta Graph API
      const response = await fetch(`https://graph.facebook.com/v19.0/act_${metaAccountId}/insights?access_token=${metaToken}`);
      if (response.ok) {
        localStorage.setItem('meta_access_token', metaToken);
        localStorage.setItem('meta_account_id', metaAccountId);
        setMetaStatus('connected');
      } else {
        setMetaStatus('error');
      }
    } catch (error) {
      setMetaStatus('error');
    }
  };

  const handleConnectGoogle = () => {
    // For Google Ads, a backend proxy is required due to CORS and gRPC requirements.
    // We save the credentials locally to be used by the backend.
    if (googleDeveloperToken && googleClientId && googleClientSecret && googleRefreshToken && googleCustomerId) {
      localStorage.setItem('google_developer_token', googleDeveloperToken);
      localStorage.setItem('google_client_id', googleClientId);
      localStorage.setItem('google_client_secret', googleClientSecret);
      localStorage.setItem('google_refresh_token', googleRefreshToken);
      localStorage.setItem('google_customer_id', googleCustomerId);
      setGoogleStatus('connected');
    } else {
      setGoogleStatus('error');
    }
  };

  return (
    <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-10 animate-in pb-24">
      <div>
        <h1 className="text-3xl font-extrabold text-[#2F4D36] tracking-tighter flex items-center gap-4">
          <Target className="text-[#2F4D36]" size={36} />
          Marketing Integrations
        </h1>
        <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-[0.3em] mt-2">
          Connect Ad Platforms for Real-Time MER Tracking
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Meta Ads Integration */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Facebook size={24} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-800">Meta Ads</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Facebook & Instagram</p>
              </div>
            </div>
            {metaStatus === 'connected' && <CheckCircle2 className="text-emerald-500" size={24} />}
            {metaStatus === 'error' && <AlertCircle className="text-rose-500" size={24} />}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block mb-2">Access Token</label>
              <input 
                type="password" 
                value={metaToken}
                onChange={(e) => setMetaToken(e.target.value)}
                placeholder="EAAB..."
                className="w-full px-6 py-4 bg-[#F6F6F0] border-none rounded-3xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block mb-2">Ad Account ID</label>
              <input 
                type="text" 
                value={metaAccountId}
                onChange={(e) => setMetaAccountId(e.target.value)}
                placeholder="1234567890"
                className="w-full px-6 py-4 bg-[#F6F6F0] border-none rounded-3xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <button 
              onClick={handleConnectMeta}
              className="w-full py-4 bg-blue-600 text-white rounded-3xl text-sm font-extrabold uppercase tracking-widest hover:bg-blue-700 transition-colors"
            >
              {metaStatus === 'connected' ? 'Reconnect Meta Ads' : 'Connect Meta Ads'}
            </button>
            <p className="text-xs text-slate-400 text-center">
              Requires a System User Access Token with <code className="bg-slate-100 px-1 rounded">ads_read</code> permission.
            </p>
          </div>
        </div>

        {/* Google Ads Integration */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                <Chrome size={24} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-800">Google Ads</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Search, Display & YouTube</p>
              </div>
            </div>
            {googleStatus === 'connected' && <CheckCircle2 className="text-emerald-500" size={24} />}
            {googleStatus === 'error' && <AlertCircle className="text-rose-500" size={24} />}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block mb-2">Customer ID (MCC or Account)</label>
              <input 
                type="text" 
                value={googleCustomerId}
                onChange={(e) => setGoogleCustomerId(e.target.value)}
                placeholder="123-456-7890"
                className="w-full px-6 py-4 bg-[#F6F6F0] border-none rounded-3xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block mb-2">Developer Token</label>
                <input 
                  type="password" 
                  value={googleDeveloperToken}
                  onChange={(e) => setGoogleDeveloperToken(e.target.value)}
                  className="w-full px-6 py-4 bg-[#F6F6F0] border-none rounded-3xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block mb-2">Refresh Token</label>
                <input 
                  type="password" 
                  value={googleRefreshToken}
                  onChange={(e) => setGoogleRefreshToken(e.target.value)}
                  className="w-full px-6 py-4 bg-[#F6F6F0] border-none rounded-3xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block mb-2">Client ID</label>
                <input 
                  type="password" 
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                  className="w-full px-6 py-4 bg-[#F6F6F0] border-none rounded-3xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block mb-2">Client Secret</label>
                <input 
                  type="password" 
                  value={googleClientSecret}
                  onChange={(e) => setGoogleClientSecret(e.target.value)}
                  className="w-full px-6 py-4 bg-[#F6F6F0] border-none rounded-3xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                />
              </div>
            </div>
            <button 
              onClick={handleConnectGoogle}
              className="w-full py-4 bg-rose-600 text-white rounded-3xl text-sm font-extrabold uppercase tracking-widest hover:bg-rose-700 transition-colors"
            >
              {googleStatus === 'connected' ? 'Update Google Ads' : 'Connect Google Ads'}
            </button>
            <p className="text-xs text-slate-400 text-center">
              Requires Google Ads API Developer Token and OAuth2 credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
