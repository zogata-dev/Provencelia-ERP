
import { Invoice, Order, MarketingSpend, SalesChannel } from '../types';

const INVOICE_SHEET_NAME = 'Sheet1';
const ORDERS_SHEET_NAME = 'Orders'; // Adjust if the tab name is different
const SPEND_SHEET_NAME = 'MarketingCosts'; // Adjust if the tab name is different

export const fetchInvoicesFromSheet = async (spreadsheetId: string, accessToken: string): Promise<Invoice[]> => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${INVOICE_SHEET_NAME}!A2:M`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await response.json();
    if (!data.values) return [];
    return data.values.map((row: any[]) => ({
      id: row[0], client: row[1], amount: parseFloat(row[2]) || 0, currency: row[3], vs: row[4],
      issueDate: row[5], category: row[6], eurValue: parseFloat(row[7]) || 0,
      isReinvoice: row[8] === 'TRUE', source: row[9], driveId: row[10], contentSignature: row[11], status: row[12] || 'pending'
    }));
  } catch (error) { return []; }
};

const parseSheetRowsToOrders = (rowsData: any[][], addLog: (msg: string) => void): Order[] => {
  if (!rowsData || rowsData.length < 2) {
    addLog(`[Orders] Data is empty or has only 1 row.`);
    return [];
  }

  const headers = rowsData[0].map((h: string) => h?.toString().toLowerCase().trim() || '');
  const rows = rowsData.slice(1);
  addLog(`[Orders] Headers found: ${headers.join(', ')}`);

  const getColIndex = (possibleNames: string[]) => headers.findIndex((h: string) => possibleNames.some(n => h.includes(n)));

  const idx = {
    number: getColIndex(['number', 'order id', 'order number', 'name', 'id']),
    type: getColIndex(['line: type', 'type']),
    sku: getColIndex(['line: sku', 'sku']),
    price: getColIndex(['line: price', 'price', 'total']),
    qty: getColIndex(['line: quantity', 'quantity', 'qty']),
    tax: getColIndex(['line: tax total', 'tax', 'taxes']),
    currency: getColIndex(['currency']),
    date: getColIndex(['created at', 'date', 'created_at']),
    tags: getColIndex(['tags', 'channel', 'source']),
    discount: getColIndex(['line: discount', 'discount']),
    trackingCompany: getColIndex(['fulfillment: tracking company', 'tracking company', 'carrier']),
    countryCode: getColIndex(['shipping: country code', 'country code', 'country'])
  };

  addLog(`[Orders] Column mapping: Number(${idx.number}), Type(${idx.type}), SKU(${idx.sku}), Price(${idx.price}), Qty(${idx.qty}), Tracking(${idx.trackingCompany})`);

  const ordersMap = new Map<string, Order>();

  rows.forEach((row: any[], index: number) => {
    if (!row || row.length === 0 || (row.length === 1 && !row[0])) return; // skip empty rows

    const getValue = (i: number, type: 'string' | 'number' = 'string') => {
      if (i === -1 || row[i] === undefined || row[i] === null) return type === 'number' ? 0 : '';
      const strVal = row[i].toString().trim();
      if (type === 'number') {
        if (!strVal) return 0;
        const val = parseFloat(strVal.replace(/[^\d.-]/g, ''));
        return isNaN(val) ? 0 : val;
      }
      return strVal;
    };

    const orderNum = getValue(idx.number) || `ORD-${index}`;
    if (!orderNum) return;

    if (!ordersMap.has(orderNum)) {
      let channel: SalesChannel = 'shopify';
      const tags = getValue(idx.tags).toLowerCase();
      if (tags.includes('amazon')) channel = 'amazon';
      else if (tags.includes('ebay')) channel = 'ebay';
      else if (tags.includes('allegro')) channel = 'allegro';
      else if (tags.includes('kaufland')) channel = 'kaufland';
      else if (tags.includes('home24')) channel = 'home24';
      else if (tags.includes('etsy')) channel = 'etsy' as any; // Allow etsy for now

      ordersMap.set(orderNum, {
        id: orderNum,
        orderNumber: orderNum,
        date: getValue(idx.date),
        channel,
        totalValue: 0,
        currency: getValue(idx.currency) || 'CZK',
        tax: 0,
        shipping: 0,
        shippingRevenue: 0,
        productCost: 0,
        fees: 0,
        discount: 0,
        items: [],
        isShipped: false,
        countryCode: getValue(idx.countryCode) || 'Unknown'
      });
    }

    const order = ordersMap.get(orderNum)!;
    const lineType = getValue(idx.type).toLowerCase();
    const price = getValue(idx.price, 'number') as number;
    const qtyStr = getValue(idx.qty, 'string') as string;
    const qty = qtyStr ? (parseFloat(qtyStr) || 1) : 1;
    const tax = getValue(idx.tax, 'number') as number;
    const discount = Math.abs(getValue(idx.discount, 'number') as number);
    const trackingCompany = getValue(idx.trackingCompany).toLowerCase();
    const trackingNumber = getValue(idx.trackingCompany - 1).toString(); // Assuming tracking number is right before tracking company based on CSV headers

    if (trackingCompany) {
      order.isShipped = true;
    }

    // Check for shipping cost based on tracking company
    if (trackingCompany && order.shipping === 0) {
      // Assuming a fixed rate of 25.3 CZK per EUR for simplicity if currency is CZK
      const eurRate = order.currency.toUpperCase() === 'CZK' ? 25.3 : 1;
      
      // Count number of tracking codes (separated by comma)
      const packageCount = trackingNumber ? trackingNumber.split(',').length : 1;
      
      if (trackingCompany.includes('schenker')) {
        order.shipping = 35 * eurRate * packageCount;
      } else if (trackingCompany.includes('gls')) {
        order.shipping = 9 * eurRate * packageCount;
      }
    }

    if (lineType === 'shipping line') {
      // We are calculating shipping based on tracking company now, so we just add to total value
      order.totalValue += price;
      order.shippingRevenue = (order.shippingRevenue || 0) + price;
      order.tax += tax;
    } else if (lineType === 'discount') {
      order.discount += discount || Math.abs(price);
    } else if (lineType === 'line item' || lineType === '') {
      const sku = getValue(idx.sku);
      if (sku) {
        order.items.push({
          sku,
          name: sku,
          quantity: qty,
          price: price
        });
      }
      order.totalValue += (price * qty);
      order.tax += tax;
      order.discount += discount;
    }
  });

  const finalOrders = Array.from(ordersMap.values()).map(o => {
    o.totalValue = Math.max(0, o.totalValue - o.discount);
    
    // Calculate fees based on channel
    const feePercentage = o.channel === 'shopify' ? 0.03 : 0.15;
    o.fees = o.totalValue * feePercentage;
    
    return o;
  });

  addLog(`[Orders] Successfully parsed ${finalOrders.length} unique orders.`);
  return finalOrders;
};

const parseCSVOrders = (csvText: string, addLog: (msg: string) => void): Order[] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++; // skip \n
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }
  return parseSheetRowsToOrders(rows, addLog);
};

export const fetchOrdersFromSheet = async (spreadsheetId: string, accessToken: string, log?: (msg: string) => void): Promise<Order[]> => {
  const addLog = (msg: string) => {
    console.log(msg);
    if (log) log(msg);
  };

  try {
    addLog(`[Orders] Fetching metadata for ID: ${spreadsheetId}`);
    const metaResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    if (!metaResponse.ok) {
      const errText = await metaResponse.text();
      addLog(`[Orders] Meta API Error ${metaResponse.status}: ${errText}`);
      
      // Fallback: Try fetching as CSV via Drive API if it's not a Google Sheet
      addLog(`[Orders] Attempting to fetch as raw CSV via Drive API...`);
      const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (driveRes.ok) {
        const csvText = await driveRes.text();
        addLog(`[Orders] Successfully downloaded CSV (${csvText.length} bytes). Parsing...`);
        return parseCSVOrders(csvText, addLog);
      } else {
        addLog(`[Orders] Drive API Error ${driveRes.status}: ${await driveRes.text()}`);
      }
      return [];
    }

    const metaData = await metaResponse.json();
    const firstSheetTitle = metaData.sheets?.[0]?.properties?.title || 'Sheet1';
    addLog(`[Orders] Found sheet: ${firstSheetTitle}. Fetching data...`);

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${firstSheetTitle}!A1:Z`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    if (!response.ok) {
       addLog(`[Orders] Data API Error ${response.status}: ${await response.text()}`);
       return [];
    }

    const data = await response.json();
    addLog(`[Orders] Fetched ${data.values?.length || 0} rows from Sheets API. Parsing...`);
    return parseSheetRowsToOrders(data.values || [], addLog);
  } catch (error: any) { 
    addLog(`[Orders] Exception: ${error.message}`);
    return []; 
  }
};

export const fetchCogsFromSheet = async (spreadsheetId: string, accessToken: string, log?: (msg: string) => void): Promise<Record<string, number>> => {
  const addLog = (msg: string) => {
    console.log(msg);
    if (log) log(msg);
  };

  try {
    addLog(`[COGS] Fetching metadata for ID: ${spreadsheetId}`);
    const metaResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    if (!metaResponse.ok) {
      addLog(`[COGS] Meta API Error ${metaResponse.status}`);
      return {};
    }

    const metaData = await metaResponse.json();
    const firstSheetTitle = metaData.sheets?.[0]?.properties?.title || 'Sheet1';
    
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${firstSheetTitle}!A1:Z`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    if (!response.ok) return {};
    const data = await response.json();
    if (!data.values || data.values.length < 2) return {};

    const headers = data.values[0].map((h: string) => h?.toString().toLowerCase().trim() || '');
    const skuIdx = headers.findIndex((h: string) => ['sku', 'item', 'product', 'název', 'produkt'].some(n => h.includes(n)));
    const costIdx = headers.findIndex((h: string) => ['cost', 'cogs', 'price', 'náklad', 'cena', 'hodnota'].some(n => h.includes(n)));

    if (skuIdx === -1 || costIdx === -1) {
      addLog(`[COGS] Could not find SKU or Cost columns. Headers: ${headers.join(', ')}`);
      return {};
    }

    const cogsMap: Record<string, number> = {};
    data.values.slice(1).forEach((row: any[]) => {
      const sku = row[skuIdx]?.toString().trim();
      const costStr = row[costIdx]?.toString().trim();
      if (sku && costStr) {
        const cost = parseFloat(costStr.replace(/[^\d.-]/g, ''));
        if (!isNaN(cost)) {
          cogsMap[sku] = cost;
        }
      }
    });

    addLog(`[COGS] Successfully loaded costs for ${Object.keys(cogsMap).length} SKUs.`);
    return cogsMap;
  } catch (error: any) {
    addLog(`[COGS] Exception: ${error.message}`);
    return {};
  }
};

export const fetchMarketingSpendsFromSheet = async (spreadsheetId: string, accessToken: string): Promise<MarketingSpend[]> => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/MarketingCosts!A2:C`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await response.json();
    if (!data.values) return [];
    return data.values.map((row: any[]) => ({
      date: row[0],
      amount: parseFloat(row[1]) || 0,
      platform: (row[2]?.toLowerCase() || 'google') as any
    }));
  } catch (error) { return []; }
};

export const saveInvoicesToSheet = async (spreadsheetId: string, invoices: Invoice[], accessToken: string) => {
  try {
    const header = ['ID', 'Client', 'Amount', 'Currency', 'VS', 'Date', 'Category', 'EUR Value', 'Is Reinvoice', 'Source', 'Drive ID', 'Signature', 'Status'];
    const values = invoices.map(inv => [
      inv.id, inv.client, inv.amount, inv.currency, inv.vs, inv.issueDate, inv.category,
      inv.eurValue, inv.isReinvoice ? 'TRUE' : 'FALSE', inv.source, inv.driveId || '', inv.contentSignature || '', inv.status
    ]);
    const body = { values: [header, ...values] };
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${INVOICE_SHEET_NAME}!A1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );
    return true;
  } catch (error) { return false; }
};
