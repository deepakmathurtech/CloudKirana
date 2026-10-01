import { addDoc, collection, getDocs, query, serverTimestamp, updateDoc, where, doc } from 'firebase/firestore';
import { firebaseAuth, firestore, startFirebase } from './firebase';

export let dataSource = 'local-api';
export function setDataSource(next) { dataSource = next; }

const api = async (url, options = {}) => {
  const endpoints = [];
  const relativeUrl = typeof url === 'string' && url.startsWith('/') ? url : null;

  if (relativeUrl && !import.meta.env.DEV) {
    throw new Error('The local API is available only during development. Configure the production data service.');
  }

  if (relativeUrl) {
    for (const port of [4000, 4001, 4002, 4003, 4004]) {
      endpoints.push(`http://localhost:${port}${relativeUrl}`);
    }
    endpoints.push(relativeUrl);
  } else {
    endpoints.push(url);
  }

  let lastError;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, options);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Request failed');
      }
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Request failed');
};

function withTimeout(promise, milliseconds = 3500) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase request timed out')), milliseconds))
  ]);
}

async function firebaseCatalog() {
  const [productsSnapshot, storesSnapshot] = await Promise.all([
    getDocs(collection(firestore, 'products')),
    getDocs(collection(firestore, 'stores'))
  ]);
  const products = productsSnapshot.docs.map((item) => ({ id: Number(item.id) || item.id, ...item.data() }));
  const stores = storesSnapshot.docs.map((item) => ({ id: Number(item.id) || item.id, ...item.data() }));
  if (!products.length || !stores.length) throw new Error('Firebase catalog is not seeded');
  return { products, stores };
}

async function firebaseOrders(user) {
  const snapshot = await getDocs(query(collection(firestore, 'orders'), where('userId', '==', user.uid)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => String(b.createdAt?.toDate?.() || '').localeCompare(String(a.createdAt?.toDate?.() || '')));
}

async function getCollection(collectionName) {
  const snapshot = await getDocs(collection(firestore, collectionName));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

async function getOneByField(collectionName, field, value) {
  const snapshot = await getDocs(query(collection(firestore, collectionName), where(field, '==', value)));
  if (snapshot.empty) return null;
  const item = snapshot.docs[0];
  return { id: item.id, ...item.data() };
}

async function firebaseBackendRequest(url, options = {}) {
  const path = url.startsWith('http') ? new URL(url).pathname : url;
  const method = (options.method || 'GET').toUpperCase();

  if (path === '/api/catalog') return firebaseCatalog();
  if (path === '/api/orders' && method === 'GET') return getCollection('orders');
  if (path.startsWith('/api/orders/store/')) {
    const storeId = Number(path.split('/').pop());
    const items = await getCollection('orders');
    return items.filter((item) => Number(item.storeId) === storeId);
  }
  if (path.startsWith('/api/orders/') && path.endsWith('/status')) {
    const code = path.split('/')[2];
    const current = await getOneByField('orders', 'code', code);
    if (!current) throw new Error('Order not found');
    const payload = { ...(options.body ? JSON.parse(options.body) : {}), updatedAt: new Date().toISOString() };
    await updateDoc(doc(firestore, 'orders', current.id), payload);
    return { ...current, ...payload };
  }
  if (path.startsWith('/api/orders/') && path.endsWith('/assign-delivery')) {
    const code = path.split('/')[2];
    const current = await getOneByField('orders', 'code', code);
    if (!current) throw new Error('Order not found');
    const payload = { ...(options.body ? JSON.parse(options.body) : {}), updatedAt: new Date().toISOString() };
    await updateDoc(doc(firestore, 'orders', current.id), payload);
    return { ...current, ...payload };
  }
  if (path === '/api/delivery-partners' && method === 'GET') return getCollection('deliveryPartners');
  if (path === '/api/delivery-partners' && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const created = await addDoc(collection(firestore, 'deliveryPartners'), { ...body, createdAt: serverTimestamp() });
    return { id: created.id, ...body };
  }
  if (path === '/api/wholesale-stock' && method === 'GET') return getCollection('wholesaleStock');
  if (path === '/api/purchase-requests' && method === 'GET') return getCollection('purchaseRequests');
  if (path === '/api/purchase-requests' && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const created = await addDoc(collection(firestore, 'purchaseRequests'), { ...body, createdAt: serverTimestamp() });
    return { id: created.id, ...body };
  }
  if (path.startsWith('/api/purchase-requests/') && path.endsWith('/status')) {
    const id = path.split('/')[2];
    const current = await getOneByField('purchaseRequests', 'id', id);
    if (!current) throw new Error('Purchase request not found');
    const payload = { ...(options.body ? JSON.parse(options.body) : {}), updatedAt: new Date().toISOString() };
    await updateDoc(doc(firestore, 'purchaseRequests', current.id), payload);
    return { ...current, ...payload };
  }
  if (path === '/api/transfers' && method === 'GET') return getCollection('transfers');
  if (path === '/api/transfers' && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const created = await addDoc(collection(firestore, 'transfers'), { ...body, createdAt: serverTimestamp() });
    return { id: created.id, ...body };
  }
  if (path.startsWith('/api/transfers/') && path.endsWith('/status')) {
    const id = path.split('/')[2];
    const current = await getOneByField('transfers', 'id', id);
    if (!current) throw new Error('Transfer not found');
    const payload = { ...(options.body ? JSON.parse(options.body) : {}), updatedAt: new Date().toISOString() };
    await updateDoc(doc(firestore, 'transfers', current.id), payload);
    return { ...current, ...payload };
  }
  if (path === '/api/relationships' && method === 'GET') return getCollection('relationships');
  if (path === '/api/relationships' && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const created = await addDoc(collection(firestore, 'relationships'), { ...body, createdAt: serverTimestamp() });
    return { id: created.id, ...body };
  }
  if (path.startsWith('/api/relationships/') && method === 'PATCH') {
    const id = path.split('/')[2];
    const current = await getOneByField('relationships', 'id', id);
    if (!current) throw new Error('Relationship not found');
    const payload = options.body ? JSON.parse(options.body) : {};
    await updateDoc(doc(firestore, 'relationships', current.id), payload);
    return { ...current, ...payload };
  }
  if (path === '/api/accounting' && method === 'GET') {
    const entries = await getCollection('accountingEntries');
    const totals = entries.reduce((sum, item) => ({ receivable: sum.receivable + (item.type === 'receivable' ? item.amount : 0), payable: sum.payable + (item.type === 'payable' ? item.amount : 0), paid: sum.paid + (item.type === 'payment' ? item.amount : 0) }), { receivable: 0, payable: 0, paid: 0 });
    return { entries, totals, relationships: await getCollection('relationships') };
  }
  if (path === '/api/accounting/entries' && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const created = await addDoc(collection(firestore, 'accountingEntries'), { ...body, createdAt: serverTimestamp() });
    return { id: created.id, ...body };
  }

  throw new Error('Firebase route not implemented');
}

export async function loadCloudData() {
  try {
    const user = await withTimeout(startFirebase());
    const catalog = await withTimeout(firebaseCatalog());
    const orders = await withTimeout(firebaseOrders(user));
    dataSource = 'firebase';
    return { ...catalog, orders, source: 'firebase' };
  } catch (error) {
    if (!import.meta.env.DEV) {
      throw new Error('Cloud data service unavailable. Check Firebase configuration and security rules.', { cause: error });
    }
    const [catalog, orders] = await Promise.all([api('/api/catalog'), api('/api/orders')]);
    dataSource = 'local-api';
    return { ...catalog, orders, source: 'local-api' };
  }
}

export async function createOrder(order, source = 'firebase') {
  if (source === 'local-api') return api('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
  try {
    const user = firebaseAuth.currentUser || await startFirebase();
    const reference = await addDoc(collection(firestore, 'orders'), { ...order, userId: user.uid, createdAt: serverTimestamp() });
    return { ...order, id: reference.id, userId: user.uid, time: 'Just now' };
  } catch (error) {
    if (!import.meta.env.DEV) throw error;
    return api('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
  }
}

export async function backendRequest(url, options = {}) {
  if (dataSource === 'firebase') {
    try {
      return await firebaseBackendRequest(url, options);
    } catch (error) {
      if (!import.meta.env.DEV) throw error;
      return api(url, options);
    }
  }
  return api(url, options);
}

export { api };
