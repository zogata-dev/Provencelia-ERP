
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ScriptEditor from './components/ScriptEditor';
import Invoices from './components/Invoices';
import DataManager from './components/DataManager';
import Analytics from './components/Analytics';
import Orders from './components/Orders';
import TeamManagement from './components/TeamManagement';
import SEOStudio from './components/SEOStudio';
import BusinessChat from './components/BusinessChat';
import { ViewState, DriveFile, Invoice, InvoiceNote, SyncMetadata, Order, MarketingSpend, User, GoogleAdsDailyData, GoogleAdsGeoData, Anomaly } from './types';
import Cookies from 'js-cookie';
import Papa from 'papaparse';
import { INITIAL_SCRIPT, FOLDER_ID, SHEET_ID, ORDERS_SHEET_ID, CATEGORIES as DEFAULT_CATEGORIES } from './constants';
import { interpretScript, extractInvoiceDataFromSingleFile, getCnbRates } from './services/geminiService';
import { initGoogleAuth, fetchDriveFilesRecursive, requestAccessToken, fetchFileBase64 } from './services/googleDriveService';
import { fetchInvoicesFromSheet, saveInvoicesToSheet, fetchOrdersFromSheet, fetchMarketingSpendsFromSheet } from './services/googleSheetsService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>(ViewState.DASHBOARD);
  const [script, setScript] = useState(INITIAL_SCRIPT);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('provencelia_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [extractedInvoices, setExtractedInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('provencelia_invoices_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [marketingSpends, setMarketingSpends] = useState<MarketingSpend[]>(() => {
    const saved = localStorage.getItem('provencelia_marketing_spends');
    return saved ? JSON.parse(saved) : [];
  });
  const [isGoogleSheetsConnected, setIsGoogleSheetsConnected] = useState(false);
  const [lastSheetsSync, setLastSheetsSync] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [googleAdsData, setGoogleAdsData] = useState<{ daily: GoogleAdsDailyData[], geo: GoogleAdsGeoData[] }>({ daily: [], geo: [] });
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  const [processedManifest, setProcessedManifest] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('provencelia_processed_ids_v3');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  const [syncMetadata, setSyncMetadata] = useState<SyncMetadata | null>(() => {
    const saved = localStorage.getItem('provencelia_sync_metadata_v3');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('provencelia_marketing_spends', JSON.stringify(marketingSpends));
  }, [marketingSpends]);

  const handleUploadAmazonReport = (file: File) => {
    setSyncLogs(prev => [...prev.slice(-49), `📄 Processing ${file.name}...`]);
    
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const data = results.data as any[];
        const newSpends: MarketingSpend[] = [];
        const dailyMap = new Map<string, number>();

        data.forEach(row => {
          // Try to find date and cost columns
          const dateStr = row['Date'] || row['date'] || row['Start Date'];
          const costStr = row['Cost'] || row['Spend'] || row['spend'] || row['cost'] || row['Total Spend'];
          
          if (dateStr && costStr) {
             const date = new Date(dateStr);
             if (!isNaN(date.getTime())) {
               const isoDate = date.toISOString().split('T')[0];
               // Handle currency symbols and commas
               const cleanCost = costStr.toString().replace(/[^\d.,]/g, '').replace(',', '.');
               const cost = parseFloat(cleanCost);
               if (!isNaN(cost)) {
                 dailyMap.set(isoDate, (dailyMap.get(isoDate) || 0) + cost);
               }
             }
          }
        });

        dailyMap.forEach((amount, date) => {
          newSpends.push({
            date,
            amount,
            platform: 'amazon'
          });
        });

        if (newSpends.length > 0) {
          setMarketingSpends(prev => {
             const nonAmazon = prev.filter(s => s.platform !== 'amazon');
             return [...nonAmazon, ...newSpends];
          });
          setSyncLogs(prev => [...prev.slice(-49), `✅ Parsed ${newSpends.length} days of Amazon spend data.`]);
        } else {
          setSyncLogs(prev => [...prev.slice(-49), '⚠️ No valid data found. Columns needed: Date, Cost/Spend.']);
        }
      },
      error: (error: any) => {
        setSyncLogs(prev => [...prev.slice(-49), `❌ CSV Parse Error: ${error.message}`]);
      }
    });
  };

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

  // Anomaly Detection Logic
  useEffect(() => {
    const detected: Anomaly[] = [];
    const now = new Date();

    // 1. Check for missing costs in recent orders
    const recentOrders = orders.filter(o => {
      const d = new Date(o.date);
      return (now.getTime() - d.getTime()) < (7 * 24 * 60 * 60 * 1000);
    });
    const missingCosts = recentOrders.filter(o => o.missingCost);
    if (missingCosts.length > 0) {
      detected.push({
        id: 'missing-costs',
        type: 'warning',
        title: 'Missing Purchase Prices',
        description: `${missingCosts.length} recent orders are missing product cost data, affecting profit accuracy.`,
        timestamp: now.toISOString()
      });
    }

    // 2. Check for MER drops (if we have ads data)
    if (googleAdsData.daily.length > 7) {
      const sortedAds = [...googleAdsData.daily].sort((a, b) => b.date.localeCompare(a.date));
      const latestDay = sortedAds[0];
      const prev7Days = sortedAds.slice(1, 8);
      const avgSpend = prev7Days.reduce((sum, s) => sum + s.cost, 0) / 7;
      
      if (latestDay.cost > avgSpend * 1.5) {
        detected.push({
          id: 'spend-spike',
          type: 'critical',
          title: 'Ad Spend Spike',
          description: `Yesterday's spend (${latestDay.cost.toLocaleString()} CZK) is 50%+ higher than the 7-day average.`,
          timestamp: now.toISOString()
        });
      }
    }

    // 3. Check for high-value unverified invoices
    const unverifiedHighValue = extractedInvoices.filter((inv: Invoice) => !inv.processed && (inv.eurValue || 0) > 1000);
    if (unverifiedHighValue.length > 0) {
      detected.push({
        id: 'high-value-invoices',
        type: 'info',
        title: 'High-Value Pending Invoices',
        description: `There are ${unverifiedHighValue.length} unverified invoices over €1,000 awaiting review.`,
        timestamp: now.toISOString()
      });
    }

    setAnomalies(detected);
  }, [orders, googleAdsData, extractedInvoices]);

  const fetchRealSheetsData = useCallback(async () => {
    try {
      const profile = Cookies.get('user_profile');
      if (profile) setCurrentUser(JSON.parse(profile));

      const [sheetsRes, adsRes] = await Promise.all([
        fetch('/api/sheets/data'),
        fetch('/api/google-ads/data')
      ]);

      if (sheetsRes.ok) {
        const data = await sheetsRes.json();
        setOrders(data.orders);
        setLastSheetsSync(data.lastSync);
        setIsGoogleSheetsConnected(true);
      } else if (sheetsRes.status === 401) {
        setIsGoogleSheetsConnected(false);
      }

      if (adsRes.ok) {
        const data = await adsRes.json();
        setGoogleAdsData({ daily: data.dailyData, geo: data.geoData });
      }
    } catch (error) {
      console.error('Error fetching real sheets/ads data:', error);
    }
  }, []);

  const handleConnectGoogleSheets = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const { url } = await response.json();
      const width = 600, height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const authWindow = window.open(url, 'google_oauth', `width=${width},height=${height},left=${left},top=${top}`);
      
      if (!authWindow) {
        alert('Please allow popups to connect Google Sheets.');
        return;
      }
    } catch (error) {
      console.error('Error connecting Google Sheets:', error);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchRealSheetsData();
      }
    };
    window.addEventListener('message', handleMessage);
    fetchRealSheetsData(); // Initial check

    // Regular sync every 10 minutes
    const interval = setInterval(() => {
      if (isGoogleSheetsConnected) {
        fetchRealSheetsData();
      }
    }, 10 * 60 * 1000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, [fetchRealSheetsData, isGoogleSheetsConnected]);

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

      // Fetch Orders only if backend sync is not connected
      if (!isGoogleSheetsConnected) {
        const orderData = await fetchOrdersFromSheet(ORDERS_SHEET_ID, token);
        setOrders(orderData);
      }

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
      currentUser={currentUser}
      anomalies={anomalies}
    >
      {activeView === ViewState.DASHBOARD && (
        <Dashboard 
          invoices={uniqueInvoices} 
          categories={categories} 
          onUpdateCategory={(id, cat) => handleUpdateInvoice(id, { category: cat })} 
          pendingCount={pendingQueueCount}
          orders={orders}
          marketingSpends={marketingSpends}
          googleAdsData={googleAdsData}
        />
      )}
      {activeView === ViewState.ORDERS && <Orders orders={orders} />}
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
      {activeView === ViewState.SEO_STUDIO && <SEOStudio />}
      {activeView === ViewState.CHAT && (
        <BusinessChat 
          orders={orders} 
          invoices={uniqueInvoices} 
          marketingSpends={marketingSpends} 
          googleAdsData={googleAdsData} 
        />
      )}
      {activeView === ViewState.TEAM && <TeamManagement currentUser={currentUser} />}
      {activeView === ViewState.EDITOR && (
        <ScriptEditor 
          script={script} 
          setScript={setScript} 
          onDeploy={() => handleSyncDrive(true)} 
        />
      )}
      {activeView === ViewState.SETTINGS && (
        <DataManager 
          onSyncDrive={() => handleSyncDrive(true)} 
          isSyncing={isSyncing} isConnected={!!googleAccessToken} 
          onConnect={requestAccessToken} externalLogs={syncLogs} 
          syncMetadata={syncMetadata} pendingCount={pendingQueueCount}
          autoSyncEnabled={autoSyncEnabled} setAutoSyncEnabled={setAutoSyncEnabled}
          isGoogleSheetsConnected={isGoogleSheetsConnected}
          onConnectGoogleSheets={handleConnectGoogleSheets}
          onRefreshGoogleSheets={fetchRealSheetsData}
          lastSheetsSync={lastSheetsSync}
          onUploadAmazonReport={handleUploadAmazonReport}
        />
      )}
    </Layout>
  );
};

export default App;
