
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  ChevronDown, ChevronRight, ShoppingBag, TrendingUp, 
  DollarSign, Percent, Info, ExternalLink, Filter, 
  Search, Calendar, X, Box, BarChart3, Truck, Tag, PieChart,
  Package, CreditCard, Layers, AlertTriangle
} from 'lucide-react';
import { Order, SalesChannel } from '../types';

interface OrdersProps {
  orders: Order[];
}

const formatDate = (date: string | Date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return date.toString();
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
};

const ChannelBadge: React.FC<{ channel: SalesChannel }> = ({ channel }) => {
  const styles: Record<SalesChannel, { logo: string, bg: string }> = {
    amazon: { logo: 'a', bg: 'bg-[#FF9900]' },
    shopify: { logo: 's', bg: 'bg-[#96bf48]' },
    ebay: { logo: 'e', bg: 'bg-[#0064D2]' },
    home24: { logo: 'h', bg: 'bg-[#2F4D36]' },
    allegro: { logo: 'al', bg: 'bg-[#ff5a00]' },
    kaufland: { logo: 'k', bg: 'bg-[#e30613]' },
  };

  const config = styles[channel] || styles['shopify'];

  return (
    <div className="flex items-center gap-2 group/badge">
      <div className={`w-7 h-7 rounded-full ${config.bg} flex items-center justify-center text-white text-[12px] font-extrabold uppercase shadow-sm group-hover/badge:scale-110 transition-transform duration-300`}>
        {config.logo}
      </div>
      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest group-hover/badge:text-[#2F4D36] transition-colors">{channel}</span>
    </div>
  );
};

const Orders: React.FC<OrdersProps> = ({ orders }) => {
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  
  // Filter States
  const [channelFilter, setChannelFilter] = useState<string>('All');
  const [skuSearch, setSkuSearch] = useState<string>('');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [dateRange, setDateRange] = useState<number>(30);
  const [showFilters, setShowFilters] = useState(true);

  const toggleOrder = (id: string) => {
    const next = new Set(expandedOrders);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedOrders(next);
  };

  const calculateProfit = (order: Order) => {
    const profitAbs = order.totalValue - order.tax - order.shipping - order.productCost - order.fees - order.discount;
    const profitPct = order.totalValue > 0 ? (profitAbs / order.totalValue) * 100 : 0;
    return { abs: profitAbs, pct: profitPct };
  };

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - dateRange);

    return orders.filter(order => {
      const orderDate = new Date(order.date);
      const matchesDate = dateRange === 0 || orderDate >= cutoff;
      const matchesChannel = channelFilter === 'All' || order.channel === channelFilter;
      const matchesSku = !skuSearch || (order.items && order.items.some(item => 
        item.sku?.toLowerCase().includes(skuSearch.toLowerCase()) || 
        item.name?.toLowerCase().includes(skuSearch.toLowerCase())
      ));
      const matchesOrder = !orderSearch || order.orderNumber?.toLowerCase().includes(orderSearch.toLowerCase());
      return matchesDate && matchesChannel && matchesSku && matchesOrder;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, channelFilter, skuSearch, orderSearch, dateRange]);

  const stats = useMemo(() => {
    if (filteredOrders.length === 0) return { avgMargin: 0, totalNet: 0, bestChannel: 'N/A' };
    let totalAbsProfit = 0;
    let totalRevenue = 0;
    filteredOrders.forEach(o => {
      const { abs } = calculateProfit(o);
      totalAbsProfit += abs;
      totalRevenue += o.totalValue;
    });
    return {
      avgMargin: totalRevenue > 0 ? (totalAbsProfit / totalRevenue) * 100 : 0,
      totalNet: totalAbsProfit,
      bestChannel: 'Active'
    };
  }, [filteredOrders]);

  const chartData = useMemo(() => {
    const dataMap: Record<string, any> = {};
    filteredOrders.forEach(order => {
      const d = new Date(order.date);
      if (isNaN(d.getTime())) return;
      
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      
      if (!dataMap[monthKey]) {
        dataMap[monthKey] = {
          sortKey: monthKey,
          name: monthLabel,
          Revenue: 0,
          Profit: 0,
          Fees: 0,
          ProductCost: 0
        };
      }
      
      const { abs } = calculateProfit(order);
      dataMap[monthKey].Revenue += order.totalValue;
      dataMap[monthKey].Profit += abs;
      dataMap[monthKey].Fees += order.fees;
      dataMap[monthKey].ProductCost += order.productCost;
    });
    
    return Object.values(dataMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [filteredOrders]);

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-10 animate-in pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#2F4D36] tracking-tighter flex items-center gap-3 md:gap-4">
            <BarChart3 className="text-[#2F4D36] w-[28px] h-[28px] md:w-9 md:h-9" />
            Order Analysis
          </h1>
          <p className="text-slate-400 text-[8px] md:text-[10px] font-extrabold uppercase tracking-[0.2em] md:tracking-[0.3em] mt-1 md:mt-2">
            Net Profitability Synchronized from Production Sheet
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-end gap-4 md:gap-6 animate-slide-in">
          <div className="space-y-2 md:space-y-3">
            <label className="text-[8px] md:text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block">Time Period</label>
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="w-full bg-[#F6F6F0] border-none rounded-2xl md:rounded-3xl px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-extrabold text-[#2F4D36] uppercase tracking-widest outline-none focus:ring-2 focus:ring-[#2F4D36]/10 transition-all cursor-pointer"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
              <option value={365}>Last Year</option>
              <option value={0}>All Time</option>
            </select>
          </div>

          <div className="space-y-2 md:space-y-3">
            <label className="text-[8px] md:text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block">Sales Channel</label>
            <select 
              value={channelFilter} 
              onChange={(e) => setChannelFilter(e.target.value)}
              className="w-full bg-[#F6F6F0] border-none rounded-2xl md:rounded-3xl px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-extrabold text-[#2F4D36] uppercase tracking-widest outline-none focus:ring-2 focus:ring-[#2F4D36]/10 transition-all cursor-pointer"
            >
              <option value="All">All Channels</option>
              <option value="amazon">Amazon</option>
              <option value="shopify">Shopify</option>
              <option value="ebay">eBay</option>
              <option value="home24">Home24</option>
              <option value="allegro">Allegro</option>
              <option value="kaufland">Kaufland</option>
            </select>
          </div>

          <div className="space-y-2 md:space-y-3">
            <label className="text-[8px] md:text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block">SKU Analysis</label>
            <div className="relative">
              <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-slate-300 w-4.5 h-4.5 md:w-5 md:h-5" />
              <input 
                type="text" 
                placeholder="Lookup SKU..." 
                value={skuSearch}
                onChange={(e) => setSkuSearch(e.target.value)}
                className="w-full pl-12 md:pl-16 pr-4 md:pr-6 py-3 md:py-4 bg-[#F6F6F0] border-none rounded-2xl md:rounded-3xl text-xs md:text-sm font-bold text-[#2F4D36] outline-none focus:ring-2 focus:ring-[#2F4D36]/10 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2 md:space-y-3">
            <label className="text-[8px] md:text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block">Order Number</label>
            <div className="relative">
              <Tag className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-slate-300 w-4.5 h-4.5 md:w-5 md:h-5" />
              <input 
                type="text" 
                placeholder="Order ID..." 
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-12 md:pl-16 pr-4 md:pr-6 py-3 md:py-4 bg-[#F6F6F0] border-none rounded-2xl md:rounded-3xl text-xs md:text-sm font-bold text-[#2F4D36] outline-none focus:ring-2 focus:ring-[#2F4D36]/10 transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* Sales & Profit Chart Section */}
      <div className="bg-white p-6 md:p-12 rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-sm animate-slide-in">
        <div className="flex items-center gap-3 md:gap-5 mb-6 md:mb-10">
          <div className="p-3 md:p-4 bg-emerald-50 text-emerald-600 rounded-2xl md:rounded-3xl shadow-sm">
            <TrendingUp className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-extrabold text-[#2F4D36] tracking-tighter">Sales & Profit Overview</h3>
            <p className="text-slate-400 text-[8px] md:text-[10px] font-extrabold uppercase tracking-[0.2em] mt-0.5 md:mt-1">Revenue, Profit, Fees & Costs Breakdown</p>
          </div>
        </div>
        <div className="h-[300px] md:h-[400px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1E8" />
                <XAxis dataKey="name" fontSize={8} fontWeight={700} tickLine={false} axisLine={false} stroke="#94a3b8" />
                <YAxis fontSize={8} fontWeight={700} tickLine={false} axisLine={false} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                  formatter={(value: any) => `${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, paddingTop: '10px' }} />
                <Bar dataKey="Revenue" fill="#2F4D36" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Profit" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Fees" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                <Bar dataKey="ProductCost" name="Product Cost" fill="#6366f1" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[24px] md:rounded-[32px] text-slate-300">
              <BarChart3 className="mb-2 md:mb-4 opacity-20 w-8 h-8 md:w-12 md:h-12" />
              <p className="font-extrabold text-[10px] md:text-xs uppercase tracking-widest">No Data Available for Chart</p>
            </div>
          )}
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar -mx-6 md:mx-0">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-[#F6F6F0] text-[#2F4D36]/60 uppercase font-extrabold text-[8px] md:text-[9px] tracking-[0.2em] md:tracking-[0.3em] border-b border-slate-100">
              <tr>
                <th className="px-4 md:px-10 py-6 md:py-8 w-12 md:w-16"></th>
                <th className="px-4 md:px-6 py-6 md:py-8">Order / Date</th>
                <th className="px-4 md:px-6 py-6 md:py-8">Channel</th>
                <th className="px-4 md:px-6 py-6 md:py-8 text-right">Gross</th>
                <th className="px-4 md:px-6 py-6 md:py-8 text-right">Net</th>
                <th className="px-4 md:px-10 py-6 md:py-8 text-right">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.length > 0 ? filteredOrders.map(order => {
                const { abs, pct } = calculateProfit(order);
                return (
                  <tr key={order.id} className="group hover:bg-slate-50 transition-all">
                    <td className="px-4 md:px-10 py-6 md:py-8 text-slate-300"><ChevronRight className="w-4.5 h-4.5 md:w-6 md:h-6" /></td>
                    <td className="px-4 md:px-6 py-6 md:py-8">
                      <div className="flex items-center gap-2">
                        <div className="font-extrabold text-[#2F4D36] tracking-tighter text-xs md:text-sm">{order.orderNumber}</div>
                        {order.missingCost && (
                          <div className="group/warn relative">
                            <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500 animate-pulse cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-900 text-white text-[9px] font-bold rounded-xl opacity-0 group-hover/warn:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                              <div className="flex items-center gap-2 mb-1 text-amber-400">
                                <AlertTriangle size={10} /> MISSING COST DATA
                              </div>
                              SKU not found in purchase price ledger. Margin calculation is estimated.
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-[8px] md:text-[9px] text-slate-400 font-extrabold uppercase tracking-[0.1em] md:tracking-[0.2em] mt-0.5 md:mt-1">{formatDate(order.date)}</div>
                    </td>
                    <td className="px-4 md:px-6 py-6 md:py-8"><ChannelBadge channel={order.channel} /></td>
                    <td className="px-4 md:px-6 py-6 md:py-8 text-right font-extrabold text-[#2F4D36] text-xs md:text-sm">
                      {order.totalValue.toLocaleString()}
                    </td>
                    <td className={`px-4 md:px-6 py-6 md:py-8 text-right font-extrabold text-xs md:text-sm ${abs > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {abs.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 md:px-10 py-6 md:py-8 text-right">
                       <span className={`px-3 md:px-5 py-1 md:py-2 rounded-xl md:rounded-2xl font-extrabold text-[8px] md:text-[10px] uppercase tracking-widest ${pct > 25 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                         {pct.toFixed(0)}%
                       </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6} className="px-10 py-20 md:py-40 text-center text-slate-300 font-extrabold uppercase tracking-widest">No order data synchronized</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;
