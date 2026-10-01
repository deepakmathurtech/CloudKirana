import { useEffect } from 'react';
import { icon } from './ui';
import { PersonalizedWorkspace } from './personalization';

export function Shell({ dark, toast, children, menuOpen, onCloseMenu, onOpenMenu, onOpenProfile, onChooseRole, onNavigate, onGoHome, onGoOrders, onGoWishlist, onGoCart, role, user, onGoogleLogin, onLogout }) {
  const roleOptions = [
    ['consumer', 'fa-basket-shopping', 'Customer'],
    ['manufacturer', 'fa-industry', 'Manufacturer'],
    ['wholesaler', 'fa-warehouse', 'Wholesaler'],
    ['distributor', 'fa-truck-ramp-box', 'Distributor'],
    ['retailer', 'fa-store', 'Shopkeeper'],
    ['delivery', 'fa-motorcycle', 'Delivery']
  ];

  const navigate = (screenName) => {
    if (screenName === 'profile') return onOpenProfile?.();
    if (screenName === 'home') return onGoHome?.();
    if (screenName === 'orders') return onGoOrders?.();
    if (screenName === 'wishlist') return onGoWishlist?.();
    if (screenName === 'cart') return onGoCart?.();
    if (screenName) return onNavigate?.(screenName);
  };

  const roleMenuMap = {
    consumer: [
      ['Home', 'fa-house', 'home'],
      ['Orders', 'fa-receipt', 'orders'],
      ['Saved', 'fa-heart', 'wishlist'],
      ['Cart', 'fa-cart-shopping', 'cart'],
      ['Profile', 'fa-user-circle', 'profile']
    ],
    manufacturer: [
      ['Production', 'fa-industry', 'business'],
      ['Inventory', 'fa-boxes-stacked', 'business-page:inventory'],
      ['Batch trace', 'fa-barcode', 'business-page:trace'],
      ['Dispatch', 'fa-truck-fast', 'business-page:transfers'],
      ['Ledger', 'fa-book', 'business-page:ledger']
    ],
    wholesaler: [
      ['Dashboard', 'fa-warehouse', 'business'],
      ['Inventory', 'fa-boxes-stacked', 'business-page:inventory'],
      ['Requests', 'fa-inbox', 'business-page:requests'],
      ['Transfers', 'fa-truck-fast', 'business-page:transfers'],
      ['Partners', 'fa-handshake', 'business-page:partners'],
      ['Ledger', 'fa-book', 'business-page:ledger']
    ],
    distributor: [
      ['Routes', 'fa-map-location-dot', 'business'],
      ['Dispatch', 'fa-truck-ramp-box', 'business-page:transfers'],
      ['Retail network', 'fa-store', 'business-page:partners'],
      ['Proofs', 'fa-stamp', 'business-page:verify'],
      ['Inventory', 'fa-boxes-stacked', 'business-page:inventory'],
      ['Ledger', 'fa-book', 'business-page:ledger']
    ],
    retailer: [
      ['Store dashboard', 'fa-store', 'business'],
      ['Stock', 'fa-boxes-stacked', 'business-page:inventory'],
      ['Orders', 'fa-receipt', 'business-page:orders'],
      ['Restock', 'fa-cart-plus', 'business-page:procure'],
      ['Supplier network', 'fa-handshake', 'business-page:partners'],
      ['Ledger', 'fa-book', 'business-page:ledger']
    ],
    delivery: [
      ['Runs', 'fa-motorcycle', 'delivery:runs'],
      ['Route log', 'fa-route', 'delivery:route'],
      ['Proofs', 'fa-file-signature', 'delivery:proofs'],
      ['Earnings', 'fa-wallet', 'delivery:earnings'],
      ['Profile', 'fa-user-circle', 'profile']
    ]
  };

  const activeMenu = roleMenuMap[role] || roleMenuMap.consumer;

  useEffect(() => {
    const open = () => onOpenMenu?.();
    const close = () => onCloseMenu?.();
    window.addEventListener('cloudkirana-open-menu', open);
    window.addEventListener('cloudkirana-close-menu', close);
    return () => {
      window.removeEventListener('cloudkirana-open-menu', open);
      window.removeEventListener('cloudkirana-close-menu', close);
    };
  }, [onOpenMenu, onCloseMenu]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onCloseMenu?.();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen, onCloseMenu]);

  return <main className={`shell ${dark ? 'dark' : ''}`}>
    <div className={`drawer-backdrop ${menuOpen ? 'show' : ''}`} onClick={onCloseMenu} />
    <aside className={`drawer ${menuOpen ? 'open' : ''}`}>
      <div className="drawer-header">
        <div className="avatar small">{(user?.displayName || 'CK').charAt(0).toUpperCase()}</div>
        <div>
          <strong>{user?.displayName || 'Cloud Kirana Member'}</strong>
          <small>{role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Customer'}</small>
        </div>
        <button className="drawer-close" type="button" onClick={onCloseMenu} aria-label="Close menu">{icon('fa-xmark')}</button>
      </div>

      <div className="drawer-section">
        {activeMenu.map(([label, iconName, targetScreen]) => (
          <button key={label} className="drawer-item" onClick={() => { onCloseMenu?.(); navigate(targetScreen); }}>
            {icon(iconName)} {label}
          </button>
        ))}
      </div>

      <div className="drawer-section">
        <div className="drawer-label">Switch role</div>
        {roleOptions.map(([key, iconName, label]) => (
          <button key={key} className={`drawer-item ${role === key ? 'active' : ''}`} onClick={() => onChooseRole(key)}>
            {icon(iconName)} {label}
          </button>
        ))}
      </div>

      <div className="drawer-footer">
        {user?.isAnonymous ? <button className="btn primary full" onClick={onGoogleLogin}>Continue with Google</button> : <button className="btn soft full" onClick={onLogout}>Sign out</button>}
      </div>
    </aside>

    {children}
    {toast && <div className="toast">{icon('fa-circle-check')} {toast}</div>}
  </main>;
}

export function Header({ title, back, go, dark, setDark, actions = true, onMenuClick }) {
  const openMenu = () => {
    if (onMenuClick) {
      onMenuClick();
      return;
    }
    window.dispatchEvent(new CustomEvent('cloudkirana-open-menu'));
  };

  return <header className="top">
    <div className="top-left">
      <button className="icon-btn" onClick={openMenu}>{icon('fa-bars')}</button>
      {back && <button className="back" onClick={() => go(back || 'roles')}>{icon('fa-arrow-left')}</button>}
    </div>
    <strong>{title}</strong>
    {actions ? <button className="icon-btn" onClick={() => setDark?.(!dark)}>{icon('fa-circle-half-stroke')}</button> : <span className="header-space" />}
  </header>;
}

export function Nav({ screen, go, count }) {
  const activeScreen = screen === 'store' ? 'home' : screen === 'checkout' ? 'cart' : screen === 'confirmation' ? 'orders' : screen;
  return <nav className="nav"><button className={activeScreen === 'home' ? 'active' : ''} onClick={() => go('home')}>{icon('fa-house')}Home</button><button className={activeScreen === 'orders' ? 'active' : ''} onClick={() => go('orders')}>{icon('fa-receipt')}Orders</button><button className={activeScreen === 'wishlist' ? 'active' : ''} onClick={() => go('wishlist')}>{icon('fa-heart')}Saved</button><button className={activeScreen === 'cart' ? 'active' : ''} onClick={() => go('cart')}>{icon('fa-cart-shopping')}Cart {count > 0 && <b className="nav-badge">{count}</b>}</button></nav>;
}
export function Search({ value, onChange, placeholder }) { return <label className="search">{icon('fa-magnifying-glass')}<input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>; }

export function ProfilePage({ user, role, dark, setDark, go, notify, onGoogleLogin, onLogout }) {
  const savedProfile = (() => {
    try {
      return JSON.parse(localStorage.getItem(`cloudKirana:${role || 'consumer'}:profile`) || '{}');
    } catch {
      return {};
    }
  })();

  const roleProfile = {
    consumer: {
      label: 'Customer',
      focus: 'Fast delivery and savings',
      location: 'Sector 62, Noida',
      badge: 'Buyer profile',
      values: ['Same-day convenience', 'Saved stores', 'Flexible delivery windows'],
      relation: '12 trusted vendors'
    },
    manufacturer: {
      label: 'Manufacturer',
      focus: 'Batch traceability and compliance',
      location: savedProfile.location || 'Noida manufacturing plant',
      badge: 'Production identity',
      values: ['Batch safety', 'Quality reports', 'Factory dispatch'],
      relation: '3 active supplier chains'
    },
    wholesaler: {
      label: 'Wholesaler',
      focus: 'Bulk stock planning and demand balancing',
      location: savedProfile.location || 'Noida wholesale hub',
      badge: 'Bulk trading profile',
      values: ['High-volume replenishment', 'Regional routes', 'Retail demand sync'],
      relation: '14 supply partners'
    },
    distributor: {
      label: 'Distributor',
      focus: 'Route coverage and dispatch timing',
      location: savedProfile.location || 'Noida distribution hub',
      badge: 'Distribution identity',
      values: ['Coverage planning', 'Proof-of-delivery', 'Retail handoff'],
      relation: '18 retail accounts'
    },
    retailer: {
      label: 'Shopkeeper',
      focus: 'Store health and customer fulfillment',
      location: savedProfile.location || 'Sector 62, Noida',
      badge: 'Retail operating profile',
      values: ['Shelf replenishment', 'Order queue', 'Customer trust'],
      relation: '6 dependable suppliers'
    },
    delivery: {
      label: 'Delivery partner',
      focus: 'Assigned route updates and proofs',
      location: savedProfile.location || 'Sector 62, Noida',
      badge: 'Fleet identity',
      values: ['On-time handoff', 'Proof logs', 'Route updates'],
      relation: '24 active runs this week'
    }
  };

  const profile = {
    name: savedProfile.name || user?.displayName || 'Cloud Kirana Member',
    roleLabel: roleProfile[role]?.label || 'Customer',
    location: savedProfile.location || roleProfile[role]?.location || 'Sector 62, Noida',
    status: user ? 'Verified account' : 'Guest access',
    focus: savedProfile.focus || roleProfile[role]?.focus || 'Fast delivery and savings',
    badge: roleProfile[role]?.badge || 'Buyer profile',
    values: roleProfile[role]?.values || ['Saved stores', 'Smart delivery', 'Personalized suggestions'],
    relation: roleProfile[role]?.relation || '12 trusted vendors',
    currentMode: dark ? 'Dark mode' : 'Light mode'
  };

  const saveProfile = () => notify('Profile saved successfully');

  return <>
    <Header title="My profile" back="home" go={go} dark={dark} setDark={setDark} />
    <div className="scroll content profile-page">
      <div className="profile-hero card">
        <div className="avatar large">{profile.name.charAt(0).toUpperCase()}</div>
        <div>
          <span className="role-pill">{profile.badge}</span>
          <h2>{profile.name}</h2>
          <small>{profile.location}</small>
        </div>
      </div>

      <div className="card profile-grid">
        <div>
          <label>Business identity</label>
          <strong>{profile.roleLabel}</strong>
        </div>
        <div>
          <label>Account status</label>
          <strong>{profile.status}</strong>
        </div>
        <div>
          <label>Daily focus</label>
          <strong>{profile.focus}</strong>
        </div>
        <div>
          <label>Current mode</label>
          <strong>{profile.currentMode}</strong>
        </div>
      </div>

      <div className="card">
        <div className="section-title">
          <h2>Personal priorities</h2>
          <span className="seal">Role match</span>
        </div>
        <div className="profile-tag-list">
          {profile.values.map((value) => <span key={value} className="role-pill soft">{value}</span>)}
        </div>
      </div>

      <div className="card profile-grid">
        <div>
          <label>Trading network</label>
          <strong>{profile.relation}</strong>
        </div>
        <div>
          <label>Saved workspace</label>
          <strong>{savedProfile.focus || profile.focus}</strong>
        </div>
      </div>

      <div className="card profile-actions">
        <button className="btn primary full" onClick={saveProfile}>Save preferences</button>
        {user?.isAnonymous ? <button className="btn soft full" onClick={onGoogleLogin}>Connect Google</button> : <button className="btn soft full" onClick={onLogout}>Sign out</button>}
      </div>

      <PersonalizedWorkspace role={role || 'consumer'} user={user} notify={notify} />
    </div>
  </>;
}
