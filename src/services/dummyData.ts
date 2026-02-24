import { Invoice, Order, MarketingSpend } from '../types';

export const generateDummyInvoices = (): Invoice[] => {
  const vendors = ['Google Ireland', 'Facebook Ireland', 'PPL CZ', 'GLS General Logistics', 'Alza.cz', 'IKEA', 'Hornbach'];
  const categories = ['E-shop Marketing', 'E-shop Marketing', 'Logistics', 'Logistics', 'Tools & Software', 'Warehouse', 'Warehouse'];
  
  return Array.from({ length: 25 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));
    const amount = Math.floor(Math.random() * 5000) + 100;
    const vendorIdx = Math.floor(Math.random() * vendors.length);
    
    return {
      id: `DUMMY-${i}`,
      client: vendors[vendorIdx],
      amount: amount,
      currency: 'CZK',
      eurValue: amount / 25.3,
      issueDate: `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`,
      dueDate: `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`,
      status: 'paid',
      category: categories[vendorIdx],
      vs: `2024${i.toString().padStart(4, '0')}`,
      isReinvoice: Math.random() > 0.8,
      source: 'local'
    };
  });
};

export const generateDummyOrders = (): Order[] => {
  const channels = ['shopify', 'amazon', 'ebay', 'allegro', 'kaufland'] as const;
  
  return Array.from({ length: 50 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    const total = Math.floor(Math.random() * 2000) + 500;
    
    return {
      id: `ORD-${i}`,
      orderNumber: `#10${i}`,
      date: date.toISOString(),
      channel: channels[Math.floor(Math.random() * channels.length)],
      totalValue: total,
      currency: 'CZK',
      items: [
        { sku: `PROD-${Math.floor(Math.random() * 10)}`, name: 'Product Name', quantity: 1, price: total }
      ],
      tax: total * 0.21,
      shipping: 100,
      fees: total * 0.15,
      productCost: total * 0.3,
      discount: 0,
      status: 'shipped'
    };
  });
};

export const generateDummyMarketing = (): MarketingSpend[] => {
  return Array.from({ length: 30 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    return {
      date: date.toISOString().split('T')[0],
      platform: Math.random() > 0.5 ? 'google' : 'facebook',
      amount: Math.floor(Math.random() * 1000) + 200,
      currency: 'CZK'
    };
  });
};
