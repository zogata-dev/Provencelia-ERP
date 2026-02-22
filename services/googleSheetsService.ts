
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

export const fetchOrdersFromSheet = async (spreadsheetId: string, accessToken: string): Promise<Order[]> => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A2:K`, // Assuming range
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await response.json();
    if (!data.values) return [];

    return data.values.map((row: any[], index: number) => {
      const channelTag = row[5]?.toLowerCase();
      return {
        id: index.toString(),
        orderNumber: row[0],
        date: row[1],
        channel: (channelTag || 'shopify') as SalesChannel,
        totalValue: parseFloat(row[2]) || 0,
        currency: row[3] || 'CZK',
        tax: parseFloat(row[4]) || 0,
        shipping: parseFloat(row[6]) || 0,
        productCost: parseFloat(row[7]) || 0,
        fees: parseFloat(row[8]) || 0,
        discount: parseFloat(row[9]) || 0,
        items: row[10] ? [{ sku: row[10], name: row[10], quantity: 1, price: parseFloat(row[2]) }] : []
      };
    });
  } catch (error) { return []; }
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
