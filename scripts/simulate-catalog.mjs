import fs from 'node:fs/promises';
import { performance } from 'node:perf_hooks';

const productCount = Number(process.env.PRODUCTS || 300);
const storeCount = Number(process.env.STORES || 50);
const dbPath = new URL('../server/data.json', import.meta.url);
const apiUrl = process.env.API_URL || 'http://localhost:4000';
const original = await fs.readFile(dbPath, 'utf8');

function product(id) {
  const categories = ['Staples', 'Snacks', 'Dairy', 'Beverages', 'Household', 'Personal Care'];
  return { id, name: `Demo Product ${id}`, brand: `Reach Brand ${id % 12}`, cat: categories[id % categories.length], price: 20 + (id % 480), old: null, rating: 4 + ((id % 10) / 10), icon: 'fa-box', c1: '#2E7FA3', c2: '#153A2C', expiry: '12 months', batch: `SIM-${String(id).padStart(5, '0')}` };
}

function store(id, productIds) {
  return { id, name: `Demo Kirana ${id}`, rating: 4.2 + ((id % 8) / 10), ratings: `${100 + id}`, eta: '12-18 min', distance: `${(id / 10).toFixed(1)} km`, c1: '#2E7FA3', c2: '#153A2C', tags: ['Verified', 'Demo inventory'], items: productIds, offer: id % 2 ? 'Free delivery' : null };
}

async function getCatalog() {
  const response = await fetch(`${apiUrl}/api/catalog`);
  if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
  return response.json();
}

try {
  const db = JSON.parse(original);
  const existingProductIds = new Set(db.products.map((item) => item.id));
  const syntheticProducts = Array.from({ length: productCount }, (_, index) => product(1000 + index)).filter((item) => !existingProductIds.has(item.id));
  const syntheticStores = Array.from({ length: storeCount }, (_, index) => {
    const start = (index * 6) % syntheticProducts.length;
    const items = syntheticProducts.slice(start, start + 6).map((item) => item.id);
    return store(1000 + index, items.length ? items : [syntheticProducts[0].id]);
  });
  db.products.push(...syntheticProducts);
  db.stores.push(...syntheticStores);
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));

  const started = performance.now();
  const catalog = await getCatalog();
  const elapsed = performance.now() - started;
  const searchTerms = ['Demo Product 1050', 'Reach Brand 7', 'SIM-01200'];
  const reachable = searchTerms.map((term) => ({ term, matches: catalog.products.filter((item) => `${item.name} ${item.brand} ${item.batch}`.toLowerCase().includes(term.toLowerCase())).length }));
  const storesWithProducts = catalog.stores.filter((item) => item.items.length > 0).length;
  if (catalog.products.length < productCount || storesWithProducts < storeCount || reachable.some((item) => item.matches === 0)) throw new Error('Synthetic customer reachability check failed');
  console.log(JSON.stringify({ products: catalog.products.length, stores: catalog.stores.length, storesWithProducts, payloadKb: Math.round(JSON.stringify(catalog).length / 1024), catalogMs: Number(elapsed.toFixed(1)), reachable }, null, 2));
} finally {
  await fs.writeFile(dbPath, original);
}
