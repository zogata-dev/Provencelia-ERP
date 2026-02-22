
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { DollarSign, TrendingUp, Sparkles, ReceiptText, CalendarRange, RefreshCcw, ToggleLeft, ToggleRight, Repeat, ExternalLink, Box, Target, Zap } from 'lucide-react';
import { Invoice, Order, MarketingSpend, GoogleAdsDailyData, GoogleAdsGeoData, Anomaly } from '../types';
import { AlertCircle, Info, ShieldAlert, ShieldCheck, BellRing } from 'lucide-react';

interface DashboardProps {
  summary?: any;
  invoices: Invoice[];
  categories: string[];
  onUpdateCategory: (id: string, cat: string) => void;
  onCategoryClick?: (category: string) => void;
  pendingCount?: number;
  orders?: Order[];
  marketingSpends?: MarketingSpend[];
  googleAdsData?: { daily: GoogleAdsDailyData[], geo: GoogleAdsGeoData[] };
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
  orders = [], marketingSpends = [], googleAdsData = { daily: [], geo: [] }
}) => {
  const [excludeReinvoices, setExcludeReinvoices] = useState(false);

  const COLORS = ['#2F4D36', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#10b981', '#f43f5e', '#64748b'];

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
  
  const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + o.totalValue, 0), [orders]);
  const totalAdSpend = useMemo(() => {
    const manualSpend = marketingSpends.reduce((sum, s) => sum + s.amount, 0);
    const adsSpend = googleAdsData.daily.reduce((sum, s) => sum + s.cost, 0);
    // If we have Google Ads data, we might want to prefer it or combine it
    // For now, let's combine them or use Ads if available
    return adsSpend > 0 ? adsSpend : manualSpend;
  }, [marketingSpends, googleAdsData]);

  const adsDailyChartData = useMemo(() => {
    const grouped = googleAdsData.daily.reduce((acc: any, curr) => {
      if (!acc[curr.date]) acc[curr.date] = { date: curr.date, cost: 0 };
      acc[curr.date].cost += curr.cost;
      return acc;
    }, {});
    return Object.values(grouped).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [googleAdsData.daily]);

  const adsGeoChartData = useMemo(() => {
    const grouped = googleAdsData.geo.reduce((acc: any, curr) => {
      if (!acc[curr.countryId]) acc[curr.countryId] = { countryId: curr.countryId, cost: 0 };
      acc[curr.countryId].cost += curr.cost;
      return acc;
    }, {});
    return Object.values(grouped).sort((a: any, b: any) => b.cost - a.cost).slice(0, 10);
  }, [googleAdsData.geo]);

  const mer = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;
  const missingCostCount = useMemo(() => orders.filter(o => o.missingCost).length, [orders]);

  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => {
      const dateB = parseDate(b.issueDate)?.getTime() || 0;
      const dateA = parseDate(a.issueDate)?.getTime() || 0;
      return dateB - dateA;
    });
  }, [filteredInvoices]);

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-10 animate-in pb-24">
      {summary && (
        <div className="bg-[#2F4D36] rounded-[32px] md:rounded-[40px] p-6 md:p-10 text-white shadow-2xl shadow-[#2F4D36]/30 flex flex-col md:flex-row items-start gap-4 md:gap-8 border-b-4 md:border-b-8 border-white/5 relative overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-700" />
          <div className="bg-white/10 p-3 md:p-5 rounded-2xl md:rounded-3xl backdrop-blur-xl border border-white/10 shadow-lg">
            <Sparkles className="text-white w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div className="flex-1 relative z-10">
            <h3 className="text-xl md:text-2xl font-extrabold mb-1 md:mb-2 tracking-tighter">AI Business Insight</h3>
            <p className="opacity-80 leading-relaxed text-sm md:text-base font-medium italic">
              "Current MER is sitting at {mer.toFixed(2)}x. Marketing costs are {(totalAdSpend / totalRevenue * 100 || 0).toFixed(1)}% of gross revenue.
              {missingCostCount > 0 && ` Warning: ${missingCostCount} orders are missing purchase price data.`}"
            </p>
          </div>
        </div>
      )}

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {[
          { label: 'Gross Revenue', value: `${totalRevenue.toLocaleString()} CZK`, change: 'Real-time', icon: <DollarSign />, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Marketing Spend', value: `${totalAdSpend.toLocaleString()} CZK`, change: 'Google Ads', icon: <Target />, color: 'bg-rose-50 text-rose-600' },
          { label: 'Marketing Eff. (MER)', value: `${mer.toFixed(2)}x`, change: 'Yield', icon: <Zap />, color: 'bg-indigo-50 text-indigo-600' },
          { label: 'OPEX Ledger', value: `€${totalEurExpenditure.toLocaleString(undefined, { minimumFractionDigits: 0 })}`, change: 'Verified', icon: <ReceiptText />, color: 'bg-amber-50 text-amber-600' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 md:hover:-translate-y-2 transition-all duration-500 group">
            <div className="flex justify-between items-start mb-4 md:mb-8">
              <div className={`p-3 md:p-4 rounded-2xl md:rounded-3xl ${stat.color} border border-slate-50 transition-transform group-hover:scale-110`}>
                {React.cloneElement(stat.icon as React.ReactElement<any>, { className: "w-5 h-5 md:w-6 md:h-6" })}
              </div>
              <span className="text-[8px] md:text-[10px] font-extrabold text-[#2F4D36] bg-[#F6F6F0] px-2 md:px-3 py-1 md:py-1.5 rounded-full uppercase tracking-widest border border-slate-100">
                {stat.change}
              </span>
            </div>
            <h4 className="text-slate-400 text-[8px] md:text-[10px] font-extrabold uppercase tracking-[0.2em]">{stat.label}</h4>
            <p className="text-xl md:text-3xl font-extrabold text-[#2F4D36] mt-1 md:mt-2 tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 md:p-12 rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 mb-6 md:mb-12">
          <div className="flex items-center gap-3 md:gap-5">
            <div className="p-3 md:p-4 bg-emerald-50 text-emerald-600 rounded-2xl md:rounded-3xl shadow-sm">
              <TrendingUp className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <h3 className="text-xl md:text-3xl font-extrabold text-[#2F4D36] tracking-tighter">Profitability Velocity</h3>
              <p className="text-slate-400 text-[8px] md:text-[10px] font-extrabold uppercase tracking-[0.2em] mt-0.5 md:mt-1">Net Performance vs Marketing Costs</p>
            </div>
          </div>
        </div>

        <div className="h-[250px] md:h-[400px] flex items-center justify-center border-2 border-dashed border-slate-100 rounded-[24px] md:rounded-[32px] text-slate-300">
          {adsDailyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adsDailyChartData}>
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
                  tickFormatter={(val) => `${(val/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#2F4D36' }}
                />
                <Bar dataKey="cost" fill="#2F4D36" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center">
              <CalendarRange className="mx-auto mb-2 md:mb-4 opacity-20 w-8 h-8 md:w-12 md:h-12" />
              <p className="font-extrabold text-[10px] md:text-xs uppercase tracking-widest">Temporal Analysis Ready</p>
            </div>
          )}
        </div>
      </div>

      {/* Google Ads Geo Section */}
      {adsGeoChartData.length > 0 && (
        <div className="bg-white p-6 md:p-12 rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 md:gap-5 mb-8">
            <div className="p-3 md:p-4 bg-indigo-50 text-indigo-600 rounded-2xl md:rounded-3xl shadow-sm">
              <Target className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <h3 className="text-xl md:text-3xl font-extrabold text-[#2F4D36] tracking-tighter">Geographic Spend</h3>
              <p className="text-slate-400 text-[8px] md:text-[10px] font-extrabold uppercase tracking-[0.2em] mt-0.5 md:mt-1">Top 10 Countries by Google Ads Cost</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={adsGeoChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="countryId" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="cost" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#F6F6F0] text-[#2F4D36]/60 text-[8px] md:text-[9px] uppercase font-extrabold tracking-[0.2em] border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Country ID</th>
                    <th className="px-4 py-3 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {adsGeoChartData.map((row: any) => (
                    <tr key={row.countryId} className="hover:bg-slate-50 text-xs transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-700">Criterion {row.countryId}</td>
                      <td className="px-4 py-3 text-right font-extrabold text-[#2F4D36]">{row.cost.toLocaleString()} CZK</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Feed */}
      <div className="bg-white p-6 md:p-12 rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[450px] md:h-[550px]">
        <h3 className="text-xl md:text-2xl font-extrabold text-[#2F4D36] tracking-tighter mb-6 md:mb-10">Live Ledger Feed</h3>
        <div className="overflow-x-auto flex-1 custom-scrollbar -mx-6 md:mx-0">
          <table className="w-full text-left min-w-[300px]">
            <thead className="bg-[#F6F6F0] text-[#2F4D36]/60 text-[8px] md:text-[9px] uppercase font-extrabold tracking-[0.2em] sticky top-0 border-b border-slate-100 z-10">
              <tr>
                <th className="px-4 md:px-6 py-4 md:py-5">Origin</th>
                <th className="px-4 md:px-6 py-4 md:py-5 text-right">Value</th>
                <th className="px-4 md:px-6 py-4 md:py-5 text-center hidden xs:table-cell">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedInvoices.slice(0, 15).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 text-xs md:text-sm transition-colors group">
                  <td className="px-4 md:px-6 py-4 md:py-5">
                    <div className="flex flex-col space-y-0.5 md:space-y-1">
                      <span className="font-bold text-slate-800 tracking-tight truncate max-w-[120px] md:max-w-[200px]">{inv.client}</span>
                      <span className="text-[8px] md:text-[9px] font-extrabold uppercase text-indigo-500 tracking-widest">{inv.category || 'Uncategorized'}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 md:py-5 text-right font-extrabold text-[#2F4D36]">
                    €{inv.eurValue?.toLocaleString()}
                  </td>
                  <td className="px-4 md:px-6 py-4 md:py-5 text-center hidden xs:table-cell">
                    <div className="inline-flex p-2 bg-slate-50 text-slate-300 rounded-lg group-hover:bg-[#2F4D36] group-hover:text-white transition-all">
                      <RefreshCcw className="w-3 h-3 md:w-3.5 md:h-3.5" />
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
