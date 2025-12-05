import express, { Request, Response } from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';
import { 
  ProductStorage, 
  CustomerStorage, 
  SupplierStorage, 
  TransactionStorage, 
  BatchStorage 
} from '../lib/storage';

const app = express();
const PORT = 5000;
const METRO_PORT = 8081;

app.use(cors());
app.use(express.json());

app.get('/api/products', async (_req: Request, res: Response) => {
  try {
    const products = await ProductStorage.getAll();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await ProductStorage.getById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.post('/api/products', async (req: Request, res: Response) => {
  try {
    const success = await ProductStorage.add(req.body);
    res.json({ success });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

app.put('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const success = await ProductStorage.update(req.body);
    res.json({ success });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const success = await ProductStorage.delete(req.params.id);
    res.json({ success });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.get('/api/customers', async (_req: Request, res: Response) => {
  try {
    const customers = await CustomerStorage.getAll();
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.post('/api/customers', async (req: Request, res: Response) => {
  try {
    const success = await CustomerStorage.add(req.body);
    res.json({ success });
  } catch (error) {
    console.error('Error adding customer:', error);
    res.status(500).json({ error: 'Failed to add customer' });
  }
});

app.put('/api/customers/:id', async (req: Request, res: Response) => {
  try {
    const success = await CustomerStorage.update(req.body);
    res.json({ success });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

app.get('/api/suppliers', async (_req: Request, res: Response) => {
  try {
    const suppliers = await SupplierStorage.getAll();
    res.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

app.post('/api/suppliers', async (req: Request, res: Response) => {
  try {
    const success = await SupplierStorage.add(req.body);
    res.json({ success });
  } catch (error) {
    console.error('Error adding supplier:', error);
    res.status(500).json({ error: 'Failed to add supplier' });
  }
});

app.put('/api/suppliers/:id', async (req: Request, res: Response) => {
  try {
    const success = await SupplierStorage.update(req.body);
    res.json({ success });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

app.get('/api/transactions', async (_req: Request, res: Response) => {
  try {
    const transactions = await TransactionStorage.getAll();
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.get('/api/transactions/:id', async (req: Request, res: Response) => {
  try {
    const transaction = await TransactionStorage.getById(req.params.id);
    if (transaction) {
      res.json(transaction);
    } else {
      res.status(404).json({ error: 'Transaction not found' });
    }
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

app.post('/api/transactions', async (req: Request, res: Response) => {
  try {
    const success = await TransactionStorage.add(req.body);
    res.json({ success });
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

app.get('/api/batches', async (_req: Request, res: Response) => {
  try {
    const batches = await BatchStorage.getAll();
    res.json(batches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

app.post('/api/batches', async (req: Request, res: Response) => {
  try {
    const success = await BatchStorage.add(req.body);
    res.json({ success });
  } catch (error) {
    console.error('Error adding batch:', error);
    res.status(500).json({ error: 'Failed to add batch' });
  }
});

app.put('/api/batches/:id', async (req: Request, res: Response) => {
  try {
    const success = await BatchStorage.update(req.body);
    res.json({ success });
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({ error: 'Failed to update batch' });
  }
});

app.patch('/api/batches/:id/quantity', async (req: Request, res: Response) => {
  try {
    const { quantity } = req.body;
    const success = await BatchStorage.updateQuantity(req.params.id, quantity);
    res.json({ success });
  } catch (error) {
    console.error('Error updating batch quantity:', error);
    res.status(500).json({ error: 'Failed to update batch quantity' });
  }
});

console.log('Starting Metro bundler on port', METRO_PORT);
const metro = spawn('npx', [
  'expo', 'start', '--web', '--port', String(METRO_PORT), '--non-interactive'
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    EXPO_PACKAGER_PROXY_URL: `https://${process.env.REPLIT_DEV_DOMAIN}`,
    REACT_NATIVE_PACKAGER_HOSTNAME: process.env.REPLIT_DEV_DOMAIN,
  }
});

metro.on('error', (err) => {
  console.error('Failed to start Metro:', err);
});

const metroProxy = createProxyMiddleware({
  target: `http://localhost:${METRO_PORT}`,
  changeOrigin: true,
  ws: true,
  pathFilter: (path) => {
    return !path.startsWith('/api');
  },
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`Proxying non-API requests to Metro on port ${METRO_PORT}`);
});

setTimeout(() => {
  app.use('/', metroProxy);
  console.log('Metro proxy enabled');
}, 5000);
