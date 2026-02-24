import React, { useMemo, useState } from 'react';
import { Search, Plus, ExternalLink, X, Tag, ChevronLeft, ChevronRight, CheckSquare, Square, Trash2, Layers, Edit3, Save, DollarSign, User, FileText, CheckCircle, MessageSquare, Filter } from 'lucide-react';
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

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const filteredInvoices = useMemo(() => {
    return driveInvoices.filter(i => {
      const s = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || i.client.toLowerCase().includes(s) || (i.vs && i.vs.includes(s));
      const matchesCategory = categoryFilter === 'All Categories' || i.category === categoryFilter;
      
      let matchesDate = true;
      if (dateFrom || dateTo) {
        const parts = i.issueDate.split('.');
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          if (dateFrom && d < new Date(dateFrom)) matchesDate = false;
          if (dateTo && d > new Date(dateTo)) matchesDate = false;
        }
      }

      let matchesAmount = true;
      if (minAmount && i.amount < parseFloat(minAmount)) matchesAmount = false;
      if (maxAmount && i.amount > parseFloat(maxAmount)) matchesAmount = false;

      return matchesSearch && matchesCategory && matchesDate && matchesAmount;
    }).sort((a, b) => {
      const dateA = a.issueDate.split('.').reverse().join('-');
      const dateB = b.issueDate.split('.').reverse().join('-');
      return dateB.localeCompare(dateA);
    });
  }, [driveInvoices, searchTerm, categoryFilter, dateFrom, dateTo, minAmount, maxAmount]);

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

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [noteText, setNoteText] = useState('');

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      setFormState({ ...formState, category: newCategoryName.trim() });
      setIsAddingCategory(false);
      setNewCategoryName('');
    }
  };

  const addNote = () => {
    if (!noteText.trim()) return;
    const newNote = { text: noteText, date: new Date().toISOString() };
    const updatedNotes = [...(formState.notes || []), newNote];
    setFormState({ ...formState, notes: updatedNotes });
    setNoteText('');
  };

  const removeNote = (index: number) => {
    const updatedNotes = (formState.notes || []).filter((_, i) => i !== index);
    setFormState({ ...formState, notes: updatedNotes });
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
    <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-8 animate-in pb-24">
      {/* Search & Action Bar */}
      <div className="space-y-4">
        <div className="bg-white p-6 lg:p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col lg:flex-row items-center gap-6">
          <div className="relative w-full lg:flex-1 min-w-0">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" placeholder="Search by vendor, VS or reference..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-6 py-4 bg-[#F6F6F0] border-none rounded-3xl text-sm font-medium focus:ring-2 focus:ring-[#2F4D36]/10 outline-none transition-all"
            />
          </div>
          <div className="flex w-full lg:w-auto gap-4 flex-col lg:flex-row">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`w-full lg:w-auto px-8 py-4 rounded-3xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${isFilterOpen ? 'bg-[#2F4D36] text-white' : 'bg-[#F6F6F0] text-[#2F4D36] hover:bg-slate-100'}`}
            >
              <Filter size={20} /> Filters
            </button>
            
            <button 
              onClick={startAdd}
              className="w-full lg:w-auto bg-[#2F4D36] text-white px-8 py-4 rounded-3xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-[#2F4D36]/20 active:scale-95"
            >
              <Plus size={20} /> Add Entry
            </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {isFilterOpen && (
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</label>
              <select 
                value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                className="w-full bg-[#F6F6F0] border-none rounded-2xl px-4 py-3 text-xs font-bold text-[#2F4D36] outline-none"
              >
                <option value="All Categories">All Allocations</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date Range</label>
              <div className="flex gap-2">
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full bg-[#F6F6F0] border-none rounded-2xl px-4 py-3 text-xs font-bold text-[#2F4D36] outline-none" />
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full bg-[#F6F6F0] border-none rounded-2xl px-4 py-3 text-xs font-bold text-[#2F4D36] outline-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount Range</label>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={minAmount} onChange={e => setMinAmount(e.target.value)} className="w-full bg-[#F6F6F0] border-none rounded-2xl px-4 py-3 text-xs font-bold text-[#2F4D36] outline-none" />
                <input type="number" placeholder="Max" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} className="w-full bg-[#F6F6F0] border-none rounded-2xl px-4 py-3 text-xs font-bold text-[#2F4D36] outline-none" />
              </div>
            </div>
            <div className="flex items-end">
              <button 
                onClick={() => { setCategoryFilter('All Categories'); setDateFrom(''); setDateTo(''); setMinAmount(''); setMaxAmount(''); setSearchTerm(''); }}
                className="w-full bg-slate-100 text-slate-400 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-[#2F4D36] text-white p-6 rounded-[32px] flex items-center justify-between shadow-2xl animate-slide-in relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-emerald-500" />
          <div className="flex items-center gap-5 ml-4">
            <Layers size={22} className="text-emerald-400" />
            <span className="font-black text-xs uppercase tracking-widest">Selected {selectedIds.size} records</span>
          </div>
          <div className="flex items-center gap-4">
            <select 
              onChange={e => { onBulkUpdateCategory(Array.from(selectedIds), e.target.value); setSelectedIds(new Set()); }}
              className="bg-white/10 border border-white/20 rounded-2xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none hover:bg-white/20 transition-colors"
            >
              <option value="">Move Allocation...</option>
              {categories.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
            </select>
            <button 
              onClick={() => { if(confirm('Permanently delete selected records?')) { onBulkDelete(Array.from(selectedIds)); setSelectedIds(new Set()); } }}
              className="bg-rose-500/10 text-rose-300 hover:bg-rose-50 hover:text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <Trash2 size={16} /> Batch Delete
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="p-2.5 hover:bg-white/10 rounded-full transition-colors">
              <X size={22} />
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-[48px] border border-slate-100 shadow-xl overflow-hidden relative">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-[#F6F6F0] text-[#2F4D36]/60 uppercase font-black text-[9px] tracking-[0.3em] border-b border-slate-100">
              <tr>
                <th className="px-10 py-8 w-16 text-center">
                  <button onClick={toggleSelectAll} className="text-[#2F4D36] hover:scale-110 transition-transform">
                    {selectedIds.size === pagedInvoices.length && pagedInvoices.length > 0 ? <CheckSquare size={20} className="text-emerald-600"/> : <Square size={20}/>}
                  </button>
                </th>
                <th className="px-6 py-8">Issue Date</th>
                <th className="px-6 py-8">Vendor / VS Reference</th>
                <th className="px-6 py-8">Cost Allocation</th>
                <th className="px-10 py-8 text-right">Net Value (EUR)</th>
                <th className="px-10 py-8 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pagedInvoices.length > 0 ? pagedInvoices.map(inv => (
                <tr key={inv.id} className={`group hover:bg-slate-50 transition-all ${selectedIds.has(inv.id) ? 'bg-emerald-50/50' : ''} ${inv.source === 'local' ? 'border-l-[6px] border-l-amber-400' : ''}`}>
                  <td className="px-10 py-6 text-center">
                    <button onClick={() => toggleSelect(inv.id)} className={`transition-all ${selectedIds.has(inv.id) ? 'text-emerald-600 scale-110' : 'text-slate-200 group-hover:text-slate-300'}`}>
                      {selectedIds.has(inv.id) ? <CheckSquare size={20}/> : <Square size={20}/>}
                    </button>
                  </td>
                  <td className="px-6 py-6 text-xs font-bold text-slate-500 uppercase tracking-tight">{formatDate(inv.issueDate)}</td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                      <div className="font-black text-[#2F4D36] tracking-tighter text-sm flex items-center gap-2">
                        {inv.client}
                        {inv.source === 'local' && <span title="Manually Entered" className="text-amber-500"><Edit3 size={10} /></span>}
                        {inv.isReinvoice && <span title="Reinvoice" className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">REINV</span>}
                        {inv.notes && inv.notes.length > 0 && <span title={`${inv.notes.length} Notes`} className="text-indigo-500"><MessageSquare size={10} /></span>}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">VS: {inv.vs || 'NOT_FOUND'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="bg-slate-50 text-[#2F4D36] px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100 group-hover:bg-white transition-colors">
                      {inv.category}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right font-mono">
                     <div className="flex flex-col">
                       <span className="font-black text-sm text-[#2F4D36]">€{inv.eurValue?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                       <span className="text-[9px] text-slate-500 font-bold">{inv.amount.toLocaleString()} {inv.currency}</span>
                     </div>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => startEdit(inv)}
                        className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                        title="Manual Adjustment"
                      >
                        <Edit3 size={18} />
                      </button>
                      {inv.driveId && (
                        <a href={`https://drive.google.com/file/d/${inv.driveId}/view`} target="_blank" className="p-3 text-slate-300 hover:text-[#2F4D36] hover:bg-slate-100 rounded-2xl transition-all">
                          <ExternalLink size={18} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-10 py-32 text-center grayscale opacity-30">
                    <div className="flex flex-col items-center gap-6">
                      <FileText size={64} />
                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-[0.4em]">Ledger is empty</p>
                        <p className="text-[10px] font-medium tracking-widest">Adjust your filters or sync with Google Drive</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Showing {currentPage} of {totalPages} Pages <span className="mx-2">/</span> {filteredInvoices.length} Ledger Entries</span>
          <div className="flex gap-3">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p-1))} 
              className="p-3 bg-white rounded-2xl border border-slate-200 hover:bg-[#2F4D36] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-200 transition-all shadow-sm"
            >
              <ChevronLeft size={20}/>
            </button>
            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} 
              className="p-3 bg-white rounded-2xl border border-slate-200 hover:bg-[#2F4D36] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-200 transition-all shadow-sm"
            >
              <ChevronRight size={20}/>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Overlay Modal */}
      {(editingInvoice || isAddingNew) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1a2b1e]/60 backdrop-blur-xl animate-in overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20 animate-slide-in my-auto">
            <div className="bg-[#2F4D36] px-6 py-5 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10"><FileText size={80} /></div>
              <div className="relative z-10">
                <h3 className="text-xl font-black tracking-tighter">{isAddingNew ? 'Create New Entry' : 'Adjust Ledger Record'}</h3>
              </div>
              <button onClick={() => { setEditingInvoice(null); setIsAddingNew(false); }} className="p-2 hover:bg-white/10 rounded-xl transition-all relative z-10">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-5 bg-[#F6F6F0]/30 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <User size={10} /> Legal Entity / Vendor
                  </label>
                  <input 
                    type="text" 
                    value={formState.client || ''} 
                    onChange={e => setFormState({...formState, client: e.target.value})}
                    placeholder="e.g. Amazon Web Services"
                    className="w-full bg-white border-none rounded-2xl px-4 py-3 text-xs font-bold text-[#2F4D36] outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-[#2F4D36]/10 transition-all"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <DollarSign size={10} /> Gross Amount
                  </label>
                  <input 
                    type="number" 
                    value={formState.amount || 0} 
                    onChange={e => setFormState({...formState, amount: parseFloat(e.target.value)})}
                    className="w-full bg-white border-none rounded-2xl px-4 py-3 text-xs font-bold text-[#2F4D36] outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-[#2F4D36]/10 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Currency</label>
                  <select 
                    value={formState.currency || 'CZK'} 
                    onChange={e => setFormState({...formState, currency: e.target.value})}
                    className="w-full bg-white border-none rounded-2xl px-4 py-3 text-xs font-bold text-[#2F4D36] outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-[#2F4D36]/10 transition-all cursor-pointer"
                  >
                    <option value="CZK">CZK</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="PLN">PLN</option>
                    <option value="HUF">HUF</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">VS / Reference No.</label>
                  <input 
                    type="text" 
                    value={formState.vs || ''} 
                    onChange={e => setFormState({...formState, vs: e.target.value})}
                    className="w-full bg-white border-none rounded-2xl px-4 py-3 text-xs font-mono font-bold text-[#2F4D36] outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-[#2F4D36]/10 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Date</label>
                  <input 
                    type="text" 
                    value={formState.issueDate || ''} 
                    onChange={e => setFormState({...formState, issueDate: e.target.value})}
                    className="w-full bg-white border-none rounded-2xl px-4 py-3 text-xs font-bold text-[#2F4D36] outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-[#2F4D36]/10 transition-all"
                    placeholder="D.M.YYYY"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Cost Allocation</label>
                  <div className="flex gap-2">
                    {isAddingCategory ? (
                      <div className="flex-1 flex gap-2">
                        <input 
                          type="text" 
                          value={newCategoryName}
                          onChange={e => setNewCategoryName(e.target.value)}
                          placeholder="Enter new category name..."
                          className="flex-1 bg-white border-none rounded-2xl px-4 py-3 text-xs font-bold text-[#2F4D36] outline-none ring-2 ring-[#2F4D36]/20"
                          autoFocus
                        />
                        <button onClick={handleAddCategory} className="bg-[#2F4D36] text-white p-3 rounded-2xl hover:opacity-90"><CheckCircle size={16} /></button>
                        <button onClick={() => setIsAddingCategory(false)} className="bg-slate-100 text-slate-400 p-3 rounded-2xl hover:bg-slate-200"><X size={16} /></button>
                      </div>
                    ) : (
                      <>
                        <select 
                          value={formState.category || ''} 
                          onChange={e => setFormState({...formState, category: e.target.value})}
                          className="flex-1 bg-white border-none rounded-2xl px-4 py-3 text-xs font-bold text-[#2F4D36] outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-[#2F4D36]/10 transition-all cursor-pointer"
                        >
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button 
                          onClick={() => setIsAddingCategory(true)}
                          className="bg-white border border-slate-100 text-[#2F4D36] p-3 rounded-2xl hover:bg-slate-50 transition-colors"
                          title="Add New Category"
                        >
                          <Plus size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Notes Section */}
                <div className="col-span-2 space-y-3 pt-3 border-t border-slate-100/50">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <MessageSquare size={10} /> Internal Notes
                  </label>
                  
                  <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                    {(formState.notes || []).map((note, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-start group">
                        <div>
                          <p className="text-[10px] text-slate-600 font-medium">{note.text}</p>
                          <p className="text-[8px] text-slate-300 mt-1 uppercase tracking-wider">{new Date(note.date).toLocaleString()}</p>
                        </div>
                        <button onClick={() => removeNote(idx)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addNote()}
                      placeholder="Add a note..."
                      className="flex-1 bg-white border-none rounded-2xl px-4 py-2.5 text-[10px] font-medium text-slate-600 outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-[#2F4D36]/10"
                    />
                    <button 
                      onClick={addNote}
                      disabled={!noteText.trim()}
                      className="bg-[#2F4D36] text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="col-span-2 flex items-center gap-3 bg-[#2F4D36]/5 p-4 rounded-2xl border border-[#2F4D36]/10">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formState.isReinvoice || false} 
                      onChange={e => setFormState({...formState, isReinvoice: e.target.checked})}
                      className="w-5 h-5 accent-[#2F4D36] rounded-lg cursor-pointer transition-all"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-[#2F4D36] uppercase tracking-widest block">Mark as Reinvoice</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Pass-through expense</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => { setEditingInvoice(null); setIsAddingNew(false); }}
                  className="flex-1 bg-white text-slate-400 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-slate-100 hover:bg-slate-50 transition-colors active:scale-95"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-2 bg-[#2F4D36] text-white py-3 px-10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#2F4D36]/30 active:scale-95"
                >
                  <CheckCircle size={14} /> {isAddingNew ? 'Create' : 'Save'}
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