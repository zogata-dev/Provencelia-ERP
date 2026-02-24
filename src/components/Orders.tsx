
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronDown, ChevronRight, ShoppingBag, TrendingUp, 
  DollarSign, Percent, Info, ExternalLink, Filter, 
  Search, Calendar, X, Box, BarChart3, Truck, Tag, PieChart,
  Package, CreditCard, Layers, AlertTriangle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Legend 
} from 'recharts';
import { Order, SalesChannel } from '../types';

interface OrdersProps {
  orders: Order[];
  onRefresh?: () => void;
  logs?: string[];
}

const formatDate = (date: string | Date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return date.toString();
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
};

const ChannelBadge: React.FC<{ channel: SalesChannel }> = ({ channel }) => {
  const icons: Record<SalesChannel, { svg: React.ReactNode, bg: string }> = {
    amazon: { 
      bg: 'bg-white border border-slate-200',
      svg: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.61 15.68C13.25 16.58 11.45 17.06 9.61 17.06C6.54 17.06 3.86 15.68 2 13.56C2.25 13.88 2.65 14.04 3.06 14.04C3.21 14.04 3.36 14.01 3.5 13.96C6.07 15.68 8.86 16.43 11.39 16.43C13.86 16.43 15.86 15.64 17.29 14.25C17.5 14.04 17.82 13.96 18.11 14.04C18.39 14.11 18.61 14.32 18.68 14.61C18.75 14.89 18.68 15.21 18.46 15.43C17.39 16.5 16.07 17.25 14.61 15.68ZM21.68 14.82C21.46 14.54 21.11 14.39 20.75 14.39C20.39 14.39 20.04 14.54 19.82 14.82C19.61 15.11 19.54 15.46 19.61 15.82C19.68 16.18 19.89 16.5 20.18 16.71C20.46 16.93 20.82 17.07 21.18 17.07C21.54 17.07 21.89 16.93 22.18 16.71C22.46 16.5 22.68 16.18 22.75 15.82C22.82 15.46 22.75 15.11 22.54 14.82H21.68ZM14.86 11.25C14.86 12.64 13.89 13.61 12.5 13.61C11.11 13.61 10.14 12.64 10.14 11.25V7.5C10.14 6.11 11.11 5.14 12.5 5.14C13.89 5.14 14.86 6.11 14.86 7.5V11.25ZM16.86 7.5C16.86 4.89 14.89 2.93 12.5 2.93C10.11 2.93 8.14 4.89 8.14 7.5V11.25C8.14 13.86 10.11 15.82 12.5 15.82C14.89 15.82 16.86 13.86 16.86 11.25V7.5Z" fill="#FF9900"/></svg>
    },
    shopify: { 
      bg: 'bg-[#96bf48]',
      svg: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.5 5.5L15.5 2L8.5 2L6.5 5.5L2 6.5L4 22H20L22 6.5L17.5 5.5ZM12 16C10.3 16 9 14.7 9 13C9 11.3 10.3 10 12 10C13.7 10 15 11.3 15 13C15 14.7 13.7 16 12 16Z" fill="white"/></svg>
    },
    ebay: { 
      bg: 'bg-white border border-slate-200',
      svg: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg"><text x="2" y="16" fontFamily="Arial" fontSize="14" fontWeight="bold"><tspan fill="#E53238">e</tspan><tspan fill="#0064D2">b</tspan><tspan fill="#F5AF02">a</tspan><tspan fill="#86B817">y</tspan></text></svg>
    },
    home24: { 
      bg: 'bg-[#2F4D36]',
      svg: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L2 12H5V21H19V12H22L12 3Z" fill="white"/></svg>
    },
    allegro: { 
      bg: 'bg-[#ff5a00]',
      svg: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12 18L6 12H9V6H15V12H18L12 18Z" fill="white"/></svg>
    },
    kaufland: { 
      bg: 'bg-[#e30613]',
      svg: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" fill="white"/><path d="M8 8H16V16H8V8Z" fill="#e30613"/></svg>
    },
  };

  // Add etsy fallback if it doesn't exist in SalesChannel type yet but is used in data
  const config = icons[channel] || { 
    bg: 'bg-slate-800', 
    svg: <span className="text-white text-[10px] font-bold">{channel.charAt(0).toUpperCase()}</span> 
  };

  return (
    <div className="flex items-center gap-2 group/badge">
      <div className={`w-7 h-7 rounded-full ${config.bg} flex items-center justify-center shadow-sm group-hover/badge:scale-110 transition-transform duration-300 overflow-hidden`}>
        {config.svg}
      </div>
      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest group-hover/badge:text-[#2F4D36] transition-colors">{channel}</span>
    </div>
  );
};

const Orders: React.FC<OrdersProps> = ({ orders, onRefresh, logs }) => {
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filter States
  const [channelFilter, setChannelFilter] = useState<string>('All');
  const [skuSearch, setSkuSearch] = useState<string>('');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [showFilters, setShowFilters] = useState(true);
  
  // Advanced Filter States
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const [minMargin, setMinMargin] = useState<string>('');
  const [maxMargin, setMaxMargin] = useState<string>('');
  const [minProfit, setMinProfit] = useState<string>('');
  const [maxProfit, setMaxProfit] = useState<string>('');

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  };

  const toggleOrder = (id: string) => {
    const next = new Set(expandedOrders);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedOrders(next);
  };

  const [marketplaceFees, setMarketplaceFees] = useState<Record<string, number>>({});
  const [shippingCosts, setShippingCosts] = useState<Record<string, number>>({});

  useEffect(() => {
    const savedFees = localStorage.getItem('provencelia_marketplace_fees');
    if (savedFees) setMarketplaceFees(JSON.parse(savedFees));
    else setMarketplaceFees({ amazon: 15, shopify: 2.9, ebay: 12, home24: 10, allegro: 8, kaufland: 13 });

    const savedShipping = localStorage.getItem('provencelia_shipping_costs_v2');
    if (savedShipping) setShippingCosts(JSON.parse(savedShipping));
    else setShippingCosts({ 'DB Schenker': 35, 'GLS': 9 });
  }, []);

  const calculateProfit = (order: Order) => {
    // Note: discount is already subtracted from totalValue during parsing
    
    // Calculate fee based on marketplace variable if available, otherwise use order.fees
    const feePercentage = marketplaceFees[order.channel] || 0;
    const calculatedFee = feePercentage > 0 ? (order.totalValue * (feePercentage / 100)) : order.fees;
    
    // For shipping, we might not know the carrier from the order object directly, 
    // but if we do, we could use it. For now, if order.shipping is 0, we could use an average or default.
    // Assuming order.shipping is already calculated correctly, or we can override it if needed.
    // Let's use the provided order.shipping for now unless we have a specific carrier.
    const calculatedShipping = order.shipping;

    const profitAbs = order.totalValue - order.tax - calculatedShipping - order.productCost - calculatedFee;
    const profitPct = order.totalValue > 0 ? (profitAbs / order.totalValue) * 100 : 0;
    return { abs: profitAbs, pct: profitPct, calculatedFee, calculatedShipping };
  };

  const filteredOrders = useMemo(() => {
    let result = orders.filter(order => {
      const matchesChannel = channelFilter === 'All' || order.channel === channelFilter;
      const matchesSku = !skuSearch || (order.items && order.items.some(item => 
        item.sku?.toLowerCase().includes(skuSearch.toLowerCase()) || 
        item.name?.toLowerCase().includes(skuSearch.toLowerCase())
      ));
      const matchesOrder = !orderSearch || order.orderNumber.toLowerCase().includes(orderSearch.toLowerCase());
      
      const { abs, pct } = calculateProfit(order);
      
      const matchesMinMargin = minMargin === '' || pct >= parseFloat(minMargin);
      const matchesMaxMargin = maxMargin === '' || pct <= parseFloat(maxMargin);
      const matchesMinProfit = minProfit === '' || abs >= parseFloat(minProfit);
      const matchesMaxProfit = maxProfit === '' || abs <= parseFloat(maxProfit);

      return matchesChannel && matchesSku && matchesOrder && matchesMinMargin && matchesMaxMargin && matchesMinProfit && matchesMaxProfit;
    });

    result.sort((a, b) => {
      const { abs: absA, pct: pctA } = calculateProfit(a);
      const { abs: absB, pct: pctB } = calculateProfit(b);

      switch (sortBy) {
        case 'date_desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date_asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'profit_desc':
          return absB - absA;
        case 'profit_asc':
          return absA - absB;
        case 'margin_desc':
          return pctB - pctA;
        case 'margin_asc':
          return pctA - pctB;
        case 'revenue_desc':
          return b.totalValue - a.totalValue;
        case 'revenue_asc':
          return a.totalValue - b.totalValue;
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return result;
  }, [orders, channelFilter, skuSearch, orderSearch, sortBy, minMargin, maxMargin, minProfit, maxProfit]);

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

  const [timeGrouping, setTimeGrouping] = useState<'day' | 'week' | 'month'>('day');

  const chartData = useMemo(() => {
    const dataMap = new Map<string, any>();
    const channels = new Set<string>();

    filteredOrders.forEach(o => {
      const d = new Date(o.date);
      let dateKey = '';
      
      if (timeGrouping === 'day') {
        dateKey = d.toLocaleDateString();
      } else if (timeGrouping === 'week') {
        const firstDay = new Date(d.setDate(d.getDate() - d.getDay() + 1));
        dateKey = `Week of ${firstDay.toLocaleDateString()}`;
      } else if (timeGrouping === 'month') {
        dateKey = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
      }

      if (!dataMap.has(dateKey)) {
        dataMap.set(dateKey, { date: dateKey });
      }
      const entry = dataMap.get(dateKey);
      
      // Convert to EUR for chart
      let eurRate = 1;
      const currency = o.currency.toUpperCase();
      if (currency === 'CZK') {
        eurRate = 1 / 25.3; // Approximate rate, ideally we'd pass rates down to Orders component
      } else if (currency === 'PLN') {
        eurRate = 1 / 4.3; // Approximate rate
      } else if (currency === 'HUF') {
        eurRate = 1 / 400; // Approximate rate
      }
      
      const valueInEur = o.totalValue * eurRate;
      
      // Initialize channel if not present
      if (!entry[o.channel]) entry[o.channel] = 0;
      
      // Add revenue to channel
      entry[o.channel] += valueInEur;
      
      // Add profit to entry (for profit chart)
      const { abs } = calculateProfit(o);
      const profitInEur = abs * eurRate;
      
      if (!entry.profit) entry.profit = 0;
      entry.profit += profitInEur;
      
      // Add counts
      if (!entry.ordersCount) entry.ordersCount = 0;
      entry.ordersCount += 1;
      
      if (!entry.productsCount) entry.productsCount = 0;
      const itemsCount = o.items.reduce((sum, item) => sum + item.quantity, 0);
      entry.productsCount += itemsCount;
      
      channels.add(o.channel);
    });

    return {
      data: Array.from(dataMap.values()).reverse(),
      channels: Array.from(channels)
    };
  }, [filteredOrders, timeGrouping]);

  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({});

  const toggleSeries = (dataKey: string) => {
    setHiddenSeries(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  };

  const CHANNEL_COLORS: Record<string, string> = {
    amazon: '#FF9900',
    shopify: '#95BF47',
    ebay: '#E53238',
    home24: '#2F4D36',
    allegro: '#FF5A00',
    kaufland: '#E60014',
    other: '#cbd5e1'
  };

  return (
    <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-10 animate-in pb-24">
      <div className="flex flex-col lg:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2F4D36] tracking-tighter flex items-center gap-4">
            <BarChart3 className="text-[#2F4D36]" size={36} />
            Marketplace Analysis
          </h1>
          <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-[0.3em] mt-2">
            Net Profitability Synchronized from Production Sheet
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {onRefresh && (
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isRefreshing ? 'Syncing...' : 'Sync Orders'}
            </button>
          )}
          <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'list' ? 'bg-[#2F4D36] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              List View
            </button>
            <button 
              onClick={() => setViewMode('analytics')}
              className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'analytics' ? 'bg-[#2F4D36] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="bg-white p-6 lg:p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col gap-6 lg:gap-8 animate-slide-in">
          <div className="flex flex-col lg:flex-row items-end gap-6 lg:gap-8">
            <div className="space-y-3 w-full lg:w-auto">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block">Sales Channel</label>
              <select 
                value={channelFilter} 
                onChange={(e) => setChannelFilter(e.target.value)}
                className="w-full bg-[#F6F6F0] border-none rounded-3xl px-6 py-4 text-sm font-extrabold text-[#2F4D36] uppercase tracking-widest outline-none min-w-[180px] focus:ring-2 focus:ring-[#2F4D36]/10 transition-all cursor-pointer"
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

            <div className="space-y-3 flex-1 w-full">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block">Search Orders</label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search by Order ID..." 
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-16 pr-6 py-4 bg-[#F6F6F0] border-none rounded-3xl text-sm font-bold text-[#2F4D36] outline-none focus:ring-2 focus:ring-[#2F4D36]/10 transition-all"
                  />
                </div>
                <div className="relative flex-1">
                  <Tag className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    type="text" 
                    placeholder="Filter by SKU..." 
                    value={skuSearch}
                    onChange={(e) => setSkuSearch(e.target.value)}
                    className="w-full pl-16 pr-6 py-4 bg-[#F6F6F0] border-none rounded-3xl text-sm font-bold text-[#2F4D36] outline-none focus:ring-2 focus:ring-[#2F4D36]/10 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-100 flex flex-col lg:flex-row items-end gap-6 lg:gap-8">
            <div className="space-y-3 w-full lg:w-auto">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block">Sort By</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-[#F6F6F0] border-none rounded-3xl px-6 py-4 text-sm font-extrabold text-[#2F4D36] uppercase tracking-widest outline-none min-w-[180px] focus:ring-2 focus:ring-[#2F4D36]/10 transition-all cursor-pointer"
              >
                <option value="date_desc">Date (Newest)</option>
                <option value="date_asc">Date (Oldest)</option>
                <option value="profit_desc">Profit (High to Low)</option>
                <option value="profit_asc">Profit (Low to High)</option>
                <option value="margin_desc">Margin (High to Low)</option>
                <option value="margin_asc">Margin (Low to High)</option>
                <option value="revenue_desc">Revenue (High to Low)</option>
                <option value="revenue_asc">Revenue (Low to High)</option>
              </select>
            </div>
            
            <div className="space-y-3 flex-1 w-full">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block">Margin Range (%)</label>
              <div className="flex gap-4">
                <input 
                  type="number" 
                  placeholder="Min %" 
                  value={minMargin}
                  onChange={(e) => setMinMargin(e.target.value)}
                  className="w-full px-6 py-4 bg-[#F6F6F0] border-none rounded-3xl text-sm font-bold text-[#2F4D36] outline-none focus:ring-2 focus:ring-[#2F4D36]/10 transition-all"
                />
                <input 
                  type="number" 
                  placeholder="Max %" 
                  value={maxMargin}
                  onChange={(e) => setMaxMargin(e.target.value)}
                  className="w-full px-6 py-4 bg-[#F6F6F0] border-none rounded-3xl text-sm font-bold text-[#2F4D36] outline-none focus:ring-2 focus:ring-[#2F4D36]/10 transition-all"
                />
              </div>
            </div>
            
            <div className="space-y-3 flex-1 w-full">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block">Profit Range (Abs)</label>
              <div className="flex gap-4">
                <input 
                  type="number" 
                  placeholder="Min Profit" 
                  value={minProfit}
                  onChange={(e) => setMinProfit(e.target.value)}
                  className="w-full px-6 py-4 bg-[#F6F6F0] border-none rounded-3xl text-sm font-bold text-[#2F4D36] outline-none focus:ring-2 focus:ring-[#2F4D36]/10 transition-all"
                />
                <input 
                  type="number" 
                  placeholder="Max Profit" 
                  value={maxProfit}
                  onChange={(e) => setMaxProfit(e.target.value)}
                  className="w-full px-6 py-4 bg-[#F6F6F0] border-none rounded-3xl text-sm font-bold text-[#2F4D36] outline-none focus:ring-2 focus:ring-[#2F4D36]/10 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Logs */}
      {logs && logs.length > 0 && (
        <div className="bg-[#121a14] p-4 rounded-3xl border border-white/10 font-mono text-[10px] text-emerald-400 h-32 overflow-y-auto shadow-inner">
          {logs.map((log, i) => (
            <div key={i} className="mb-1 opacity-80 hover:opacity-100 transition-opacity">
              <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
              {log}
            </div>
          ))}
        </div>
      )}

      {viewMode === 'analytics' ? (
        <div className="flex flex-col gap-8">
           <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-[450px] flex flex-col">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-extrabold text-[#2F4D36]">Revenue Trend & Volume</h3>
               <div className="flex bg-slate-100 p-1 rounded-xl">
                 <button 
                   onClick={() => setTimeGrouping('day')}
                   className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${timeGrouping === 'day' ? 'bg-white text-[#2F4D36] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   Day
                 </button>
                 <button 
                   onClick={() => setTimeGrouping('week')}
                   className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${timeGrouping === 'week' ? 'bg-white text-[#2F4D36] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   Week
                 </button>
                 <button 
                   onClick={() => setTimeGrouping('month')}
                   className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${timeGrouping === 'month' ? 'bg-white text-[#2F4D36] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   Month
                 </button>
               </div>
             </div>
             <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData.data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val.toLocaleString()}`} />
                    <YAxis yAxisId="right" orientation="right" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }} 
                      formatter={(value: any, name: any) => {
                        if (name === 'Orders' || name === 'ordersCount') return [`${value} ks`, 'Orders'];
                        if (name === 'Products' || name === 'productsCount') return [`${value} ks`, 'Products'];
                        return [`€${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name];
                      }}
                    />
                    <Legend 
                      onClick={(e) => toggleSeries(e.dataKey as string)}
                      wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', paddingTop: '20px' }}
                    />
                    {chartData.channels.map((channel) => (
                      <Bar 
                        key={channel} 
                        dataKey={channel} 
                        stackId="a" 
                        yAxisId="left"
                        fill={CHANNEL_COLORS[channel] || CHANNEL_COLORS.other} 
                        radius={[2, 2, 0, 0]} 
                        hide={hiddenSeries[channel]}
                      />
                    ))}
                    <Line 
                      type="monotone" 
                      dataKey="ordersCount" 
                      name="Orders"
                      yAxisId="right" 
                      stroke="#6366f1" 
                      strokeWidth={3} 
                      dot={{ r: 4, strokeWidth: 2 }} 
                      hide={hiddenSeries['ordersCount']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="productsCount" 
                      name="Products"
                      yAxisId="right" 
                      stroke="#ec4899" 
                      strokeWidth={3} 
                      dot={{ r: 4, strokeWidth: 2 }} 
                      hide={hiddenSeries['productsCount']}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
             </div>
           </div>
           
           <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-[400px] flex flex-col">
             <h3 className="text-lg font-extrabold text-[#2F4D36] mb-6">Profit Margins (EUR)</h3>
             <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val.toLocaleString()}`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }} 
                      formatter={(value: any) => [`€${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]}
                    />
                    <Bar dataKey="profit" fill="#10b981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
           </div>
        </div>
      ) : (
        /* Orders Table Container */
        <div className="bg-white rounded-[48px] border border-slate-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-[#F6F6F0] text-[#2F4D36]/60 uppercase font-extrabold text-[9px] tracking-[0.3em] border-b border-slate-100">
                <tr>
                  <th className="px-6 lg:px-10 py-8 w-16"></th>
                  <th className="px-6 py-8">Order ID / Date</th>
                  <th className="px-6 py-8">Channel Source</th>
                  <th className="px-6 py-8 text-right">Gross Total</th>
                  <th className="px-6 py-8 text-right">Net Profit</th>
                  <th className="px-6 lg:px-10 py-8 text-right">Margin (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOrders.length > 0 ? filteredOrders.map(order => {
                  const { abs, pct } = calculateProfit(order);
                  const isExpanded = expandedOrders.has(order.id);
                  return (
                    <React.Fragment key={order.id}>
                      <tr 
                        className={`group hover:bg-slate-50 transition-all cursor-pointer ${isExpanded ? 'bg-slate-50' : ''}`}
                        onClick={() => toggleOrder(order.id)}
                      >
                        <td className="px-6 lg:px-10 py-8 text-slate-300">
                          <ChevronRight size={24} className={`transition-transform duration-300 ${isExpanded ? 'rotate-90 text-[#2F4D36]' : ''}`} />
                        </td>
                        <td className="px-6 py-8">
                          <div className="font-extrabold text-[#2F4D36] tracking-tighter text-sm flex items-center gap-2">
                            {order.orderNumber}
                            {order.hasMissingCogs && (
                              <span title="Missing COG for some items">
                                <AlertTriangle size={14} className="text-amber-500" />
                              </span>
                            )}
                            {order.isShipped && (
                              <span title="Shipped (Shipping calculated)" className="bg-emerald-50 text-emerald-600 p-1 rounded-full">
                                <Truck size={12} />
                              </span>
                            )}
                            {order.channel === 'shopify' && (
                              <a 
                                href={`https://admin.shopify.com/store/your-store-name/orders/${order.id}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-indigo-600 transition-colors ml-2"
                                title="Open in Shopify"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                          <div className="text-[9px] text-slate-400 font-extrabold uppercase tracking-[0.2em] mt-1">{formatDate(order.date)}</div>
                        </td>
                        <td className="px-6 py-8"><ChannelBadge channel={order.channel} /></td>
                        <td className="px-6 py-8 text-right font-extrabold text-[#2F4D36] text-sm">
                          {order.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {order.currency}
                        </td>
                        <td className={`px-6 py-8 text-right font-extrabold text-sm ${abs > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {order.currency}
                        </td>
                        <td className="px-6 lg:px-10 py-8 text-right">
                           <span className={`px-5 py-2 rounded-2xl font-extrabold text-[10px] uppercase tracking-widest ${pct > 25 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                             {pct.toFixed(1)}%
                           </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/50 animate-in fade-in zoom-in-95 duration-300">
                          <td colSpan={6} className="px-6 lg:px-10 py-6">
                            <div className="flex flex-col gap-6">
                              {/* Order Items Table */}
                              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                  <thead className="bg-slate-50 text-slate-400 uppercase font-extrabold text-[9px] tracking-widest border-b border-slate-100">
                                    <tr>
                                      <th className="px-4 py-3">SKU</th>
                                      <th className="px-4 py-3 text-right">Qty</th>
                                      <th className="px-4 py-3 text-right">Unit Price</th>
                                      <th className="px-4 py-3 text-right">Unit COG</th>
                                      <th className="px-4 py-3 text-right">Total Price</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                    {order.items.map((item, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 text-xs font-bold text-slate-700">{item.sku}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600 text-right">{item.quantity}x</td>
                                        <td className="px-4 py-3 text-xs text-slate-600 text-right">
                                          {(item.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {order.currency}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600 text-right">
                                          {item.cogs !== undefined ? (
                                            <span className="text-slate-500">{(item.cogs).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {order.currency}</span>
                                          ) : (
                                            <span className="text-amber-500 font-bold flex items-center justify-end gap-1">
                                              <AlertTriangle size={10} /> Missing
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-bold text-[#2F4D36] text-right">
                                          {(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {order.currency}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Order Financial Summary */}
                              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative">
                                  <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Product Cost (COG)</div>
                                  <div className="text-lg font-bold text-slate-700">-{order.productCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {order.currency}</div>
                                  {order.hasMissingCogs && (
                                    <div className="absolute top-4 right-4 text-amber-500 flex items-center gap-1 text-[10px] font-bold">
                                      <AlertTriangle size={12} />
                                      <span>Missing Data</span>
                                    </div>
                                  )}
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                  <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Platform Fees</div>
                                  <div className="text-lg font-bold text-slate-700">-{calculateProfit(order).calculatedFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {order.currency}</div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                  <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">VAT (DPH)</div>
                                  <div className="text-lg font-bold text-slate-700">-{order.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {order.currency}</div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                  <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Shipping Cost</div>
                                  <div className="text-lg font-bold text-slate-700">-{calculateProfit(order).calculatedShipping.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {order.currency}</div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                  <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Shipping Revenue</div>
                                  <div className="text-lg font-bold text-emerald-600">+{((order.shippingRevenue || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {order.currency}</div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                  <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Discount</div>
                                  <div className="text-lg font-bold text-rose-500">-{order.discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {order.currency}</div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }) : (
                  <tr><td colSpan={6} className="px-10 py-40 text-center text-slate-300 font-extrabold uppercase tracking-widest">No order data synchronized</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
