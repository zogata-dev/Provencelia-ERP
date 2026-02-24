
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
  platform: 'google' | 'facebook' | 'other';
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
}

export type SalesChannel = 'amazon' | 'shopify' | 'ebay' | 'home24' | 'allegro' | 'kaufland';

export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
  cogs?: number;
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
  shippingRevenue?: number;
  productCost: number;
  fees: number;
  discount: number;
  items: OrderItem[];
  hasMissingCogs?: boolean;
  isShipped?: boolean;
  countryCode?: string;
}

export enum ViewState {
  DASHBOARD = 'dashboard',
  ORDERS = 'orders',
  INVOICES = 'invoices',
  ANALYTICS = 'analytics',
  EDITOR = 'editor',
  SETTINGS = 'settings'
}
