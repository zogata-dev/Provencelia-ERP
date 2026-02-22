
import React from 'react';
import { Leaf, ChevronRight, RefreshCw, Bell, UserCircle, Menu, X, LogOut, Users, ShieldAlert, AlertCircle, BellRing } from 'lucide-react';
import { NAV_ITEMS } from '../constants';
import { ViewState, User, Anomaly } from '../types';
import Cookies from 'js-cookie';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewState;
  setActiveView: (view: ViewState) => void;
  appName: string;
  isSyncing?: boolean;
  currentUser?: User | null;
  anomalies?: Anomaly[];
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, appName, isSyncing, currentUser, anomalies = [] }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);

  const handleLogout = () => {
    Cookies.remove('user_profile');
    Cookies.remove('google_tokens');
    window.location.reload();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6F6F0]">
      {/* Sidebar - Desktop Only */}
      <aside 
        className={`hidden md:flex ${isSidebarOpen ? 'w-72' : 'w-24'} bg-[#2F4D36] border-r border-white/5 transition-all duration-500 ease-in-out flex-col shadow-2xl z-20 relative`}
      >
        <div className="p-8 flex items-center gap-4 border-b border-white/10 mb-6">
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

        <nav className="flex-1 px-4 space-y-1.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ViewState)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${
                activeView === item.id 
                  ? 'bg-white text-[#2F4D36] font-bold shadow-xl shadow-black/20' 
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className={`shrink-0 transition-transform group-hover:scale-110 ${activeView === item.id ? 'text-[#2F4D36]' : 'text-white/30'}`}>
                {item.icon}
              </span>
              {isSidebarOpen && <span className="text-sm font-bold tracking-tight">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 transition-all group"
          >
            <ChevronRight className={`transition-transform duration-500 group-hover:translate-x-1 ${isSidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 md:h-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-4 md:px-10 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="md:hidden w-8 h-8 bg-[#2F4D36] rounded-lg flex items-center justify-center text-white mr-1">
              <Leaf className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-lg md:text-xl font-extrabold text-[#2F4D36] capitalize tracking-tighter truncate max-w-[120px] md:max-w-none">
              {activeView.replace('_', ' ')}
            </h2>
            <div className="hidden sm:block h-4 w-px bg-slate-200 mx-2" />
            <span className="hidden sm:block text-slate-400 text-[10px] font-extrabold uppercase tracking-[0.2em]">Workspace</span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-6">
             {isSyncing ? (
               <div className="flex items-center gap-2 px-2 md:px-4 py-1 md:py-2 bg-emerald-50 rounded-xl md:rounded-2xl border border-emerald-100 animate-pulse">
                 <RefreshCw className="w-3 h-3 md:w-4 md:h-4 text-emerald-600 animate-spin" />
                 <span className="text-[8px] md:text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest hidden xs:inline">Syncing</span>
               </div>
             ) : (
               <div className="flex items-center gap-2 px-2 md:px-4 py-1 md:py-2 bg-[#F6F6F0] rounded-xl md:rounded-2xl border border-slate-100 group cursor-help">
                 <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                 <span className="text-[8px] md:text-[10px] font-extrabold text-[#2F4D36] uppercase tracking-widest hidden xs:inline">Online</span>
               </div>
             )}
             
             <div className="flex items-center gap-1 md:gap-2">
                <div className="relative">
                  <button 
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className={`p-2 hover:bg-slate-50 rounded-xl transition-all relative ${isNotificationsOpen ? 'text-[#2F4D36] bg-slate-50' : 'text-slate-400'}`}
                  >
                    <Bell className="w-[18px] h-[18px] md:w-5 md:h-5" />
                    {anomalies.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-rose-500 rounded-full border-2 border-white" />
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {isNotificationsOpen && (
                    <div className="absolute top-full right-0 mt-2 w-72 md:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#2F4D36]">System Alerts</h4>
                        {anomalies.length > 0 && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[8px] font-black rounded-full">
                            {anomalies.length} NEW
                          </span>
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {anomalies.length > 0 ? (
                          <div className="divide-y divide-slate-50">
                            {anomalies.map((anomaly) => (
                              <div key={anomaly.id} className="p-4 hover:bg-slate-50 transition-colors flex gap-3">
                                <div className={`shrink-0 p-1.5 rounded-lg h-fit ${
                                  anomaly.type === 'critical' ? 'bg-rose-100 text-rose-600' :
                                  anomaly.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                  'bg-blue-100 text-blue-600'
                                }`}>
                                  {anomaly.type === 'critical' ? <ShieldAlert size={14} /> : 
                                   anomaly.type === 'warning' ? <AlertCircle size={14} /> : 
                                   <BellRing size={14} />}
                                </div>
                                <div>
                                  <p className="text-[11px] font-bold text-slate-800 leading-tight">{anomaly.title}</p>
                                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{anomaly.description}</p>
                                  <p className="text-[8px] text-slate-300 mt-2 font-bold uppercase tracking-tighter">
                                    {new Date(anomaly.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-10 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Bell className="text-slate-200 w-6 h-6" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No active alerts</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 md:gap-3 pl-1.5 pr-2 md:pl-2 md:pr-4 py-1 md:py-1.5 bg-slate-50 rounded-full border border-slate-100 transition-all group relative">
                  {currentUser?.picture ? (
                    <img src={currentUser.picture} alt={currentUser.name} className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover" />
                  ) : (
                    <UserCircle className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-[9px] md:text-[10px] font-black text-slate-700 hidden sm:inline leading-none truncate max-w-[80px]">
                      {currentUser?.name || 'Guest'}
                    </span>
                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
                      {currentUser?.role || 'Viewer'}
                    </span>
                  </div>
                  
                  {/* Logout Dropdown */}
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
                    {currentUser?.role === 'admin' && (
                      <button 
                        onClick={() => setActiveView(ViewState.TEAM)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors"
                      >
                        <Users size={16} className="text-slate-400" />
                        Team Management
                      </button>
                    )}
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
                    >
                      <LogOut size={16} />
                      Log Out
                    </button>
                  </div>
                </div>
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#F6F6F0]/50 pb-20 md:pb-0">
          {children}
        </div>

        {/* Mobile Navigation - Bottom Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 py-2 flex justify-around items-center z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ViewState)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                activeView === item.id 
                  ? 'text-[#2F4D36] bg-emerald-50/50' 
                  : 'text-slate-400'
              }`}
            >
              <span className={`${activeView === item.id ? 'scale-110' : 'scale-100'} transition-transform`}>
                {React.cloneElement(item.icon as React.ReactElement<any>, { className: "w-5 h-5" })}
              </span>
              <span className="text-[9px] font-bold mt-1 uppercase tracking-tighter">{item.label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
};

export default Layout;
