
export interface InvoiceNote {
  text: string;
  date: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  path: string;
  size?: string;
  modifiedTime: string;
  webViewLink?: string;
}

export interface SyncMetadata {
  lastSyncTimestamp: string;
  totalFilesFound: number;
  newFilesProcessed: number;
  skippedFiles: number;
  errors: number;
  folderStats: Record<string, number>;
  apiCalls: number;
}

export interface MarketingSpend {
  date: string;
  amount: number;
  platform: 'google' | 'facebook' | 'amazon' | 'other';
}

export interface Invoice {
  id: string;
  client: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  issueDate: string;
  source?: 'local' | 'drive';
  filePath?: string;
  driveId?: string;
  currency?: string;
  category?: string;
  vs?: string;
  eurValue?: number;
  notes?: InvoiceNote[];
  isReinvoice?: boolean;
  contentSignature?: string;
  processed?: boolean;
}

export type SalesChannel = 'amazon' | 'shopify' | 'ebay' | 'home24' | 'allegro' | 'kaufland';

export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  channel: SalesChannel;
  totalValue: number;
  currency: string;
  tax: number;
  shipping: number;
  productCost: number;
  fees: number;
  discount: number;
  items: OrderItem[];
  missingCost?: boolean;
}

export interface GoogleAdsDailyData {
  date: string;
  campaign: string;
  cost: number;
  clicks: number;
  impressions: number;
  currency: string;
}

export interface GoogleAdsGeoData {
  date: string;
  countryId: string;
  cost: number;
  clicks: number;
  impressions: number;
}

export interface GoogleAdsResponse {
  dailyData: GoogleAdsDailyData[];
  geoData: GoogleAdsGeoData[];
}

export interface Anomaly {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
}

export enum ViewState {
  DASHBOARD = 'dashboard',
  ORDERS = 'orders',
  INVOICES = 'invoices',
  ANALYTICS = 'analytics',
  EDITOR = 'editor',
  SETTINGS = 'settings',
  TEAM = 'team',
  SEO_STUDIO = 'seo_studio',
  CHAT = 'chat'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'editor' | 'viewer';
  joinedAt: string;
  picture?: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  token: string;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
}
