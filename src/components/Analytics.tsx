
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChevronDown, ChevronRight, ExternalLink, Layers, CalendarRange, PieChart as PieChartIcon, ArrowUpRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { Invoice } from '../types';
import { CATEGORIES } from '../constants';

interface AnalyticsProps {
  invoices: Invoice[];
}

const Analytics: React.FC<AnalyticsProps> = ({ invoices }) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(['2025']));
  const [excludeReinvoices, setExcludeReinvoices] = useState(false);
  const COLORS = ['#2F4D36', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#10b981', '#f43f5e', '#64748b'];

  const filteredInvoices = useMemo(() => {
    return excludeReinvoices ? invoices.filter(inv => !inv.isReinvoice) : invoices;
  }, [invoices, excludeReinvoices]);

  const toggleKey = (key: string) => {
    const next = new Set(expandedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedKeys(next);
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr) return { year: 'Unknown', month: 'Unknown', monthLong: 'Unknown' };
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      return { 
        year: parts[2], 
        month: d.toLocaleString('en-US', { month: 'short' }), 
        monthLong: d.toLocaleString('en-US', { month: 'long' }) 
      };
    }
    const d = new Date(dateStr);
    return { 
      year: d.getFullYear().toString(), 
      month: d.toLocaleString('en-US', { month: 'short' }), 
      monthLong: d.toLocaleString('en-US', { month: 'long' }) 
    };
  };

  const categoryData = useMemo(() => {
    const data = filteredInvoices.reduce((acc: any[], inv) => {
      const catName = inv.category || 'Uncategorized';
      const existing = acc.find(a => a.name === catName);
      if (existing) existing.value += inv.eurValue || 0;
      else acc.push({ name: catName, value: inv.eurValue || 0 });
      return acc;
    }, []);
    return data.sort((a, b) => b.value - a.value).map(d => ({ ...d, value: Number(d.value.toFixed(2)) }));
  }, [filteredInvoices]);

  const monthlyData = useMemo(() => {
    const monthsMap: Record<string, any> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthsMap[key] = { month: label, sortKey: key };
      CATEGORIES.forEach(cat => monthsMap[key][cat] = 0);
    }
    filteredInvoices.forEach(inv => {
      const d = inv.issueDate.split('.');
      if (d.length !== 3) return;
      const monthKey = `${d[2]}-${d[1].padStart(2, '0')}`;
      if (monthsMap[monthKey]) {
        const catName = inv.category || 'Other';
        monthsMap[monthKey][catName] = Number(((monthsMap[monthKey][catName] || 0) + (inv.eurValue || 0)).toFixed(2));
      }
    });
    return Object.values(monthsMap).sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey));
  }, [filteredInvoices]);

  const pivotTree = useMemo(() => {
    const tree: any = {};
    filteredInvoices.forEach(inv => {
      const { year, monthLong: month } = parseDate(inv.issueDate);
      const cat = inv.category || 'Ostatní';
      const vendor = inv.client || 'Neznámý dodavatel';
      const val = inv.eurValue || 0;

      if (!tree[year]) tree[year] = { total: 0, reinvoice: 0, expense: 0, months: {} };
      if (!tree[year].months[month]) tree[year].months[month] = { total: 0, reinvoice: 0, expense: 0, categories: {} };
      if (!tree[year].months[month].categories[cat]) tree[year].months[month].categories[cat] = { total: 0, reinvoice: 0, expense: 0, vendors: {} };
      if (!tree[year].months[month].categories[cat].vendors[vendor]) tree[year].months[month].categories[cat].vendors[vendor] = { total: 0, reinvoice: 0, expense: 0, items: [] };

      const nodeY = tree[year];
      const nodeM = nodeY.months[month];
      const nodeC = nodeM.categories[cat];
      const nodeV = nodeC.vendors[vendor];

      [nodeY, nodeM, nodeC, nodeV].forEach(n => {
        n.total += val;
        if (inv.isReinvoice) n.reinvoice += val;
        else n.expense += val;
      });
      nodeV.items.push(inv);
    });
    return tree;
  }, [filteredInvoices]);

  return (
    <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-12 animate-in pb-24">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-[#2F4D36] tracking-tighter flex items-center gap-5">
            <PieChartIcon size={44} /> Deep Financial Intelligence
          </h1>
          <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px] mt-3">Advanced Fiscal Drilldown & Allocation Matrix</p>
        </div>
        <button 
          onClick={() => setExcludeReinvoices(!excludeReinvoices)}
          className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${excludeReinvoices ? 'bg-[#2F4D36] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
        >
          {excludeReinvoices ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          {excludeReinvoices ? 'Reinvoices Excluded' : 'Reinvoices Included'}
        </button>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        <div className="bg-white p-6 lg:p-12 rounded-[48px] border border-slate-100 shadow-sm flex flex-col h-[450px]">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[24px] shadow-sm">
              <CalendarRange size={24} />
            </div>
            <h3 className="text-xl font-black text-[#2F4D36] tracking-tighter uppercase tracking-[0.05em]">Expense Momentum (EUR)</h3>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1E8" />
                <XAxis dataKey="month" fontSize={10} fontWeight={700} tickLine={false} axisLine={false} stroke="#94a3b8" />
                <YAxis fontSize={10} fontWeight={700} tickLine={false} axisLine={false} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', padding: '20px' }}
                  formatter={(val: any) => `€${val.toLocaleString()}`}
                />
                {CATEGORIES.slice(0, 5).map((cat, i) => (
                  <Bar key={cat} dataKey={cat} stackId="a" fill={COLORS[i % COLORS.length]} radius={[5, 5, 0, 0]} barSize={35} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 lg:p-12 rounded-[48px] border border-slate-100 shadow-sm flex flex-col h-[450px]">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-[24px] shadow-sm">
              <ArrowUpRight size={24} />
            </div>
            <h3 className="text-xl font-black text-[#2F4D36] tracking-tighter uppercase tracking-[0.05em]">Weighting by Category</h3>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F1E8" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={10} fontWeight={800} width={130} tickLine={false} axisLine={false} stroke="#2F4D36" />
                <Tooltip formatter={(val: any) => `€${val.toLocaleString()}`} />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={30}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pivot Ledger Drilldown */}
      <div className="bg-white rounded-[56px] border border-slate-100 shadow-2xl overflow-hidden animate-in">
        <div className="p-6 lg:p-12 border-b border-slate-50 flex flex-col lg:flex-row items-start lg:items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-[#2F4D36] text-white rounded-[24px] shadow-lg shadow-[#2F4D36]/20">
              <Layers size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#2F4D36] tracking-tighter">Production Pivot Ledger</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Hierarchical Transaction Drilldown</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
             <div className="flex items-center gap-3"><div className="w-4 h-4 bg-white border-2 border-slate-200 rounded-md" /> OPEX (Expense)</div>
             <div className="flex items-center gap-3"><div className="w-4 h-4 bg-amber-50 border-2 border-amber-200 rounded-md" /> REINVOICE</div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#2F4D36] text-white/40 text-[9px] font-black uppercase tracking-[0.4em]">
                <th className="px-12 py-8 border-r border-white/5">Hierarchy: Period / Allocation / Vendor</th>
                <th className="px-12 py-8 text-right w-52">Net OPEX</th>
                <th className="px-12 py-8 text-right w-52">Period Total</th>
                <th className="px-12 py-8 text-center w-24">Link</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {Object.keys(pivotTree).sort().reverse().map(year => {
                const yearKey = year;
                const isYearExpanded = expandedKeys.has(yearKey);

                return (
                  <React.Fragment key={yearKey}>
                    <tr className="bg-slate-100/50 font-black text-[#2F4D36] border-b border-slate-200/40">
                      <td className="px-12 py-6 flex items-center gap-5">
                        <button onClick={() => toggleKey(yearKey)} className="hover:scale-125 transition-transform p-1.5 bg-white rounded-xl shadow-sm">
                          {isYearExpanded ? <ChevronDown size={22} /> : <ChevronRight size={22} />}
                        </button>
                        <span className="text-xl tracking-tighter">Fiscal Year {year}</span>
                      </td>
                      <td className="px-12 py-6 text-right text-xl tracking-tighter">€{pivotTree[year].expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-12 py-6 text-right text-xl tracking-tighter">€{pivotTree[year].total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td></td>
                    </tr>

                    {isYearExpanded && Object.keys(pivotTree[year].months).map(month => {
                      const monthKey = `${year}-${month}`;
                      const isMonthExpanded = expandedKeys.has(monthKey);
                      const mData = pivotTree[year].months[month];

                      return (
                        <React.Fragment key={monthKey}>
                          <tr className="bg-white border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="px-12 py-5 pl-24 font-bold text-slate-700 flex items-center gap-5">
                              <button onClick={() => toggleKey(monthKey)} className="p-1 hover:bg-slate-100 rounded-lg">
                                {isMonthExpanded ? <ChevronDown size={18} className="text-indigo-500" /> : <ChevronRight size={18} className="text-slate-300" />}
                              </button>
                              <span className="tracking-tight">{month}</span>
                            </td>
                            <td className="px-12 py-5 text-right font-bold text-slate-400">€{mData.expense.toLocaleString()}</td>
                            <td className="px-12 py-5 text-right font-black text-[#2F4D36]">€{mData.total.toLocaleString()}</td>
                            <td></td>
                          </tr>

                          {isMonthExpanded && Object.keys(mData.categories).map(cat => {
                            const catKey = `${monthKey}-${cat}`;
                            const isCatExpanded = expandedKeys.has(catKey);
                            const cData = mData.categories[cat];

                            return (
                              <React.Fragment key={catKey}>
                                <tr className="bg-white border-b border-slate-50/50">
                                  <td className="px-12 py-4 pl-36 text-slate-400 font-bold flex items-center gap-5 text-xs">
                                    <button onClick={() => toggleKey(catKey)} className="p-1 hover:bg-slate-100 rounded-lg">
                                      {isCatExpanded ? <ChevronDown size={14} className="text-amber-500" /> : <ChevronRight size={14} className="text-slate-200" />}
                                    </button>
                                    <span className="uppercase tracking-widest">{cat}</span>
                                  </td>
                                  <td className="px-12 py-4 text-right text-slate-400 italic font-medium text-xs">€{cData.expense.toLocaleString()}</td>
                                  <td className="px-12 py-4 text-right text-slate-500 font-black text-xs">€{cData.total.toLocaleString()}</td>
                                  <td></td>
                                </tr>

                                {isCatExpanded && Object.keys(cData.vendors).map(vendor => {
                                  const vData = cData.vendors[vendor];
                                  return (
                                    <React.Fragment key={`${catKey}-${vendor}`}>
                                      {vData.items.map((item: any) => (
                                        <tr key={item.id} className={`hover:bg-indigo-50/30 text-[11px] transition-colors border-b border-slate-50/30 ${item.isReinvoice ? 'bg-amber-50/40' : ''}`}>
                                          <td className="px-12 py-3 pl-48 text-slate-500">
                                            <span className="font-black text-[#2F4D36] tracking-tight">{vendor}</span>
                                            <span className="mx-3 opacity-20">|</span>
                                            <span className="opacity-40 font-mono tracking-tighter">ID: {item.vs || item.id}</span>
                                          </td>
                                          <td className="px-12 py-3 text-right font-mono font-bold text-slate-400">
                                            {item.isReinvoice ? '---' : `€${item.eurValue.toFixed(2)}`}
                                          </td>
                                          <td className="px-12 py-3 text-right font-mono font-black text-[#2F4D36]">
                                            €{item.eurValue.toFixed(2)}
                                          </td>
                                          <td className="px-12 py-3 text-center">
                                            <a href={`https://drive.google.com/file/d/${item.driveId}/view`} target="_blank" className="text-slate-300 hover:text-[#2F4D36] p-1 rounded-lg transition-all">
                                              <ExternalLink size={16} />
                                            </a>
                                          </td>
                                        </tr>
                                      ))}
                                    </React.Fragment>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
