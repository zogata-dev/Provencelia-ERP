
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { DollarSign, TrendingUp, Sparkles, ReceiptText, CalendarRange, RefreshCcw, ToggleLeft, ToggleRight, Repeat, ExternalLink, Box, Target, Zap } from 'lucide-react';
import { Invoice, Order, MarketingSpend } from '../types';

interface DashboardProps {
  summary?: any;
  invoices: Invoice[];
  categories: string[];
  onUpdateCategory: (id: string, cat: string) => void;
  onCategoryClick?: (category: string) => void;
  pendingCount?: number;
  orders?: Order[];
  marketingSpends?: MarketingSpend[];
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    return `${parseInt(parts[0])}.${parseInt(parts[1])}.${parts[2]}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
};

const Dashboard: React.FC<DashboardProps> = ({ 
  summary, invoices, categories, onUpdateCategory, onCategoryClick, pendingCount = 0,
  orders = [], marketingSpends = []
}) => {
  const [excludeReinvoices, setExcludeReinvoices] = useState(false);

  const COLORS = ['#2F4D36', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#10b981', '#f43f5e', '#64748b'];

  const [rates, setRates] = useState<any>({ EUR: 25.30, USD: 23.40, PLN: 5.85, HUF: 0.064 });

  useEffect(() => {
    const fetchRates = async () => {
      const { getCnbRates } = await import('../services/geminiService');
      const fetchedRates = await getCnbRates();
      setRates(fetchedRates);
    };
    fetchRates();
  }, []);

  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const filteredInvoices = useMemo(() => {
    return excludeReinvoices ? invoices.filter(inv => !inv.isReinvoice) : invoices;
  }, [invoices, excludeReinvoices]);

  const totalEurExpenditure = filteredInvoices.reduce((sum, inv) => sum + (inv.eurValue || 0), 0);
  
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => {
      let rateToCzk = 1;
      const currency = o.currency.toUpperCase();
      if (currency === 'EUR') rateToCzk = rates.EUR || 25.3;
      else if (currency === 'USD') rateToCzk = rates.USD || 23.4;
      else if (currency === 'PLN') rateToCzk = rates.PLN || 5.85;
      else if (currency === 'HUF') rateToCzk = rates.HUF || 0.064;
      
      return sum + (o.totalValue * rateToCzk);
    }, 0);
  }, [orders, rates]);

  const totalAdSpend = useMemo(() => marketingSpends.reduce((sum, s) => sum + s.amount, 0), [marketingSpends]);
  const mer = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;

  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => {
      const dateB = parseDate(b.issueDate)?.getTime() || 0;
      const dateA = parseDate(a.issueDate)?.getTime() || 0;
      return dateB - dateA;
    });
  }, [filteredInvoices]);

  return (
    <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-10 animate-in pb-24">
      {summary && (
        <div className="bg-[#2F4D36] rounded-[40px] p-6 lg:p-10 text-white shadow-2xl shadow-[#2F4D36]/30 flex flex-col lg:flex-row items-start gap-8 border-b-8 border-white/5 relative overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-700" />
          <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-xl border border-white/10 shadow-lg">
            <Sparkles className="text-white" size={32} />
          </div>
          <div className="flex-1 relative z-10">
            <h3 className="text-2xl font-extrabold mb-2 tracking-tighter">AI Business Insight</h3>
            <p className="opacity-80 leading-relaxed text-base font-medium italic">"Current MER is sitting at {mer.toFixed(2)}x. Marketing costs are {(totalAdSpend / totalRevenue * 100 || 0).toFixed(1)}% of gross revenue."</p>
          </div>
        </div>
      )}

      {/* Primary Stats Grid */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setExcludeReinvoices(!excludeReinvoices)}
          className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${excludeReinvoices ? 'bg-[#2F4D36] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
        >
          {excludeReinvoices ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          {excludeReinvoices ? 'Reinvoices Excluded' : 'Reinvoices Included'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
        {[
          { label: 'Gross Revenue', value: `${totalRevenue.toLocaleString()} CZK`, change: 'Real-time', icon: <DollarSign />, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Marketing Spend', value: `${totalAdSpend.toLocaleString()} CZK`, change: 'Google Ads', icon: <Target />, color: 'bg-rose-50 text-rose-600' },
          { label: 'Marketing Eff. (MER)', value: `${mer.toFixed(2)}x`, change: 'Yield', icon: <Zap />, color: 'bg-indigo-50 text-indigo-600' },
          { label: 'OPEX Ledger', value: `€${totalEurExpenditure.toLocaleString(undefined, { minimumFractionDigits: 0 })}`, change: 'Verified', icon: <ReceiptText />, color: 'bg-amber-50 text-amber-600' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 lg:p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
            <div className="flex justify-between items-start mb-8">
              <div className={`p-4 rounded-3xl ${stat.color} border border-slate-50 transition-transform group-hover:scale-110`}>
                {stat.icon}
              </div>
              <span className="text-[10px] font-extrabold text-[#2F4D36] bg-[#F6F6F0] px-3 py-1.5 rounded-full uppercase tracking-widest border border-slate-100">
                {stat.change}
              </span>
            </div>
            <h4 className="text-slate-400 text-[10px] font-extrabold uppercase tracking-[0.2em]">{stat.label}</h4>
            <p className="text-3xl font-extrabold text-[#2F4D36] mt-2 tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 lg:p-12 rounded-[48px] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl shadow-sm">
              <TrendingUp size={28} />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-[#2F4D36] tracking-tighter">Profitability Velocity</h3>
              <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-[0.2em] mt-1">Net Performance vs Marketing Costs</p>
            </div>
          </div>
        </div>

        {/* Existing Chart (kept for reference) */}
        <div className="h-[400px] flex items-center justify-center border-2 border-dashed border-slate-100 rounded-[32px] text-slate-300">
          <div className="text-center">
            <CalendarRange size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-extrabold text-xs uppercase tracking-widest">Temporal Analysis Ready</p>
          </div>
        </div>
      </div>

      {/* Transaction Feed */}
      <div className="bg-white p-6 lg:p-12 rounded-[48px] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[550px]">
        <h3 className="text-2xl font-extrabold text-[#2F4D36] tracking-tighter mb-10">Live Ledger Feed</h3>
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-[#F6F6F0] text-[#2F4D36]/60 text-[9px] uppercase font-extrabold tracking-[0.2em] sticky top-0 border-b border-slate-100 z-10">
              <tr>
                <th className="px-6 py-5">Origin / Class</th>
                <th className="px-6 py-5 text-right">Value (EUR)</th>
                <th className="px-6 py-5 text-center">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedInvoices.slice(0, 15).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 text-sm transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col space-y-1">
                      <span className="font-bold text-slate-800 tracking-tight truncate max-w-[200px]">{inv.client}</span>
                      <span className="text-[9px] font-extrabold uppercase text-indigo-500 tracking-widest">{inv.category || 'Uncategorized'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right font-extrabold text-[#2F4D36]">
                    €{inv.eurValue?.toLocaleString()}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="inline-flex p-2.5 bg-slate-50 text-slate-300 rounded-xl group-hover:bg-[#2F4D36] group-hover:text-white transition-all">
                      <RefreshCcw size={14} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
