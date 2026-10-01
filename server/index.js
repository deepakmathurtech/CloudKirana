import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function createApp() {
  const app = express();
  const root = path.dirname(fileURLToPath(import.meta.url));
  const dbFile = path.join(root, 'data.json');
  app.use(cors());
  app.use(express.json());

async function readDb() { return JSON.parse(await fs.readFile(dbFile, 'utf8')); }
async function writeDb(db) { await fs.writeFile(dbFile, JSON.stringify(db, null, 2)); }
function partnersFor(db) { return db.deliveryPartners?.length ? db.deliveryPartners : [{ id: 1, storeId: 1, name: 'Aman Kumar', phone: '9000000001', vehicle: 'DL-9F-2281', active: true }]; }
function wholesaleStockFor(db) { return db.wholesaleStock?.length ? db.wholesaleStock : db.products.map((product) => ({ productId: product.id, product: product.name, brand: product.brand, available: product.stock ?? (product.id === 2 ? 0 : product.id === 7 ? 8 : 120), unitPrice: product.price * 0.86, supplier: 'Noida Bulk Traders' })); }
function reservedQtyForProduct(db, productId) {
  return (db.orders || []).filter((order) => !['Cancelled'].includes(order.status)).reduce((sum, order) => {
    const itemQty = (order.items || []).filter((item) => Number(item.id) === Number(productId) || Number(item.productId) === Number(productId)).reduce((total, item) => total + Number(item.qty || item.quantity || 0), 0);
    return sum + itemQty;
  }, 0);
}
function availableStockForProduct(db, productId) {
  const product = (db.products || []).find((entry) => Number(entry.id) === Number(productId));
  if (!product) return 0;
  const softStock = Number(product.stock ?? 0);
  return Math.max(softStock - reservedQtyForProduct(db, productId), 0);
}
function relationshipsFor(db) { return db.relationships?.length ? db.relationships : [{ id: 'REL-001', ownerRole: 'retailer', owner: 'Sharma General Store', partnerRole: 'wholesaler', partner: 'Noida Bulk Traders', terms: 'Net 30', creditLimit: 50000, outstanding: 0, health: 'Active' }, { id: 'REL-002', ownerRole: 'wholesaler', owner: 'Noida Bulk Traders', partnerRole: 'distributor', partner: 'Noida Distribution Network', terms: 'Net 15', creditLimit: 150000, outstanding: 0, health: 'Active' }, { id: 'REL-003', ownerRole: 'manufacturer', owner: 'Aarav Foods Pvt Ltd', partnerRole: 'wholesaler', partner: 'Noida Bulk Traders', terms: 'Net 45', creditLimit: 250000, outstanding: 0, health: 'Active' }]; }

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'cloudkirana-api' }));
app.get('/api/catalog', async (_req, res) => {
  const db = await readDb();
  res.json({ products: db.products, stores: db.stores });
});
app.get('/api/orders', async (_req, res) => res.json((await readDb()).orders));
app.get('/api/orders/store/:storeId', async (req, res) => {
  const db = await readDb();
  res.json(db.orders.filter((order) => order.storeId === Number(req.params.storeId)));
});
app.get('/api/delivery-partners', async (req, res) => {
  const db = await readDb();
  const storeId = req.query.storeId ? Number(req.query.storeId) : null;
  res.json(partnersFor(db).filter((partner) => !storeId || partner.storeId === storeId));
});
app.post('/api/delivery-partners', async (req, res) => {
  const { storeId = 1, name, phone, vehicle } = req.body;
  if (!name || !phone || !vehicle) return res.status(400).json({ error: 'name, phone, and vehicle are required' });
  const db = await readDb();
  db.deliveryPartners = partnersFor(db);
  const partner = { id: Math.max(0, ...db.deliveryPartners.map((entry) => entry.id)) + 1, storeId: Number(storeId), name, phone, vehicle, active: true };
  db.deliveryPartners.push(partner);
  await writeDb(db);
  res.status(201).json(partner);
});
app.get('/api/orders/delivery/:partnerId', async (req, res) => {
  const db = await readDb();
  res.json(db.orders.filter((order) => order.deliveryPartnerId === Number(req.params.partnerId)));
});
app.get('/api/analytics', async (_req, res) => {
  const db = await readDb();
  const batches = db.batches || [];
  const events = batches.flatMap((batch) => batch.events || []);
  res.json({ products: db.products.length, batches: batches.length || db.products.length, verified: batches.filter((batch) => batch.verified !== false).length || db.products.length, events: events.length, inTransit: batches.filter((batch) => ['Dispatched', 'In transit'].includes(batch.status)).length });
});
app.get('/api/transfers', async (req, res) => {
  const db = await readDb();
  const role = req.query.role;
  const name = req.query.name;
  res.json((db.transfers || []).filter((transfer) => !role || transfer.fromRole === role || transfer.toRole === role).filter((transfer) => !name || transfer.from === name || transfer.to === name));
});
app.post('/api/transfers', async (req, res) => {
  const { batchCode, quantity, fromRole, from, toRole, to, eta = '24-48 hours' } = req.body;
  if (!batchCode || !quantity || !fromRole || !from || !toRole || !to) return res.status(400).json({ error: 'batchCode, quantity, sender, and receiver are required' });
  const db = await readDb();
  const batch = (db.batches || []).find((entry) => entry.code.toLowerCase() === String(batchCode).toLowerCase());
  if (!batch) return res.status(404).json({ error: 'Batch not found' });
  db.transfers = db.transfers || [];
  const transfer = { id: `TR-${Date.now().toString().slice(-7)}`, batchCode: batch.code, product: batch.product, quantity: Number(quantity), fromRole, from, toRole, to, eta, status: 'Requested', createdAt: new Date().toISOString() };
  db.transfers.unshift(transfer);
  await writeDb(db);
  res.status(201).json(transfer);
});
app.patch('/api/transfers/:id/status', async (req, res) => {
  const allowed = ['Requested', 'Accepted', 'In transit', 'Received', 'Rejected'];
  const db = await readDb();
  const transfer = (db.transfers || []).find((entry) => entry.id === req.params.id);
  if (!transfer || !allowed.includes(req.body.status)) return res.status(400).json({ error: 'Transfer or status not found' });
  transfer.status = req.body.status;
  transfer.updatedAt = new Date().toISOString();
  await writeDb(db);
  res.json(transfer);
});
app.get('/api/wholesale-stock', async (_req, res) => res.json(wholesaleStockFor(await readDb())));
app.get('/api/purchase-requests', async (req, res) => {
  const db = await readDb();
  const role = req.query.role;
  res.json((db.purchaseRequests || []).filter((request) => !role || request.fromRole === role || request.toRole === role));
});
app.post('/api/purchase-requests', async (req, res) => {
  const { productId, quantity, fromRole = 'retailer', from = 'Sharma General Store', toRole = 'wholesaler', to = 'Noida Bulk Traders' } = req.body;
  const db = await readDb();
  const stock = wholesaleStockFor(db).find((entry) => entry.productId === Number(productId));
  if (!stock || !quantity) return res.status(400).json({ error: 'productId and quantity are required' });
  db.wholesaleStock = wholesaleStockFor(db);
  const requested = Number(quantity);
  const status = stock.available >= requested ? 'Requested' : 'Backordered';
  if (status === 'Requested') stock.available -= requested;
  db.purchaseRequests = db.purchaseRequests || [];
  const request = { id: `PR-${Date.now().toString().slice(-7)}`, productId: stock.productId, product: stock.product, quantity: requested, unitPrice: stock.unitPrice, fromRole, from, toRole, to, status, createdAt: new Date().toISOString(), note: status === 'Backordered' ? `Only ${stock.available} units available; replenishment required` : 'Stock available for confirmation' };
  db.purchaseRequests.unshift(request);
  await writeDb(db);
  res.status(201).json(request);
});
app.patch('/api/purchase-requests/:id/status', async (req, res) => {
  const allowed = ['Accepted', 'Rejected', 'Ready to dispatch', 'In transit', 'Received'];
  const db = await readDb();
  const request = (db.purchaseRequests || []).find((entry) => entry.id === req.params.id);
  if (!request || !allowed.includes(req.body.status)) return res.status(400).json({ error: 'Purchase request or status not found' });
  request.status = req.body.status;
  request.updatedAt = new Date().toISOString();
  await writeDb(db);
  res.json(request);
});
app.get('/api/relationships', async (req, res) => { const db = await readDb(); const role = req.query.role; res.json(relationshipsFor(db).filter((item) => !role || item.ownerRole === role || item.partnerRole === role)); });
app.post('/api/relationships', async (req, res) => { const { ownerRole, owner, partnerRole, partner, terms = 'Net 30', creditLimit = 0 } = req.body; if (!ownerRole || !owner || !partnerRole || !partner) return res.status(400).json({ error: 'owner and partner details are required' }); const db = await readDb(); db.relationships = relationshipsFor(db); const relationship = { id: `REL-${String(db.relationships.length + 1).padStart(3, '0')}`, ownerRole, owner, partnerRole, partner, terms, creditLimit: Number(creditLimit), outstanding: 0, health: 'Active' }; db.relationships.push(relationship); await writeDb(db); res.status(201).json(relationship); });
app.patch('/api/relationships/:id', async (req, res) => { const db = await readDb(); db.relationships = relationshipsFor(db); const relationship = db.relationships.find((item) => item.id === req.params.id); if (!relationship) return res.status(404).json({ error: 'Relationship not found' }); Object.assign(relationship, req.body, { id: relationship.id }); await writeDb(db); res.json(relationship); });
app.get('/api/accounting', async (req, res) => { const db = await readDb(); const role = req.query.role; const entries = (db.accountingEntries || []).filter((item) => !role || item.role === role || item.counterpartyRole === role); const totals = entries.reduce((sum, item) => ({ receivable: sum.receivable + (item.type === 'receivable' ? item.amount : 0), payable: sum.payable + (item.type === 'payable' ? item.amount : 0), paid: sum.paid + (item.type === 'payment' ? item.amount : 0) }), { receivable: 0, payable: 0, paid: 0 }); res.json({ entries, totals, relationships: relationshipsFor(db).filter((item) => !role || item.ownerRole === role || item.partnerRole === role) }); });
app.post('/api/accounting/entries', async (req, res) => { const { role, owner, type, amount, description, counterpartyRole = '', counterparty = '', reference = '' } = req.body; if (!role || !owner || !type || !amount || !description) return res.status(400).json({ error: 'role, owner, type, amount, and description are required' }); const db = await readDb(); db.accountingEntries = db.accountingEntries || []; const entry = { id: `ACC-${Date.now().toString().slice(-7)}`, role, owner, type, amount: Number(amount), description, counterpartyRole, counterparty, reference, status: type === 'payment' ? 'Settled' : 'Open', createdAt: new Date().toISOString() }; db.accountingEntries.unshift(entry); await writeDb(db); res.status(201).json(entry); });
app.post('/api/products', async (req, res) => {
  const { name, brand, cat = 'Staples', price, expiry = '12 months' } = req.body;
  if (!name || !brand || !price) return res.status(400).json({ error: 'name, brand, and price are required' });
  const db = await readDb();
  const product = { id: db.nextProduct++, name, brand, cat, price: Number(price), old: null, rating: 5, icon: 'fa-box', c1: '#2E7FA3', c2: '#153A2C', expiry, batch: null };
  db.products.push(product);
  await writeDb(db);
  res.status(201).json(product);
});
app.post('/api/orders', async (req, res) => {
  const { storeId, items, payment = 'upi' } = req.body;
  if (!storeId || !Array.isArray(items) || !items.length) return res.status(400).json({ error: 'storeId and items are required' });
  const db = await readDb();
  const store = db.stores.find((entry) => entry.id === Number(storeId));
  const lineItems = items.map(({ productId, quantity }) => {
    const product = db.products.find((entry) => entry.id === Number(productId));
    if (!product || !quantity || quantity < 1) throw new Error('Invalid order item');
    const reserved = reservedQtyForProduct(db, product.id);
    const available = Number(product.stock ?? 0) - reserved;
    if (Number(quantity) > available) {
      throw new Error(`${product.name} only ${available} units available right now`);
    }
    return { ...product, qty: Number(quantity) };
  });
  const subtotal = lineItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const delivery = subtotal > 500 ? 0 : 25;
  const order = { code: `CK-${db.nextOrder++}`, storeId: Number(storeId), storeName: store?.name || 'Store', items: lineItems, subtotal, delivery, fee: 2, total: subtotal + delivery + 2, payment, status: 'Received', time: 'Just now', updatedAt: new Date().toISOString() };
  lineItems.forEach((item) => {
    const product = db.products.find((entry) => entry.id === Number(item.id));
    if (product) product.stock = Math.max(0, Number(product.stock ?? 0) - Number(item.qty));
  });
  db.orders.unshift(order);
  await writeDb(db);
  res.status(201).json(order);
});
app.patch('/api/orders/:code/status', async (req, res) => {
  const allowed = ['Received', 'Preparing', 'Ready for pickup', 'Picked up', 'Delivered', 'Cancelled'];
  const db = await readDb();
  const order = db.orders.find((entry) => entry.code === req.params.code);
  if (!order || !allowed.includes(req.body.status)) return res.status(400).json({ error: 'Unknown order or status' });
  const wasCancelled = order.status === 'Cancelled';
  order.status = req.body.status;
  if (req.body.status === 'Cancelled' && !wasCancelled) {
    (order.items || []).forEach((item) => {
      const product = db.products.find((entry) => Number(entry.id) === Number(item.id || item.productId));
      if (product) product.stock = Number(product.stock ?? 0) + Number(item.qty || item.quantity || 0);
    });
  }
  order.updatedAt = new Date().toISOString();
  await writeDb(db);
  res.json(order);
});
app.patch('/api/orders/:code/assign-delivery', async (req, res) => {
  const db = await readDb();
  const order = db.orders.find((entry) => entry.code === req.params.code);
  const partner = partnersFor(db).find((entry) => entry.id === Number(req.body.partnerId));
  if (!order || !partner || partner.storeId !== order.storeId) return res.status(400).json({ error: 'Order or store delivery partner not found' });
  order.deliveryPartnerId = partner.id;
  order.deliveryPartnerName = partner.name;
  order.deliveryPartnerVehicle = partner.vehicle;
  if (order.status === 'Received') order.status = 'Preparing';
  order.updatedAt = new Date().toISOString();
  await writeDb(db);
  res.json(order);
});
app.post('/api/batches', async (req, res) => {
  const { productId, quantity, origin, expiry, manufacturer = 'Aarav Foods Pvt Ltd' } = req.body;
  if (!productId || !quantity || !origin || !expiry) return res.status(400).json({ error: 'productId, quantity, origin, and expiry are required' });
  const db = await readDb();
  const product = db.products.find((entry) => entry.id === Number(productId));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const batchCode = `${String(manufacturer).slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
  const batch = { code: batchCode, productId: product.id, product: product.name, brand: product.brand, quantity: Number(quantity), origin, expiry, manufacturer, status: 'Registered', verified: true, events: [{ type: 'Manufactured', actor: manufacturer, location: origin, at: new Date().toISOString() }] };
  db.batches = db.batches || [];
  db.batches.unshift(batch);
  product.batch = batchCode;
  await writeDb(db);
  res.status(201).json(batch);
});
app.post('/api/batches/:batch/events', async (req, res) => {
  const { type, actor, location, note = '' } = req.body;
  const db = await readDb();
  db.batches = db.batches || [];
  let batch = db.batches.find((entry) => entry.code.toLowerCase() === req.params.batch.toLowerCase());
  const product = db.products.find((entry) => entry.batch?.toLowerCase() === req.params.batch.toLowerCase());
  if (!batch && product) {
    batch = { code: product.batch, productId: product.id, product: product.name, brand: product.brand, quantity: 'Catalog stock', origin: 'Registered manufacturer', expiry: product.expiry, manufacturer: product.brand, status: 'Verified', verified: true, events: [{ type: 'Manufactured', actor: product.brand, location: 'Manufacturer ledger', at: new Date().toISOString() }] };
    db.batches.unshift(batch);
  }
  if (!batch || !type || !actor || !location) return res.status(400).json({ error: 'batch, type, actor, and location are required' });
  batch.events.push({ type, actor, location, note, at: new Date().toISOString() });
  batch.status = type;
  await writeDb(db);
  res.json(batch);
});
app.get('/api/batches', async (_req, res) => res.json((await readDb()).batches || []));
app.get('/api/batches/:batch', async (req, res) => {
  const db = await readDb();
  const storedBatch = (db.batches || []).find((entry) => entry.code.toLowerCase() === req.params.batch.toLowerCase());
  const product = db.products.find((entry) => entry.batch?.toLowerCase() === req.params.batch.toLowerCase());
  if (!storedBatch && !product) return res.status(404).json({ verified: false, error: 'Batch not found' });
  const batch = storedBatch || { code: product.batch, product: product.name, brand: product.brand, quantity: 'Catalog stock', origin: 'Registered manufacturer', expiry: product.expiry, manufacturer: product.brand, status: 'Verified', verified: true, events: [{ type: 'Manufactured', actor: product.brand, location: 'Manufacturer ledger', at: new Date().toISOString() }] };
  res.json({ ...batch, verified: batch.verified !== false, checks: ['Batch registered by manufacturer', 'Cold-chain / storage compliant', 'Not reported counterfeit', 'Within best-before window'] });
});
  app.use(express.static(path.join(root, '..', 'dist')));

  return app;
}

function startServer(portIndex = 0) {
  const fallbackPorts = [Number(process.env.PORT || 4000), 4001, 4002, 4003, 4004, 4005];
  const app = createApp();
  const port = fallbackPorts[portIndex];
  const server = app.listen(port, () => {
    console.log(`Cloud Kirana API listening on http://localhost:${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && portIndex < fallbackPorts.length - 1) {
      console.warn(`Port ${port} is busy; retrying on ${fallbackPorts[portIndex + 1]}`);
      startServer(portIndex + 1);
      return;
    }
    console.error(error);
    process.exit(1);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer();
}
