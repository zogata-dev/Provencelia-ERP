import React, { useMemo, useState } from 'react';
import { Search, Plus, ExternalLink, X, Tag, ChevronLeft, ChevronRight, CheckSquare, Square, Trash2, Layers, Edit3, Save, DollarSign, User, FileText, CheckCircle } from 'lucide-react';
import { Invoice } from '../types';

interface InvoicesProps {
  driveInvoices: Invoice[];
  categories: string[];
  onAddCategory: (cat: string) => void;
  onUpdateInvoice: (id: string, updates: Partial<Invoice>) => void;
  onAddManualInvoice: (invoice: Partial<Invoice>) => void;
  onBulkUpdateCategory: (ids: string[], cat: string) => void;
  onBulkDelete: (ids: string[]) => void;
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

const Invoices: React.FC<InvoicesProps> = ({ 
  driveInvoices, categories, onAddCategory, onUpdateInvoice, onAddManualInvoice, onBulkUpdateCategory, onBulkDelete 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  
  // Editor state
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formState, setFormState] = useState<Partial<Invoice>>({});

  const filteredInvoices = useMemo(() => {
    return driveInvoices.filter(i => {
      const s = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || i.client.toLowerCase().includes(s) || (i.vs && i.vs.includes(s));
      const matchesCategory = categoryFilter === 'All Categories' || i.category === categoryFilter;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      const dateA = a.issueDate.split('.').reverse().join('-');
      const dateB = b.issueDate.split('.').reverse().join('-');
      return dateB.localeCompare(dateA);
    });
  }, [driveInvoices, searchTerm, categoryFilter]);

  const pagedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedIds.size === pagedInvoices.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(pagedInvoices.map(i => i.id)));
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const startEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setFormState(inv);
  };

  const startAdd = () => {
    setIsAddingNew(true);
    const today = new Date();
    setFormState({
      client: '',
      amount: 0,
      currency: 'CZK',
      vs: '',
      issueDate: `${today.getDate()}.${today.getMonth() + 1}.${today.getFullYear()}`,
      category: categories[0],
      isReinvoice: false
    });
  };

  const handleSave = () => {
    if (editingInvoice) {
      onUpdateInvoice(editingInvoice.id, formState);
    } else if (isAddingNew) {
      onAddManualInvoice(formState);
    }
    setEditingInvoice(null);
    setIsAddingNew(false);
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in pb-24">
      {/* Search & Action Bar */}
      <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 md:gap-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-slate-300 w-[18px] h-[18px] md:w-5 md:h-5" />
          <input 
            type="text" placeholder="Search vendor, VS..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 md:pl-16 pr-4 md:pr-6 py-3 md:py-4 bg-[#F6F6F0] border-none rounded-2xl md:rounded-3xl text-sm font-medium focus:ring-2 focus:ring-[#2F4D36]/10 outline-none transition-all"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <select 
            value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="bg-[#F6F6F0] border-none rounded-2xl md:rounded-3xl px-6 md:px-8 py-3 md:py-4 text-xs md:text-sm font-black text-[#2F4D36] uppercase tracking-widest outline-none cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <option value="All Categories">All Allocations</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <button 
            onClick={startAdd}
            className="bg-[#2F4D36] text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl md:rounded-3xl text-xs md:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 hover:opacity-90 transition-all shadow-xl shadow-[#2F4D36]/20 active:scale-95"
          >
            <Plus className="w-[18px] h-[18px] md:w-5 md:h-5" /> Add Entry
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-[#2F4D36] text-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] flex flex-col sm:flex-row items-center justify-between shadow-2xl animate-slide-in relative overflow-hidden gap-4">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2 bg-emerald-500" />
          <div className="flex items-center gap-3 md:gap-5 ml-2 md:ml-4">
            <Layers className="w-[18px] h-[18px] md:w-[22px] md:h-[22px] text-emerald-400" />
            <span className="font-black text-[10px] md:text-xs uppercase tracking-widest">Selected {selectedIds.size}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
            <select 
              onChange={e => { onBulkUpdateCategory(Array.from(selectedIds), e.target.value); setSelectedIds(new Set()); }}
              className="bg-white/10 border border-white/20 rounded-xl md:rounded-2xl px-3 md:px-5 py-2 md:py-2.5 text-[8px] md:text-[10px] font-black uppercase tracking-widest outline-none hover:bg-white/20 transition-colors"
            >
              <option value="">Move Allocation...</option>
              {categories.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
            </select>
            <button 
              onClick={() => { if(confirm('Permanently delete selected records?')) { onBulkDelete(Array.from(selectedIds)); setSelectedIds(new Set()); } }}
              className="bg-rose-500/10 text-rose-300 hover:bg-rose-50 hover:text-white px-4 md:px-6 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 md:gap-2"
            >
              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /> Batch Delete
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="p-2 md:p-2.5 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-[18px] h-[18px] md:w-[22px] md:h-[22px]" />
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-xl overflow-hidden relative">
        <div className="overflow-x-auto custom-scrollbar -mx-4 md:mx-0">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-[#F6F6F0] text-[#2F4D36]/60 uppercase font-black text-[8px] md:text-[9px] tracking-[0.2em] md:tracking-[0.3em] border-b border-slate-100">
              <tr>
                <th className="px-4 md:px-10 py-6 md:py-8 w-12 md:w-16 text-center">
                  <button onClick={toggleSelectAll} className="text-[#2F4D36] hover:scale-110 transition-transform">
                    {selectedIds.size === pagedInvoices.length && pagedInvoices.length > 0 ? <CheckSquare className="w-[18px] h-[18px] md:w-5 md:h-5 text-emerald-600"/> : <Square className="w-[18px] h-[18px] md:w-5 md:h-5"/>}
                  </button>
                </th>
                <th className="px-4 md:px-6 py-6 md:py-8">Date</th>
                <th className="px-4 md:px-6 py-6 md:py-8">Vendor / VS</th>
                <th className="px-4 md:px-6 py-6 md:py-8 hidden sm:table-cell">Allocation</th>
                <th className="px-4 md:px-10 py-6 md:py-8 text-right">Value (EUR)</th>
                <th className="px-4 md:px-10 py-6 md:py-8 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pagedInvoices.length > 0 ? pagedInvoices.map(inv => (
                <tr key={inv.id} className={`group hover:bg-slate-50 transition-all ${selectedIds.has(inv.id) ? 'bg-emerald-50/50' : ''} ${inv.source === 'local' ? 'border-l-4 md:border-l-[6px] border-l-amber-400' : ''}`}>
                  <td className="px-4 md:px-10 py-4 md:py-6 text-center">
                    <button onClick={() => toggleSelect(inv.id)} className={`transition-all ${selectedIds.has(inv.id) ? 'text-emerald-600 scale-110' : 'text-slate-200 group-hover:text-slate-300'}`}>
                      {selectedIds.has(inv.id) ? <CheckSquare className="w-[18px] h-[18px] md:w-5 md:h-5"/> : <Square className="w-[18px] h-[18px] md:w-5 md:h-5"/>}
                    </button>
                  </td>
                  <td className="px-4 md:px-6 py-4 md:py-6 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-tight">{formatDate(inv.issueDate)}</td>
                  <td className="px-4 md:px-6 py-4 md:py-6">
                    <div className="flex flex-col">
                      <div className="font-black text-[#2F4D36] tracking-tighter text-xs md:text-sm flex items-center gap-1.5 md:gap-2">
                        <span className="truncate max-w-[100px] md:max-w-[200px]">{inv.client}</span>
                        {inv.source === 'local' && <span title="Manually Entered" className="text-amber-500"><Edit3 size={10} /></span>}
                      </div>
                      <div className="text-[8px] md:text-[10px] font-mono text-slate-300 uppercase tracking-widest mt-0.5">VS: {inv.vs || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 md:py-6 hidden sm:table-cell">
                    <span className="bg-slate-50 text-[#2F4D36] px-3 md:px-4 py-1 md:py-1.5 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest border border-slate-100 group-hover:bg-white transition-colors">
                      {inv.category}
                    </span>
                  </td>
                  <td className="px-4 md:px-10 py-4 md:py-6 text-right font-mono">
                     <div className="flex flex-col">
                       <span className="font-black text-xs md:text-sm text-[#2F4D36]">€{inv.eurValue?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                       <span className="text-[8px] md:text-[9px] text-slate-300 font-bold">{inv.amount.toLocaleString()} {inv.currency}</span>
                     </div>
                  </td>
                  <td className="px-4 md:px-10 py-4 md:py-6 text-center">
                    <div className="flex items-center justify-center gap-1 md:gap-1.5">
                      <button 
                        onClick={() => startEdit(inv)}
                        className="p-2 md:p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl md:rounded-2xl transition-all"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                      </button>
                      {inv.driveId && (
                        <a href={`https://drive.google.com/file/d/${inv.driveId}/view`} target="_blank" className="p-2 md:p-3 text-slate-300 hover:text-[#2F4D36] hover:bg-slate-100 rounded-xl md:rounded-2xl transition-all">
                          <ExternalLink className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-10 py-20 md:py-32 text-center grayscale opacity-30">
                    <div className="flex flex-col items-center gap-4 md:gap-6">
                      <FileText className="w-12 h-12 md:w-16 md:h-16" />
                      <div className="space-y-1 md:space-y-2">
                        <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">Ledger is empty</p>
                        <p className="text-[8px] md:text-[10px] font-medium tracking-widest">Adjust filters or sync Drive</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-6 md:p-10 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.3em] text-center sm:text-left">
            Page {currentPage} of {totalPages} <span className="mx-1 md:mx-2">/</span> {filteredInvoices.length} Entries
          </span>
          <div className="flex gap-2 md:gap-3">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p-1))} 
              className="p-2 md:p-3 bg-white rounded-xl md:rounded-2xl border border-slate-200 hover:bg-[#2F4D36] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-200 transition-all shadow-sm"
            >
              <ChevronLeft className="w-4.5 h-4.5 md:w-5 md:h-5"/>
            </button>
            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} 
              className="p-2 md:p-3 bg-white rounded-xl md:rounded-2xl border border-slate-200 hover:bg-[#2F4D36] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-200 transition-all shadow-sm"
            >
              <ChevronRight className="w-4.5 h-4.5 md:w-5 md:h-5"/>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Overlay Modal */}
      {(editingInvoice || isAddingNew) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 bg-[#1a2b1e]/60 backdrop-blur-xl animate-in">
          <div className="bg-white w-full max-w-xl rounded-[32px] md:rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20 animate-slide-in max-h-[90vh] flex flex-col">
            <div className="bg-[#2F4D36] p-6 md:p-10 text-white flex justify-between items-start relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 p-8 md:p-12 opacity-10"><FileText className="w-20 h-20 md:w-30 md:h-30" /></div>
              <div className="relative z-10">
                <h3 className="text-xl md:text-3xl font-black tracking-tighter">{isAddingNew ? 'Create New Entry' : 'Adjust Record'}</h3>
                <p className="text-white/50 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mt-1 md:mt-3">Manual Fiscal Correction</p>
              </div>
              <button onClick={() => { setEditingInvoice(null); setIsAddingNew(false); }} className="p-2 md:p-3 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all relative z-10">
                <X className="w-6 h-6 md:w-7 md:h-7" />
              </button>
            </div>
            
            <div className="p-6 md:p-10 space-y-6 md:space-y-8 bg-[#F6F6F0]/30 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2 md:space-y-2.5 sm:col-span-2">
                  <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <User className="w-2.5 h-2.5 md:w-3 md:h-3" /> Legal Entity / Vendor
                  </label>
                  <input 
                    type="text" 
                    value={formState.client || ''} 
                    onChange={e => setFormState({...formState, client: e.target.value})}
                    placeholder="e.g. Amazon Web Services"
                    className="w-full bg-white border-none rounded-2xl md:rounded-3xl px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold text-[#2F4D36] outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-[#2F4D36]/10 transition-all"
                  />
                </div>
                
                <div className="space-y-2 md:space-y-2.5">
                  <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <DollarSign className="w-2.5 h-2.5 md:w-3 md:h-3" /> Gross Amount
                  </label>
                  <input 
                    type="number" 
                    value={formState.amount || 0} 
                    onChange={e => setFormState({...formState, amount: parseFloat(e.target.value)})}
                    className="w-full bg-white border-none rounded-2xl md:rounded-3xl px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold text-[#2F4D36] outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-[#2F4D36]/10 transition-all"
                  />
                </div>

                <div className="space-y-2 md:space-y-2.5">
                  <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Currency</label>
                  <select 
                    value={formState.currency || 'CZK'} 
                    onChange={e => setFormState({...formState, currency: e.target.value})}
                    className="w-full bg-white border-none rounded-2xl md:rounded-3xl px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold text-[#2F4D36] outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-[#2F4D36]/10 transition-all cursor-pointer"
                  >
                    <option value="CZK">CZK</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="PLN">PLN</option>
                  </select>
                </div>

                <div className="space-y-2 md:space-y-2.5">
                  <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">VS / Reference</label>
                  <input 
                    type="text" 
                    value={formState.vs || ''} 
                    onChange={e => setFormState({...formState, vs: e.target.value})}
                    className="w-full bg-white border-none rounded-2xl md:rounded-3xl px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-mono font-bold text-[#2F4D36] outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-[#2F4D36]/10 transition-all"
                  />
                </div>

                <div className="space-y-2 md:space-y-2.5">
                  <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date (D.M.YYYY)</label>
                  <input 
                    type="text" 
                    value={formState.issueDate || ''} 
                    onChange={e => setFormState({...formState, issueDate: e.target.value})}
                    className="w-full bg-white border-none rounded-2xl md:rounded-3xl px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold text-[#2F4D36] outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-[#2F4D36]/10 transition-all"
                    placeholder="D.M.YYYY"
                  />
                </div>

                <div className="space-y-2 md:space-y-2.5 sm:col-span-2">
                  <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cost Allocation</label>
                  <select 
                    value={formState.category || ''} 
                    onChange={e => setFormState({...formState, category: e.target.value})}
                    className="w-full bg-white border-none rounded-2xl md:rounded-3xl px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold text-[#2F4D36] outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-[#2F4D36]/10 transition-all cursor-pointer"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-center gap-3 md:gap-4 bg-[#2F4D36]/5 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-[#2F4D36]/10">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formState.isReinvoice || false} 
                      onChange={e => setFormState({...formState, isReinvoice: e.target.checked})}
                      className="w-5 h-5 md:w-6 md:h-6 accent-[#2F4D36] rounded-lg cursor-pointer transition-all"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] md:text-xs font-black text-[#2F4D36] uppercase tracking-widest block">Mark as Reinvoice</span>
                    <span className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest">Pass-through to client</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 md:pt-6 flex flex-col sm:flex-row gap-3 md:gap-4 shrink-0">
                <button 
                  onClick={() => { setEditingInvoice(null); setIsAddingNew(false); }}
                  className="flex-1 bg-white text-slate-400 py-4 md:py-5 rounded-2xl md:rounded-[24px] text-[10px] md:text-xs font-black uppercase tracking-[0.2em] border border-slate-100 hover:bg-slate-50 transition-colors active:scale-95"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 sm:flex-[2] bg-[#2F4D36] text-white py-4 md:py-5 px-6 md:px-16 rounded-2xl md:rounded-[24px] text-[10px] md:text-xs font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all flex items-center justify-center gap-2 md:gap-3 shadow-2xl shadow-[#2F4D36]/30 active:scale-95"
                >
                  <CheckCircle className="w-4 h-4 md:w-4.5 md:h-4.5" /> {isAddingNew ? 'Create' : 'Apply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;