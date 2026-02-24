
import React, { useState } from 'react';
import { Leaf, ChevronRight, RefreshCw, Bell, UserCircle, Menu, X, LogOut, Settings, User, MessageSquare, AlertTriangle } from 'lucide-react';
import { NAV_ITEMS } from '../constants';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewState;
  setActiveView: (view: ViewState) => void;
  appName: string;
  isSyncing?: boolean;
  onOpenChat: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, appName, isSyncing, onOpenChat }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Dummy notifications
  const notifications = [
    { id: 1, title: 'Low Margin Alert', msg: 'Order #1024 has margin < 10%', type: 'warning' },
    { id: 2, title: 'Sync Complete', msg: '25 new invoices processed', type: 'success' },
    { id: 3, title: 'Anomaly Detected', msg: 'Unusual spike in shipping costs', type: 'error' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6F6F0]">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#2F4D36] flex items-center justify-between px-4 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#2F4D36]">
            <Leaf size={18} />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">Provencelia</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar (Desktop & Mobile) */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          ${isSidebarOpen ? 'lg:w-72' : 'lg:w-24'} 
          ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
          bg-[#2F4D36] border-r border-white/5 transition-all duration-500 ease-in-out flex flex-col shadow-2xl
          pt-16 lg:pt-0
        `}
      >
        <div className="hidden lg:flex p-8 items-center gap-4 border-b border-white/10 mb-6">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#2F4D36] shrink-0 shadow-lg shadow-black/20 transform hover:rotate-12 transition-transform">
            <Leaf size={28} />
          </div>
          {isSidebarOpen && (
            <div className="animate-in overflow-hidden">
              <span className="font-extrabold text-white truncate tracking-tighter text-xl block leading-none">{appName}</span>
              <span className="text-white/40 text-[9px] font-extrabold uppercase tracking-[0.2em] mt-1 block">Enterprise ERP</span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id as ViewState);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${
                activeView === item.id 
                  ? 'bg-white text-[#2F4D36] font-bold shadow-xl shadow-black/20' 
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className={`shrink-0 transition-transform group-hover:scale-110 ${activeView === item.id ? 'text-[#2F4D36]' : 'text-white/30'}`}>
                {item.icon}
              </span>
              {(isSidebarOpen || isMobileMenuOpen) && <span className="text-sm font-bold tracking-tight">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="hidden lg:block p-6 border-t border-white/10">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 transition-all group"
          >
            <ChevronRight className={`transition-transform duration-500 group-hover:translate-x-1 ${isSidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative pt-16 lg:pt-0">
        {/* Header (Desktop) */}
        <header className="hidden lg:flex h-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 items-center justify-between px-10 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-[#2F4D36] capitalize tracking-tighter">{activeView.replace('_', ' ')}</h2>
            <div className="h-4 w-px bg-slate-200 mx-2" />
            <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-[0.2em]">Workspace</span>
          </div>
          
          <div className="flex items-center gap-6">
             {isSyncing ? (
               <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100 animate-pulse">
                 <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
                 <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest">AI Sync Active</span>
               </div>
             ) : (
               <div className="flex items-center gap-3 px-4 py-2 bg-[#F6F6F0] rounded-2xl border border-slate-100 group cursor-help">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                 <span className="text-[10px] font-extrabold text-[#2F4D36] uppercase tracking-widest">Network Active</span>
               </div>
             )}
             
             <div className="flex items-center gap-2 relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 text-slate-400 hover:text-[#2F4D36] hover:bg-slate-50 rounded-xl transition-all relative"
                >
                  <Bell size={20} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                </button>

                {showNotifications && (
                  <div className="absolute top-14 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-in">
                    <div className="px-4 py-3 border-b border-slate-50 font-bold text-[#2F4D36] text-xs uppercase tracking-wider">Notifications</div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} className="p-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors cursor-pointer">
                          <div className="flex items-start gap-3">
                            <AlertTriangle size={16} className={n.type === 'error' ? 'text-rose-500' : 'text-amber-500'} />
                            <div>
                              <h5 className="text-xs font-bold text-slate-700">{n.title}</h5>
                              <p className="text-[10px] text-slate-400 mt-1">{n.msg}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="relative">
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 pl-2 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-100 transition-all"
                  >
                    <UserCircle size={24} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">Administrator</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute top-14 right-0 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-in">
                      <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-slate-600 text-sm font-medium transition-colors">
                        <User size={16} /> Profile
                      </button>
                      <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-slate-600 text-sm font-medium transition-colors">
                        <Settings size={16} /> Settings
                      </button>
                      <div className="h-px bg-slate-100 my-1" />
                      <button className="w-full flex items-center gap-3 p-3 hover:bg-rose-50 text-rose-600 rounded-xl text-sm font-medium transition-colors">
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#F6F6F0]/50 p-4 lg:p-0">
          {children}
        </div>

        {/* Floating AI Chat Button */}
        <button 
          onClick={onOpenChat}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#2F4D36] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40 group"
        >
          <MessageSquare size={24} />
          <span className="absolute right-full mr-4 bg-white text-[#2F4D36] px-3 py-1 rounded-xl text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Ask AI Assistant
          </span>
        </button>
      </main>
    </div>
  );
};

export default Layout;
