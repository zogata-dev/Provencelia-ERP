import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v4 as uuidv4 } from 'uuid';
import fs from 'node:fs/promises';

console.log('🎬 Server script starting...');

dotenv.config();

// Lazy load heavy dependencies
const getGoogle = async () => (await import('googleapis')).google;
const getGoogleAdsApi = async () => (await import('google-ads-api')).GoogleAdsApi;
const getNodemailer = async () => (await import('nodemailer')).default;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(cookieParser());

// Data storage paths - using a more robust path resolution with /tmp fallback
let DATA_DIR = path.resolve(__dirname, 'data');
let USERS_FILE = path.join(DATA_DIR, 'users.json');
let INVITATIONS_FILE = path.join(DATA_DIR, 'invitations.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_DIR, fs.constants.W_OK);
  } catch (err) {
    console.warn(`⚠️ Primary data directory ${DATA_DIR} is not writable, falling back to /tmp/data`);
    DATA_DIR = path.resolve('/tmp', 'data');
    USERS_FILE = path.join(DATA_DIR, 'users.json');
    INVITATIONS_FILE = path.join(DATA_DIR, 'invitations.json');
    await fs.mkdir(DATA_DIR, { recursive: true });
  }

  try {
    try { 
      await fs.access(USERS_FILE); 
    } catch { 
      await fs.writeFile(USERS_FILE, '[]'); 
    }
    try { 
      await fs.access(INVITATIONS_FILE); 
    } catch { 
      await fs.writeFile(INVITATIONS_FILE, '[]'); 
    }
    console.log('✅ Data directory and files verified at:', DATA_DIR);
  } catch (err) {
    console.error('❌ Error initializing data files:', err);
  }
}

// Helper to read/write data
async function readData(file: string) {
  const data = await fs.readFile(file, 'utf8');
  return JSON.parse(data);
}
async function writeData(file: string, data: any) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// Email transporter - lazy initialized
let _transporter: any = null;
async function getTransporter() {
  if (!_transporter) {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_PASS;
    if (!user || !pass) {
      console.warn('GMAIL_USER or GMAIL_PASS not set. Emails will not be sent.');
      return null;
    }
    const nodemailer = await getNodemailer();
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }
  return _transporter;
}

// Health check for deployment
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Lazy initialize OAuth2 client to avoid issues with missing env vars at startup
let _oauth2Client: any = null;
async function getOAuth2Client() {
  if (!_oauth2Client) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    
    if (!clientId || !clientSecret) {
      console.warn('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set. OAuth will not work.');
    }
    
    const google = await getGoogle();
    _oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      `${appUrl}/auth/google/callback`
    );
  }
  return _oauth2Client;
}

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/adwords',
  'https://www.googleapis.com/auth/webmasters.readonly'
];

// Search Console API Endpoint
app.get('/api/search-console/data', async (req: Request, res: Response) => {
  const tokensCookie = req.cookies.google_tokens;
  if (!tokensCookie) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }

  try {
    const tokens = JSON.parse(tokensCookie);
    const client = await getOAuth2Client();
    client.setCredentials(tokens);

    const google = await getGoogle();
    const searchconsole = google.searchconsole({ version: 'v1', auth: client });

    // 1. List sites to find the first verified property
    const sitesRes = await searchconsole.sites.list();
    const siteUrl = sitesRes.data.siteEntry?.[0]?.siteUrl;

    if (!siteUrl) {
      return res.status(404).json({ error: 'No verified Search Console property found' });
    }

    // 2. Query performance data (last 30 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const queryRes = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['date', 'query'],
        rowLimit: 1000,
      },
    });

    const rows = queryRes.data.rows || [];

    // Aggregate daily data
    const dailyData: Record<string, { clicks: number, impressions: number, position: number, count: number }> = {};
    
    // Top queries
    const topQueries: any[] = [];

    rows.forEach((row: any) => {
      const date = row.keys[0];
      const query = row.keys[1];
      
      if (!dailyData[date]) {
        dailyData[date] = { clicks: 0, impressions: 0, position: 0, count: 0 };
      }
      
      dailyData[date].clicks += row.clicks;
      dailyData[date].impressions += row.impressions;
      dailyData[date].position += row.position;
      dailyData[date].count++;

      // Collect top queries (simple aggregation)
      const existingQuery = topQueries.find(q => q.query === query);
      if (existingQuery) {
        existingQuery.clicks += row.clicks;
        existingQuery.impressions += row.impressions;
      } else {
        topQueries.push({ query, clicks: row.clicks, impressions: row.impressions, position: row.position });
      }
    });

    // Format daily data
    const formattedDaily = Object.entries(dailyData).map(([date, metrics]) => ({
      date,
      clicks: metrics.clicks,
      impressions: metrics.impressions,
      avgPosition: metrics.position / metrics.count
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Sort top queries
    const sortedQueries = topQueries.sort((a, b) => b.clicks - a.clicks).slice(0, 20);

    res.json({
      siteUrl,
      daily: formattedDaily,
      queries: sortedQueries
    });

  } catch (error: any) {
    console.error('Search Console API Error:', error);
    res.status(500).json({ error: 'Failed to fetch Search Console data', details: error.message });
  }
});

// Spreadsheet IDs from user request
const ORDERS_SPREADSHEET_ID = '1ddv4M54wG8CZqae0zrYkWAi8GMtynDfdyrFJ_OrWKBU';
const PRICES_SPREADSHEET_ID = '1gMsRcVFT1w8KmXrGPmgF-w7M1JSebDjH4lWuCbGQzX8';

app.get('/api/auth/google/url', async (req: Request, res: Response) => {
  const client = await getOAuth2Client();
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.json({ url });
});

app.get('/auth/google/callback', async (req: Request, res: Response) => {
  const { code } = req.query;
  const client = await getOAuth2Client();
  try {
    const { tokens } = await client.getToken(code as string);
    client.setCredentials(tokens);

    // Get user info
    const google = await getGoogle();
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    if (!email) throw new Error('No email found');

    // Check if user is authorized
    const users = await readData(USERS_FILE);
    const invitations = await readData(INVITATIONS_FILE);
    
    let user = users.find((u: any) => u.email === email);
    const invitation = invitations.find((i: any) => i.email === email);

    if (!user && !invitation && users.length > 0) {
      // Not authorized and not the first user (first user becomes admin)
      return res.status(403).send('Not authorized. Please ask for an invitation.');
    }

    if (!user) {
      // Create user from invitation or as first admin
      user = {
        id: uuidv4(),
        email,
        name: userInfo.data.name,
        picture: userInfo.data.picture,
        role: users.length === 0 ? 'admin' : (invitation?.role || 'viewer'),
        joinedAt: new Date().toISOString()
      };
      users.push(user);
      await writeData(USERS_FILE, users);

      // Remove invitation if it existed
      if (invitation) {
        const remainingInvites = invitations.filter((i: any) => i.email !== email);
        await writeData(INVITATIONS_FILE, remainingInvites);
      }
    }

    // Store tokens and user info in cookies
    res.cookie('google_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.cookie('user_profile', JSON.stringify(user), {
      httpOnly: false, // Accessible by client
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).send('Authentication failed');
  }
});

// Team Management Endpoints
app.get('/api/team', async (req: Request, res: Response) => {
  try {
    const users = await readData(USERS_FILE);
    const invitations = await readData(INVITATIONS_FILE);
    res.json({ users, invitations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

app.post('/api/team/invite', async (req: Request, res: Response) => {
  const { email, role } = req.body;
  const userProfile = req.cookies.user_profile ? JSON.parse(req.cookies.user_profile) : null;

  if (!userProfile || userProfile.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can invite users' });
  }

  try {
    const invitations = await readData(INVITATIONS_FILE);
    const users = await readData(USERS_FILE);

    if (users.find((u: any) => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const invitation = {
      id: uuidv4(),
      email,
      role,
      token: uuidv4(),
      invitedBy: userProfile.email,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };

    invitations.push(invitation);
    await writeData(INVITATIONS_FILE, invitations);

    // Send email if transporter is available
    const transporter = await getTransporter();
    if (transporter) {
      const inviteLink = `${process.env.APP_URL || 'http://localhost:3000'}`;
      await transporter.sendMail({
        from: `"Provencelia Studio" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Invitation to Provencelia Management Studio',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2F4D36;">Welcome to Provencelia</h2>
            <p>You have been invited by <strong>${userProfile.name || userProfile.email}</strong> to join the Provencelia Management Studio as an <strong>${role}</strong>.</p>
            <p>Click the button below to sign in and accept your invitation:</p>
            <a href="${inviteLink}" style="display: inline-block; background: #2F4D36; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accept Invitation</a>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">This invitation expires in 7 days.</p>
          </div>
        `
      });
    } else {
      console.log('Invitation created but email not sent (missing GMAIL credentials):', email);
    }

    res.json(invitation);
  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

app.delete('/api/team/user/:id', async (req: Request, res: Response) => {
  const userProfile = req.cookies.user_profile ? JSON.parse(req.cookies.user_profile) : null;
  if (!userProfile || userProfile.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const users = await readData(USERS_FILE);
    const filtered = users.filter((u: any) => u.id !== req.params.id);
    await writeData(USERS_FILE, filtered);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.delete('/api/team/invite/:id', async (req: Request, res: Response) => {
  const userProfile = req.cookies.user_profile ? JSON.parse(req.cookies.user_profile) : null;
  if (!userProfile || userProfile.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const invitations = await readData(INVITATIONS_FILE);
    const filtered = invitations.filter((i: any) => i.id !== req.params.id);
    await writeData(INVITATIONS_FILE, filtered);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel invitation' });
  }
});

app.get('/api/google-ads/data', async (req: Request, res: Response) => {
  const tokensCookie = req.cookies.google_tokens;
  if (!tokensCookie) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }

  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;

  if (!developerToken || !customerId) {
    return res.status(400).json({ error: 'Google Ads configuration missing (Developer Token or Customer ID)' });
  }

  try {
    const tokens = JSON.parse(tokensCookie);
    
    const GoogleAdsApi = await getGoogleAdsApi();
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      developer_token: developerToken,
    });

    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: tokens.refresh_token || tokens.access_token, // Fallback if no refresh token
    });

    // Query for daily spend by country
    // Note: Google Ads API uses GAQL (Google Ads Query Language)
    const query = `
      SELECT
        segments.date,
        campaign.name,
        metrics.cost_micros,
        metrics.clicks,
        metrics.impressions,
        customer.currency_code
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
    `;

    // For country-level data, we need a different resource or segment
    // geographic_view is often used for this
    const geoQuery = `
      SELECT
        segments.date,
        geographic_view.country_criterion_id,
        metrics.cost_micros,
        metrics.clicks,
        metrics.impressions
      FROM geographic_view
      WHERE segments.date DURING LAST_30_DAYS
    `;

    const [campaignResults, geoResults] = await Promise.all([
      customer.query(query),
      customer.query(geoQuery)
    ]);

    // Format results
    const dailyData = campaignResults.map((row: any) => ({
      date: row.segments.date,
      campaign: row.campaign.name,
      cost: row.metrics.cost_micros / 1000000, // Micros to standard currency
      clicks: row.metrics.clicks,
      impressions: row.metrics.impressions,
      currency: row.customer.currency_code
    }));

    const geoData = geoResults.map((row: any) => ({
      date: row.segments.date,
      countryId: row.geographic_view.country_criterion_id,
      cost: row.metrics.cost_micros / 1000000,
      clicks: row.metrics.clicks,
      impressions: row.metrics.impressions
    }));

    res.json({ dailyData, geoData });
  } catch (error: any) {
    console.error('Google Ads API Error:', error);
    res.status(500).json({ error: 'Failed to fetch Google Ads data', details: error.message });
  }
});

app.get('/api/sheets/data', async (req: Request, res: Response) => {
  const tokensCookie = req.cookies.google_tokens;
  if (!tokensCookie) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const tokens = JSON.parse(tokensCookie);
  const client = await getOAuth2Client();
  client.setCredentials(tokens);

  const google = await getGoogle();
  const sheets = google.sheets({ version: 'v4', auth: client });

  try {
    // Fetch Orders
    const ordersRes = await sheets.spreadsheets.values.get({
      spreadsheetId: ORDERS_SPREADSHEET_ID,
      range: 'A2:Z', // Skip header
    });

    // Fetch Prices
    const pricesRes = await sheets.spreadsheets.values.get({
      spreadsheetId: PRICES_SPREADSHEET_ID,
      range: 'A2:B', // SKU and Price
    });

    const ordersRows = ordersRes.data.values || [];
    const pricesRows = pricesRes.data.values || [];

    // If there are no rows, return empty
    if (ordersRows.length === 0) {
      return res.json({ orders: [], lastSync: new Date().toISOString() });
    }

    // Attempt to find headers in the first row
    const headers = ordersRows[0].map((h: any) => h?.toString().toLowerCase().trim());
    const getIdx = (names: string[], fallback: number) => {
      const idx = headers.findIndex((h: string) => names.some(n => h.includes(n)));
      return idx === -1 ? fallback : idx;
    };

    const idxOrderNum = getIdx(['order', 'číslo', 'id'], 0);
    const idxDate = getIdx(['date', 'datum'], 1);
    const idxChannel = getIdx(['channel', 'kanál', 'zdroj'], 2);
    const idxSku = getIdx(['sku', 'kód'], 3);
    const idxTotal = getIdx(['total', 'celkem', 'value', 'cena'], 4);
    const idxTax = getIdx(['tax', 'daň', 'dph'], 5);
    const idxShipping = getIdx(['shipping', 'doprava'], 6);
    const idxFees = getIdx(['fees', 'poplatky'], 7);
    const idxDiscount = getIdx(['discount', 'sleva'], 8);
    const idxQty = getIdx(['qty', 'quantity', 'množství', 'ks'], 9);

    // Create a map of SKU -> Purchase Price
    const priceMap: Record<string, number> = {};
    pricesRows.forEach(row => {
      const sku = row[0]?.toString().trim();
      const price = parseFloat(row[1]?.toString().replace(',', '.'));
      if (sku && !isNaN(price)) {
        priceMap[sku] = price;
      }
    });

    // Process Orders (skip the header row)
    const processedOrders = ordersRows.slice(1).map((row, index) => {
      const sku = row[idxSku]?.toString().trim();
      const purchasePrice = priceMap[sku] || 0;
      const quantity = parseInt(row[idxQty]) || 1;
      
      const totalValue = parseFloat(row[idxTotal]?.toString().replace(',', '.')) || 0;
      const tax = parseFloat(row[idxTax]?.toString().replace(',', '.')) || 0;
      const shipping = parseFloat(row[idxShipping]?.toString().replace(',', '.')) || 0;
      const fees = parseFloat(row[idxFees]?.toString().replace(',', '.')) || 0;
      const discount = parseFloat(row[idxDiscount]?.toString().replace(',', '.')) || 0;

      // productCost is purchasePrice * quantity
      const productCost = purchasePrice * quantity;
      const missingCost = !priceMap[sku];

      return {
        id: `gs-${index}`,
        orderNumber: row[idxOrderNum] || `ORD-${index}`,
        date: row[idxDate] || '',
        channel: (row[idxChannel]?.toLowerCase() || 'shopify'),
        totalValue,
        currency: 'CZK',
        tax,
        shipping,
        productCost,
        fees,
        discount,
        items: [{ sku, name: sku, quantity, price: totalValue / quantity }],
        missingCost
      };
    });

    res.json({
      orders: processedOrders,
      lastSync: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error fetching sheets:', error);
    if (error.message?.includes('invalid_grant')) {
      res.clearCookie('google_tokens');
      return res.status(401).json({ error: 'Session expired' });
    }
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

async function startServer() {
  await ensureDataDir();
  
  const PORT = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    console.log('📦 Production mode: Serving static files');
    app.use(express.static(path.join(process.cwd(), 'dist')));
    
    // SPA Fallback: Use regex to avoid "Missing parameter name" error in Express 5 with '*'
    app.get(/.*/, (req: Request, res: Response) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    console.log('🛠️ Development mode: Using Vite middleware');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // STRICTLY listen on port 3000 as per platform requirements, ignoring process.env.PORT if it differs
  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server listening on 0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('❌ FATAL: Failed to start server:', err);
  process.exit(1);
});
