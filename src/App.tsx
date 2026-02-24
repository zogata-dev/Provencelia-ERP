
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ScriptEditor from './components/ScriptEditor';
import Invoices from './components/Invoices';
import DataManager from './components/DataManager';
import Analytics from './components/Analytics';
import Orders from './components/Orders';
import { ViewState, DriveFile, Invoice, InvoiceNote, SyncMetadata, Order, MarketingSpend } from './types';
import { INITIAL_SCRIPT, FOLDER_ID, SHEET_ID, ORDERS_SHEET_ID, COGS_SHEET_ID, CATEGORIES as DEFAULT_CATEGORIES } from './constants';
import { interpretScript, extractInvoiceDataFromSingleFile, getCnbRates } from './services/geminiService';
import { initGoogleAuth, fetchDriveFilesRecursive, requestAccessToken, fetchFileBase64 } from './services/googleDriveService';
import { fetchInvoicesFromSheet, saveInvoicesToSheet, fetchOrdersFromSheet, fetchMarketingSpendsFromSheet, fetchCogsFromSheet } from './services/googleSheetsService';

import { generateDummyInvoices, generateDummyOrders, generateDummyMarketing } from './services/dummyData';

import AIChat from './components/AIChat';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>(ViewState.DASHBOARD);
  const [script, setScript] = useState(INITIAL_SCRIPT);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('provencelia_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [extractedInvoices, setExtractedInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('provencelia_invoices_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [marketingSpends, setMarketingSpends] = useState<MarketingSpend[]>([]);
  const [orderLogs, setOrderLogs] = useState<string[]>([]);

  // Load dummy data if needed
  useEffect(() => {
    if (extractedInvoices.length === 0) {
      setExtractedInvoices(generateDummyInvoices());
    }
    if (marketingSpends.length === 0) {
      setMarketingSpends(generateDummyMarketing());
    }
  }, []);

  const [processedManifest, setProcessedManifest] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('provencelia_processed_ids_v3');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  const [syncMetadata, setSyncMetadata] = useState<SyncMetadata | null>(() => {
    const saved = localStorage.getItem('provencelia_sync_metadata_v3');
    return saved ? JSON.parse(saved) : null;
  });

  const formatDateString = (date: Date) => {
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
  };

  const createSignature = (inv: Partial<Invoice>) => {
    return `${inv.client}-${inv.vs}-${inv.issueDate}-${inv.amount}`.toLowerCase().replace(/\s/g, '');
  };

  const uniqueInvoices = useMemo(() => {
    const seen = new Set();
    return extractedInvoices.filter(inv => {
      const sig = inv.contentSignature || createSignature(inv);
      if (seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });
  }, [extractedInvoices]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  const loadOrdersData = async (token: string, addLog?: (msg: string) => void) => {
    const [orderData, cogsData, rates] = await Promise.all([
      fetchOrdersFromSheet(ORDERS_SHEET_ID, token, addLog),
      fetchCogsFromSheet(COGS_SHEET_ID, token, addLog),
      getCnbRates()
    ]);

    const updatedOrders = orderData.map(order => {
      let totalCogs = 0;
      let hasMissingCogs = false;
      
      const currency = order.currency.toUpperCase();
      // Calculate rate from EUR to order currency
      // rates object contains values like { EUR: 25.3, USD: 23.1, PLN: 5.8 } (relative to CZK)
      // So 1 EUR = rates.EUR CZK
      // 1 PLN = rates.PLN CZK -> 1 EUR = rates.EUR / rates.PLN PLN
      let eurToCurrencyRate = 1;
      if (currency === 'CZK') {
        eurToCurrencyRate = rates.EUR || 25.3;
      } else if (currency !== 'EUR' && rates[currency as keyof typeof rates]) {
        eurToCurrencyRate = (rates.EUR || 25.3) / (rates[currency as keyof typeof rates] || 1);
      }

      const updatedItems = order.items.map(item => {
        const unitCostEur = cogsData[item.sku];
        let unitCostCurrency: number | undefined = undefined;
        
        if (unitCostEur === undefined) {
          hasMissingCogs = true;
        } else {
          unitCostCurrency = unitCostEur * eurToCurrencyRate;
          totalCogs += unitCostCurrency * item.quantity;
        }
        return { ...item, cogs: unitCostCurrency };
      });
      return { ...order, items: updatedItems, productCost: totalCogs, hasMissingCogs };
    });

    return updatedOrders;
  };

  useEffect(() => {
    initGoogleAuth(async (token) => {
      setGoogleAccessToken(token);
      
      // Fetch Invoices
      const sheetData = await fetchInvoicesFromSheet(SHEET_ID, token);
      if (sheetData.length > 0) {
        setExtractedInvoices(sheetData);
        const ids = new Set(sheetData.filter(i => i.driveId).map(i => i.driveId!));
        setProcessedManifest(ids);
      }

      // Fetch Orders & COGS
      const updatedOrders = await loadOrdersData(token);
      setOrders(updatedOrders);

      // Fetch Marketing
      const spendData = await fetchMarketingSpendsFromSheet(ORDERS_SHEET_ID, token);
      setMarketingSpends(spendData);
    });
  }, []);

  useEffect(() => {
    if (googleAccessToken && extractedInvoices.length > 0) {
      saveInvoicesToSheet(SHEET_ID, extractedInvoices, googleAccessToken);
    }
    localStorage.setItem('provencelia_invoices_v3', JSON.stringify(extractedInvoices));
    localStorage.setItem('provencelia_processed_ids_v3', JSON.stringify(Array.from(processedManifest)));
    localStorage.setItem('provencelia_categories', JSON.stringify(categories));
    if (syncMetadata) localStorage.setItem('provencelia_sync_metadata_v3', JSON.stringify(syncMetadata));
  }, [extractedInvoices, processedManifest, syncMetadata, categories, googleAccessToken]);

  const addCategory = (cat: string) => {
    if (!cat || categories.includes(cat)) return;
    setCategories(prev => [...prev, cat]);
  };

  const handleUpdateInvoice = async (id: string, updates: Partial<Invoice>) => {
    const rates = await getCnbRates();
    setExtractedInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        const newInv = { ...inv, ...updates };
        if (updates.amount !== undefined || updates.currency !== undefined) {
          const currency = (newInv.currency || "CZK").toUpperCase();
          const eurRate = currency === "EUR" ? 1 : (rates[currency as keyof typeof rates] || 1) / rates.EUR;
          newInv.eurValue = Number((newInv.amount * (currency === "CZK" ? (1/rates.EUR) : eurRate)).toFixed(2));
        }
        return newInv;
      }
      return inv;
    }));
  };

  const handleAddManualInvoice = async (invoice: Partial<Invoice>) => {
    const rates = await getCnbRates();
    const currency = (invoice.currency || "CZK").toUpperCase();
    const eurRate = currency === "EUR" ? 1 : (rates[currency as keyof typeof rates] || 1) / rates.EUR;
    const eurValue = Number(((invoice.amount || 0) * (currency === "CZK" ? (1/rates.EUR) : eurRate)).toFixed(2));

    const todayStr = formatDateString(new Date());

    const newInv: Invoice = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      client: invoice.client || "Manuální dodavatel",
      amount: invoice.amount || 0,
      status: 'pending',
      issueDate: invoice.issueDate || todayStr,
      dueDate: invoice.dueDate || invoice.issueDate || todayStr,
      currency,
      category: invoice.category || categories[0],
      vs: invoice.vs || "",
      eurValue,
      isReinvoice: invoice.isReinvoice || false,
      source: 'local'
    };

    setExtractedInvoices(prev => [newInv, ...prev]);
  };

  const handleBulkUpdateCategory = (ids: string[], newCategory: string) => {
    setExtractedInvoices(prev => prev.map(inv => ids.includes(inv.id) ? { ...inv, category: newCategory } : inv));
  };

  const handleBulkDelete = (ids: string[]) => {
    if (confirm(`Opravdu chcete smazat ${ids.length} záznamů?`)) {
      setExtractedInvoices(prev => prev.filter(inv => !ids.includes(inv.id)));
    }
  };

  const handleSyncDrive = async (fullOcr: boolean = true) => {
    if (!googleAccessToken) { requestAccessToken(); return; }
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncLogs([]);
    const addLog = (msg: string) => setSyncLogs(prev => [...prev.slice(-49), msg]);

    try {
      addLog("🔍 Skenuji Google Drive...");
      const realFiles = await fetchDriveFilesRecursive(FOLDER_ID, googleAccessToken);
      const stats: SyncMetadata = {
        lastSyncTimestamp: new Date().toLocaleString('cs-CZ'),
        totalFilesFound: realFiles.length,
        newFilesProcessed: 0, skippedFiles: 0, errors: 0, folderStats: {}, apiCalls: 0
      };
      realFiles.forEach(f => { stats.folderStats[f.path] = (stats.folderStats[f.path] || 0) + 1; });
      setSyncMetadata(stats);

      if (!fullOcr) {
        setIsSyncing(false);
        return;
      }

      const newFiles = realFiles.filter(f => !processedManifest.has(f.id));
      const rates = await getCnbRates();
      let currentInvoices = [...extractedInvoices];
      const newProcessedIds = new Set(processedManifest);

      if (newFiles.length === 0) {
        addLog("✅ Žádné nové soubory k analýze.");
      } else {
        addLog(`🚀 Analyzuji dávku souborů...`);
      }

      for (const file of newFiles.slice(0, 20)) {
        addLog(`📄 Čtu: ${file.name}`);
        try {
          const base64 = await fetchFileBase64(file.id, googleAccessToken);
          const item = await extractInvoiceDataFromSingleFile(file.name, file.id, base64);
          stats.apiCalls++;

          if (item) {
            const sig = createSignature({ client: item.vendor, vs: item.vs, issueDate: item.date, amount: item.amount });
            const alreadyExists = currentInvoices.some(inv => inv.contentSignature === sig);

            if (alreadyExists) {
              addLog(`⏭️ Přeskakuji duplicitu: ${item.vendor}`);
              newProcessedIds.add(file.id);
              continue;
            }

            const currency = (item.currency || "CZK").toUpperCase();
            const eurRate = currency === "EUR" ? 1 : (rates[currency as keyof typeof rates] || 1) / rates.EUR;
            const eurValue = Number((item.amount * (currency === "CZK" ? (1/rates.EUR) : eurRate)).toFixed(2));

            currentInvoices.push({
              id: Math.random().toString(36).substr(2, 9).toUpperCase(),
              client: item.vendor || "Unknown",
              amount: item.amount || 0,
              status: 'pending',
              issueDate: item.date,
              dueDate: item.date,
              driveId: item.driveId,
              currency,
              category: item.category,
              vs: item.vs,
              eurValue,
              isReinvoice: item.isReinvoice,
              contentSignature: sig,
              source: 'drive'
            });
            newProcessedIds.add(file.id);
            stats.newFilesProcessed++;
          } else {
             addLog(`⚠️ AI nevrátilo data pro: ${file.name}`);
          }
        } catch (e: any) {
          const errMsg = e?.message || "Neznámá chyba";
          console.error(`Error processing ${file.name}:`, e);
          addLog(`❌ Chyba (${file.name}): ${errMsg.substring(0, 40)}...`);
          stats.errors++;
        }
      }

      setProcessedManifest(newProcessedIds);
      setExtractedInvoices(currentInvoices);
      setSyncMetadata({...stats, newFilesProcessed: stats.newFilesProcessed});
    } catch (err: any) { 
      addLog(`❌ Kritická chyba: ${err?.message || "Server error"}`); 
    }
    setIsSyncing(false);
  };

  const pendingQueueCount = Math.max(0, (syncMetadata?.totalFilesFound || 0) - processedManifest.size);

  return (
    <Layout 
      activeView={activeView} 
      setActiveView={setActiveView} 
      appName="Provencelia DB" 
      isSyncing={isSyncing}
      onOpenChat={() => setIsChatOpen(true)}
    >
      {activeView === ViewState.DASHBOARD && (
        <Dashboard 
          invoices={uniqueInvoices} 
          categories={categories} 
          onUpdateCategory={(id, cat) => handleUpdateInvoice(id, { category: cat })} 
          pendingCount={pendingQueueCount}
          orders={orders}
          marketingSpends={marketingSpends}
        />
      )}
      {activeView === ViewState.ORDERS && (
        <Orders 
          orders={orders} 
          logs={orderLogs}
          onRefresh={async () => {
            if (googleAccessToken) {
              setOrderLogs([]);
              const updatedOrders = await loadOrdersData(googleAccessToken, (msg) => {
                setOrderLogs(prev => [...prev, msg]);
              });
              if (updatedOrders.length > 0) setOrders(updatedOrders);
            } else {
              alert("Prosím připojte se nejprve k Google Workspace v sekci System Sync.");
            }
          }}
        />
      )}
      {activeView === ViewState.INVOICES && (
        <Invoices 
          driveInvoices={uniqueInvoices} categories={categories}
          onAddCategory={addCategory} 
          onUpdateInvoice={handleUpdateInvoice}
          onAddManualInvoice={handleAddManualInvoice}
          onBulkUpdateCategory={handleBulkUpdateCategory} 
          onBulkDelete={handleBulkDelete}
        />
      )}
      {activeView === ViewState.ANALYTICS && <Analytics invoices={uniqueInvoices} />}
      {activeView === ViewState.SETTINGS && (
        <DataManager 
          onSyncDrive={() => handleSyncDrive(true)} 
          isSyncing={isSyncing} isConnected={!!googleAccessToken} 
          onConnect={requestAccessToken} externalLogs={syncLogs} 
          syncMetadata={syncMetadata} pendingCount={pendingQueueCount}
          autoSyncEnabled={autoSyncEnabled} setAutoSyncEnabled={setAutoSyncEnabled}
        />
      )}
      
      <AIChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        invoices={uniqueInvoices} 
        orders={orders} 
      />
    </Layout>
  );
};

export default App;
