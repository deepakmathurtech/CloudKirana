import { useEffect, useMemo, useState } from 'react';
import { Business, BusinessPage, Delivery } from './components/operations';
import { Cart, Checkout, Confirmation, Orders, Wishlist } from './components/commerce';
import { Home, StoreDetail } from './components/customer';
import { Nav, ProfilePage, Shell } from './components/layout';
import { RoleSelect } from './components/roles';
import { roles } from './data';
import { createOrder, loadCloudData, setDataSource } from './lib/cloudData';
import { signInWithGoogle, signOutUser, watchAuth } from './lib/firebase';

export default function App() {
  const [catalog, setCatalog] = useState({ products: [], stores: [] });
  const [orders, setOrders] = useState([]);
  const [screen, setScreen] = useState('roles');
  const [role, setRole] = useState('consumer');
  const [businessTab, setBusinessTab] = useState('overview');
  const [deliverySection, setDeliverySection] = useState('runs');
  const [dark, setDark] = useState(false);
  const [cart, setCart] = useState({});
  const [cartStore, setCartStore] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [activeStore, setActiveStore] = useState(null);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const [payment, setPayment] = useState('upi');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dataSourceState, setDataSourceState] = useState('local-api');

  useEffect(() => {
    let active = true;
    const refresh = () => loadCloudData().then(({ products, stores, orders, source }) => { if (active) { setCatalog({ products, stores }); setOrders(orders); setDataSourceState(source); setDataSource(source); } }).catch(() => { if (active) { setDataSourceState('local-api'); setDataSource('local-api'); setToast('Data service unavailable - start the server first'); } }).finally(() => { if (active) setLoading(false); });
    const unsubscribe = watchAuth((nextUser) => { if (active) setUser(nextUser); if (nextUser) refresh(); });
    refresh();
    return () => { active = false; unsubscribe(); };
  }, []);
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(''), 2400); return () => clearTimeout(timer); }, [toast]);

  const product = (id) => catalog.products.find((item) => item.id === Number(id));
  const currentStore = catalog.stores.find((store) => store.id === activeStore);
  const cartItems = Object.entries(cart).map(([id, qty]) => ({ product: product(id), qty })).filter((item) => item.product);
  const totals = useMemo(() => { const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0); const delivery = subtotal > 500 ? 0 : subtotal ? 25 : 0; return { subtotal, delivery, fee: subtotal ? 2 : 0, total: subtotal + delivery + (subtotal ? 2 : 0) }; }, [cartItems]);
  const notify = (message) => setToast(message);
  const loginWithGoogle = async () => { setLoginBusy(true); try { await Promise.race([signInWithGoogle(), new Promise((_, reject) => setTimeout(() => reject(new Error('Google login timed out')), 8000))]); notify('Signed in with Google'); } catch (error) { notify(error.code === 'auth/popup-blocked' ? 'Allow popups to sign in with Google' : 'Google sign-in is unavailable'); } finally { setLoginBusy(false); } };
  const logout = async () => { try { await signOutUser(); notify('Signed out'); } catch { notify('Could not sign out'); } };
  const go = (next) => { setScreen(next); setMenuOpen(false); window.scrollTo(0, 0); };
  const navigate = (destination) => {
    const [nextScreen, section] = destination.split(':');
    if (nextScreen === 'business-page') setBusinessTab(section || 'overview');
    if (nextScreen === 'delivery') setDeliverySection(section || 'runs');
    go(nextScreen);
  };
  const chooseRole = (next) => { setRole(next); setBusinessTab('overview'); setDeliverySection('runs'); setMenuOpen(false); go(next === 'consumer' ? 'home' : next === 'delivery' ? 'delivery' : 'business'); };
  const openProfile = () => { setMenuOpen(false); go('profile'); };
  const add = (productId, storeId) => { const productEntry = product(productId); if (!productEntry) return; if (cartStore && cartStore !== storeId && Object.keys(cart).length) { if (!window.confirm('Clear your current store cart and add this item?')) return; setCart({}); } const available = Number(productEntry.stock ?? 0); const currentInCart = cart[productId] || 0; if (currentInCart >= available) { notify(`${productEntry.name} has only ${available} unit${available === 1 ? '' : 's'} left`); return; } if (cartStore && cartStore !== storeId && Object.keys(cart).length) { if (!window.confirm('Clear your current store cart and add this item?')) return; setCart({}); } setCartStore(storeId); setCart((items) => ({ ...items, [productId]: (items[productId] || 0) + 1 })); notify('Added to cart'); };
  const changeQty = (id, delta) => setCart((items) => { const productEntry = product(id); const current = items[id] || 0; const nextValue = current + delta; if (!productEntry) return items; const ceil = Number(productEntry.stock ?? 0); if (nextValue > ceil) { notify(`${productEntry.name} has only ${ceil} unit${ceil === 1 ? '' : 's'} left`); return items; } const next = { ...items, [id]: nextValue }; if (next[id] <= 0) delete next[id]; if (!Object.keys(next).length) setCartStore(null); return next; });
  const openStore = (id) => { setActiveStore(id); setQuery(''); setCategory('All'); go('store'); };
  const reorder = (order) => { setCartStore(order.storeId); setCart(Object.fromEntries(order.items.map((item) => [item.id, item.qty]))); go('cart'); notify('Items added from your past order'); };
  const placeOrder = async () => { try { const order = await createOrder({ storeId: cartStore, payment, items: cartItems.map(({ product: item, qty }) => ({ productId: item.id, quantity: qty })) }, dataSourceState); setOrders((items) => [order, ...items]); setCart({}); setCartStore(null); go('confirmation'); } catch { notify('Could not place order'); } };
  const toggleWish = (id) => setWishlist((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  const cartCount = Object.values(cart).reduce((sum, count) => sum + count, 0);

  if (loading) return <Shell dark={dark}><div className="loading">Loading your verified local market...</div></Shell>;
  return <Shell
    dark={dark}
    toast={toast}
    menuOpen={menuOpen}
    onCloseMenu={() => setMenuOpen(false)}
    onOpenMenu={() => setMenuOpen(true)}
    onOpenProfile={openProfile}
    onChooseRole={chooseRole}
    onNavigate={navigate}
    onGoHome={() => go('home')}
    onGoOrders={() => go('orders')}
    onGoWishlist={() => go('wishlist')}
    onGoCart={() => go('cart')}
    role={role}
    user={user}
    onGoogleLogin={loginWithGoogle}
    onLogout={logout}
  >
    {screen === 'roles' && <RoleSelect chooseRole={chooseRole} user={user} onGoogleLogin={loginWithGoogle} onLogout={logout} loginBusy={loginBusy} />}
    {screen === 'home' && <Home stores={catalog.stores} products={catalog.products} category={category} setCategory={setCategory} query={query} setQuery={setQuery} openStore={openStore} go={go} cartCount={cartCount} dark={dark} setDark={setDark} user={user} notify={notify} />}
    {screen === 'store' && currentStore && <StoreDetail store={currentStore} products={catalog.products} query={query} setQuery={setQuery} category={category} setCategory={setCategory} cart={cart} add={add} changeQty={changeQty} wishlist={wishlist} toggleWish={toggleWish} go={go} totals={totals} notify={notify} />}
    {screen === 'cart' && <Cart items={cartItems} store={catalog.stores.find((store) => store.id === cartStore)} totals={totals} changeQty={changeQty} go={go} />}
    {screen === 'checkout' && <Checkout totals={totals} payment={payment} setPayment={setPayment} placeOrder={placeOrder} go={go} />}
    {screen === 'confirmation' && <Confirmation order={orders[0]} go={go} />}
    {screen === 'orders' && <Orders orders={orders} go={go} reorder={reorder} />}
    {screen === 'wishlist' && <Wishlist products={catalog.products} wishlist={wishlist} toggleWish={toggleWish} go={go} />}
    {screen === 'profile' && <ProfilePage user={user} role={role} dark={dark} setDark={setDark} go={go} notify={notify} onGoogleLogin={loginWithGoogle} onLogout={logout} />}
    {screen === 'business' && <Business role={role} products={catalog.products} go={go} notify={notify} user={user} />}
    {screen === 'business-page' && <BusinessPage role={role} products={catalog.products} go={go} notify={notify} user={user} tab={businessTab} setTab={setBusinessTab} />}
    {screen === 'delivery' && <Delivery go={go} notify={notify} user={user} section={deliverySection} />}
    {role === 'consumer' && screen !== 'roles' && screen !== 'home' && <Nav screen={screen} go={go} count={cartCount} />}
  </Shell>;
}
