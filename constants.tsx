
import React from 'react';
import { LayoutDashboard, Code2, BarChart3, Settings, FileText, ShoppingCart, Users, Sparkles, MessageSquare } from 'lucide-react';

export const FOLDER_ID = "1v7KRt5HN0h6mQCgNkXpKXxgzcjIcZXcT";
export const SHEET_ID = "1VAvVf-ofn6WS_SPt3biLpey50yzM-DBWYiySf2yG6r0";
export const ORDERS_SHEET_ID = "1ddv4M54wG8CZqae0zrYkWAi8GMtynDfdyrFJ_OrWKBU";

export const CATEGORIES = [
  "Logistics", "Warehouse", "E-shop Marketing", "Marketplace Marketing", 
  "Marketplace Fees", "Fleet Management", "Tools & Software", "Personnel Costs", "Salary"
];

export const INITIAL_SCRIPT = `/**
 * Business Intelligence Rules (AI Interpretation)
 */

async function processInvoices(files) {
  return files.map(file => ({
    ...file,
    processed: true,
    status: 'Verified'
  }));
}
`;

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
  { id: 'chat', label: 'AI Analyst', icon: <MessageSquare size={20} /> },
  { id: 'orders', label: 'Order Analysis', icon: <ShoppingCart size={20} /> },
  { id: 'invoices', label: 'Expense Ledger', icon: <FileText size={20} /> },
  { id: 'analytics', label: 'Deep Insights', icon: <BarChart3 size={20} /> },
  { id: 'editor', label: 'Logic Studio', icon: <Code2 size={20} /> },
  { id: 'seo_studio', label: 'SEO Engine', icon: <Sparkles size={20} /> },
  { id: 'settings', label: 'System Sync', icon: <Settings size={20} /> },
];
