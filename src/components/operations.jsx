import { useEffect, useState } from 'react';
import { roles } from '../data';
import { backendRequest } from '../lib/cloudData';
import { Header } from './layout';
import { Button, icon } from './ui';
import { SupplyChainPanel } from './supplyChain';
import { PersonalizedWorkspace } from './personalization';
import { BusinessLedger } from './businessLedger';

const roleBlueprint = {
  manufacturer: {
    accent: '#153a2c',
    soft: 'rgba(21,58,44,0.12)',
    glow: 'linear-gradient(135deg, #153a2c 0%, #2a6349 100%)',
    label: 'Maker ledger',
    headline: 'Production and batch control',
    description: 'Track every lot, verify expiry, and push compliance-ready handoff events from production to wholesale.',
    stats: [
      ['128', 'Active SKUs'],
      ['42', 'Live batches'],
      ['96%', 'Compliance'],
      ['₹4.8L', 'Output this week']
    ],
    actions: [
      { icon: 'fa-boxes-stacked', title: 'Register product', caption: 'Create a verified product card before batch issuance.', cta: 'Add SKU', tab: 'register' },
      { icon: 'fa-barcode', title: 'Trace batch', caption: 'Review origin, movement, and expiry proof.', cta: 'Open trace', tab: 'trace' },
      { icon: 'fa-clipboard-check', title: 'Compliance review', caption: 'Check quality, expiry, and distributor readiness.', cta: 'Review', tab: 'ledger' }
    ],
    featureGroups: [
      {
        title: 'Production',
        items: [
          { icon: 'fa-boxes-stacked', label: 'Register product', tab: 'register' },
          { icon: 'fa-barcode', label: 'Trace batch', tab: 'trace' },
          { icon: 'fa-clipboard-check', label: 'Quality check', tab: 'ledger' }
        ]
      },
      {
        title: 'Inventory flow',
        items: [
          { icon: 'fa-truck-fast', label: 'Dispatch plan', tab: 'transfers' },
          { icon: 'fa-boxes-stacked', label: 'Inventory', tab: 'inventory' },
          { icon: 'fa-chart-line', label: 'Overview', tab: 'overview' }
        ]
      },
      {
        title: 'Business controls',
        items: [
          { icon: 'fa-book', label: 'Accounts', tab: 'ledger' },
          { icon: 'fa-user-gear', label: 'Workspace', tab: 'profile' }
        ]
      }
    ],
    timeline: [
      'Batch AMU-9012 completed and verified',
      '2 distributor transfers approved',
      'Retail readiness check passed for staples'
    ]
  },
  wholesaler: {
    accent: '#2a6349',
    soft: 'rgba(42,99,73,0.12)',
    glow: 'linear-gradient(135deg, #2a6349 0%, #153a2c 100%)',
    label: 'Distribution ledger',
    headline: 'Bulk movement and availability',
    description: 'Hold inventory, process supplier demand, and route verified stock across your distributor network.',
    stats: [
      ['12', 'Suppliers'],
      ['84', 'Orders pending'],
      ['91%', 'Fill rate'],
      ['₹9.2L', 'Inventory value']
    ],
    actions: [
      { icon: 'fa-warehouse', title: 'Inventory check', caption: 'Monitor bulk stock and fast-moving categories.', cta: 'View stock', tab: 'inventory' },
      { icon: 'fa-inbox', title: 'Request queue', caption: 'Accept or hold purchase requests from retailers.', cta: 'Review requests', tab: 'requests' },
      { icon: 'fa-truck-fast', title: 'Dispatch planner', caption: 'Prepare transfer packages for the next route.', cta: 'Plan dispatch', tab: 'transfers' }
    ],
    featureGroups: [
      {
        title: 'Stock operations',
        items: [
          { icon: 'fa-warehouse', label: 'Inventory check', tab: 'inventory' },
          { icon: 'fa-boxes-stacked', label: 'Stock levels', tab: 'overview' },
          { icon: 'fa-inbox', label: 'Request queue', tab: 'requests' }
        ]
      },
      {
        title: 'Movement',
        items: [
          { icon: 'fa-truck-fast', label: 'Transfer plan', tab: 'transfers' },
          { icon: 'fa-route', label: 'Dispatch route', tab: 'overview' }
        ]
      },
      {
        title: 'Business',
        items: [
          { icon: 'fa-book', label: 'Ledger', tab: 'ledger' },
          { icon: 'fa-user-gear', label: 'Workspace', tab: 'profile' }
        ]
      }
    ],
    timeline: [
      'Wholesaler request from Sharma General Store accepted',
      'Bulk rice stock replenishment scheduled',
      '2 distributors assigned for final-mile pickup'
    ]
  },
  distributor: {
    accent: '#d78b2a',
    soft: 'rgba(232,163,61,0.15)',
    glow: 'linear-gradient(135deg, #d78b2a 0%, #b96d1a 100%)',
    label: 'Route ledger',
    headline: 'Direct-to-store supply orchestration',
    description: 'Coordinate transfer timing, retailer coverage, and final-mile verification from one operations cockpit.',
    stats: [
      ['18', 'Routes'],
      ['46', 'Retailers served'],
      ['3.1h', 'Avg delivery'],
      ['₹6.4L', 'Dispatch value']
    ],
    actions: [
      { icon: 'fa-map-location-dot', title: 'Route plan', caption: 'Optimize stops for retailers and delivery timing.', cta: 'Adjust route', tab: 'overview' },
      { icon: 'fa-truck-ramp-box', title: 'Transfer dispatch', caption: 'Release packed stock to each connected store.', cta: 'Dispatch stock', tab: 'transfers' },
      { icon: 'fa-stamp', title: 'Proof review', caption: 'Confirm handoff and document route completion.', cta: 'Verify', tab: 'verify' }
    ],
    featureGroups: [
      {
        title: 'Route planning',
        items: [
          { icon: 'fa-map-location-dot', label: 'Routes', tab: 'overview' },
          { icon: 'fa-truck-ramp-box', label: 'Dispatch', tab: 'transfers' },
          { icon: 'fa-stamp', label: 'Proofs', tab: 'verify' }
        ]
      },
      {
        title: 'Retail coverage',
        items: [
          { icon: 'fa-store', label: 'Retailers', tab: 'overview' },
          { icon: 'fa-receipt', label: 'Orders', tab: 'orders' },
          { icon: 'fa-user-gear', label: 'Profile', tab: 'profile' }
        ]
      },
      {
        title: 'Accounts',
        items: [
          { icon: 'fa-book', label: 'Ledger', tab: 'ledger' }
        ]
      }
    ],
    timeline: [
      'Route 7 is 12 mins ahead of plan',
      'Retailer handoff verified for 18 orders',
      'Delivery window for Sector 62 is stable'
    ]
  },
  retailer: {
    accent: '#be4f2e',
    soft: 'rgba(190,79,46,0.12)',
    glow: 'linear-gradient(135deg, #be4f2e 0%, #e08d3d 100%)',
    label: 'Store ledger',
    headline: 'Daily retail operations',
    description: 'Replenish shelves, approve orders, and monitor customer fulfillment from one local storefront command center.',
    stats: [
      ['91', 'Products in stock'],
      ['24', 'Open orders'],
      ['4.8/5', 'Customer rating'],
      ['₹2.7L', 'Monthly sales']
    ],
    actions: [
      { icon: 'fa-cart-plus', title: 'Restock request', caption: 'Place or review purchase requests with wholesalers.', cta: 'Restock', tab: 'procure' },
      { icon: 'fa-receipt', title: 'Customer orders', caption: 'Monitor live customer demand and order priority.', cta: 'View queue', tab: 'orders' },
      { icon: 'fa-store', title: 'Shelf health', caption: 'Track inventory and stockouts across top products.', cta: 'Check shelves', tab: 'inventory' }
    ],
    featureGroups: [
      {
        title: 'Sales & customers',
        items: [
          { icon: 'fa-receipt', label: 'Customer orders', tab: 'orders' },
          { icon: 'fa-cart-plus', label: 'Restock', tab: 'procure' },
          { icon: 'fa-users', label: 'Customer queries', tab: 'overview' }
        ]
      },
      {
        title: 'Store operations',
        items: [
          { icon: 'fa-boxes-stacked', label: 'Stock', tab: 'inventory' },
          { icon: 'fa-store', label: 'Shelf check', tab: 'inventory' },
          { icon: 'fa-truck-fast', label: 'Dispatch', tab: 'transfers' }
        ]
      },
      {
        title: 'Business',
        items: [
          { icon: 'fa-book', label: 'Ledger', tab: 'ledger' },
          { icon: 'fa-user-gear', label: 'Workspace', tab: 'profile' }
        ]
      }
    ],
    timeline: [
      'Rice and atta restock approval queued',
      '3 customer orders ready for pickup',
      'Shelf stock below threshold for bakery items'
    ]
  }
};

function RoleFlow({ role, config, notify, onQuickAction }) {
  const blue = roleBlueprint[role] || roleBlueprint.retailer;
  const theme = {
    '--role-accent': blue.accent,
    '--role-soft': blue.soft,
    '--role-glow': blue.glow
  };

  const roleStatus = {
    manufacturer: 'Production floor online',
    wholesaler: 'Bulk network active',
    distributor: 'Route coverage synced',
    retailer: 'Store operations live',
    delivery: 'Delivery fleet active'
  };

  return <div className={`role-dashboard role-${role}`} style={theme}>
    <div className="dashboard-hero" style={{ background: blue.glow }}>
      <div className="hero-copy">
        <div className="hero-metadata">
          <span className="eyebrow">{config[1]}</span>
          <span className="live-badge"><span className="live-dot" />{roleStatus[role] || 'Operations live'}</span>
        </div>
        <h1>{blue.headline}</h1>
        <p>{blue.description}</p>
      </div>
      <div className="screen-preview">
        <div className="preview-header"><span className="dot green" /><span className="dot amber" /><span className="dot red" /></div>
        <div className="preview-body">
          <div className="preview-row">
            <span className="preview-pill">{blue.label}</span>
            <span className="preview-pill muted">Live</span>
          </div>
          <div className="preview-graph"><span style={{ height: '30%' }} /><span style={{ height: '52%' }} /><span style={{ height: '41%' }} /><span style={{ height: '74%' }} /><span style={{ height: '90%' }} /><span style={{ height: '68%' }} /></div>
          <div className="preview-list"><span /><span /><span /></div>
        </div>
      </div>
    </div>

    <div className="role-snapshot">
      <div className="snapshot-card"><span>Priority</span><strong>{role === 'manufacturer' ? 'Batch compliance' : role === 'wholesaler' ? 'Stock balance' : role === 'distributor' ? 'Route efficiency' : role === 'delivery' ? 'On-time handoff' : 'Customer fulfillment'}</strong></div>
      <div className="snapshot-card"><span>Today</span><strong>{role === 'manufacturer' ? '12 dispatches' : role === 'wholesaler' ? '8 requests' : role === 'distributor' ? '18 retailers' : role === 'delivery' ? '14 runs' : '24 orders'}</strong></div>
      <div className="snapshot-card"><span>Alerts</span><strong>{role === 'manufacturer' ? '2 checks' : role === 'wholesaler' ? '3 pending' : role === 'distributor' ? '1 route' : role === 'delivery' ? '2 updates' : '5 follow-ups'}</strong></div>
    </div>

    <div className="dashboard-grid">
      {blue.stats.map(([value, label]) => <div className="quick-stat" key={label}><strong>{value}</strong><small>{label}</small></div>)}
    </div>

    <div className="quick-access-strip">
      <span className="quick-access-title">Quick access</span>
      <div className="quick-access-actions">
        {blue.actions.map((action) => (
          <button key={action.title} className="quick-access-btn" onClick={() => onQuickAction?.(action.tab)}>
            <i className={`fa-solid ${action.icon}`} />
            <span>{action.cta}</span>
          </button>
        ))}
      </div>
    </div>

    <div className="feature-classification">
      {blue.featureGroups?.map((group) => (
        <div className="feature-group card" key={group.title}>
          <div className="feature-group-header">
            <h3>{group.title}</h3>
            <span>{group.items.length}</span>
          </div>
          <div className="feature-group-list">
            {group.items.map((item) => (
              <button key={`${group.title}-${item.label}`} className="feature-item" onClick={() => onQuickAction?.(item.tab)}>
                <i className={`fa-solid ${item.icon}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>

    <div className="role-flow-grid">
      {blue.actions.map((action) => <button className="role-action-card" key={action.title} onClick={() => onQuickAction?.(action.tab) ?? notify(`${action.title} flow opened`)}>
        <span className="action-icon"><i className={`fa-solid ${action.icon}`} /></span>
        <div>
          <strong>{action.title}</strong>
          <small>{action.caption}</small>
        </div>
        <span className="action-cta">{action.cta}</span>
      </button>)}
    </div>

    <div className="timeline-card card">
      <div className="section-title"><h2>Latest flow updates</h2><span className="seal">Now</span></div>
      <ul className="timeline-list">
        {blue.timeline.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  </div>;
}

export function Business({ role, products, go, notify, user, tab: selectedTab, setTab: setSelectedTab }) {
  const config = roles[role];
  const [localTab, setLocalTab] = useState('overview');
  const tab = selectedTab ?? localTab;
  const setTab = setSelectedTab ?? setLocalTab;

  return <><Header title={config[0]} go={go} /><div className="scroll content"><RoleFlow role={role} config={config} notify={notify} onQuickAction={setTab} /><SupplyChainPanel role={role} products={products} notify={notify} user={user} tab={tab} setTab={setTab} /></div></>;
}

const businessPageTitles = { inventory: 'Inventory', trace: 'Batch trace', transfers: 'Transfers', ledger: 'Business ledger', partners: 'Trading partners', requests: 'Purchase requests', verify: 'Verification', orders: 'Customer orders', procure: 'Restock', profile: 'Workspace' };

export function BusinessPage({ role, products, go, notify, user, tab, setTab }) {
  return <><Header title={businessPageTitles[tab] || 'Business workspace'} back="business" go={go} /><div className="scroll content">{tab === 'partners' ? <BusinessLedger role={role} notify={notify} initialTab="relationships" /> : <SupplyChainPanel role={role} products={products} notify={notify} user={user} tab={tab} setTab={setTab} />}</div></>;
}

export function Delivery({ go, notify, user, section = 'runs' }) {
  const [partners, setPartners] = useState([]);
  const [partnerId, setPartnerId] = useState('');
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { backendRequest('/api/delivery-partners').then((items) => { setPartners(items); if (items[0]) setPartnerId(String(items[0].id)); }).catch(() => notify('Could not load delivery partners')); }, []);
  useEffect(() => { if (!partnerId) return; backendRequest(`/api/orders/delivery/${partnerId}`).then(setOrders).catch(() => notify('Could not load assigned deliveries')); }, [partnerId]);
  const currentOrder = orders.find((order) => !['Delivered', 'Cancelled'].includes(order.status)) || orders[0];
  useEffect(() => {
    const target = section === 'earnings'
      ? document.querySelector('.business-ledger')
      : section === 'proofs'
        ? [...document.querySelectorAll('.scroll.content h2')].find((heading) => heading.textContent === 'Custody proof')
        : section === 'route'
          ? [...document.querySelectorAll('.scroll.content h2')].find((heading) => heading.textContent === 'Assigned run')
          : document.querySelector('.delivery-hero');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [section]);
  const update = async (next) => { if (!currentOrder) return notify('No assigned delivery yet'); setBusy(true); try { const updated = await backendRequest(`/api/orders/${currentOrder.code}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) }); setOrders((items) => items.map((item) => item.code === updated.code ? updated : item)); notify(`${currentOrder.code} marked ${next.toLowerCase()}`); } catch (error) { notify(error.message); } finally { setBusy(false); } };
  return <><Header title="Delivery partner" go={go} /><div className="scroll content"><div className="role-dashboard"><div className="dashboard-hero delivery-hero"><div className="hero-copy"><span className="eyebrow">Fleet operations</span><h1>Route execution and proof of delivery</h1><p>Track pickup, delivery routes, and handoff logs with a clean mobile-first operations view for your entire delivery circle.</p></div><div className="screen-preview"><div className="preview-header"><span className="dot green" /><span className="dot amber" /><span className="dot red" /></div><div className="preview-body delivery-preview"><div className="route-row"><span className="route-title">Today</span><span className="preview-pill muted">4.9★</span></div><div className="route-box"><div className="route-dot" /><div><strong>Sector 62 to Greenview</strong><small>12 min away</small></div></div><div className="route-box"><div className="route-dot amber" /><div><strong>Central market</strong><small>3 stops left</small></div></div></div></div></div><div className="dashboard-grid"><div className="quick-stat"><strong>₹612</strong><small>Today's earnings</small></div><div className="quick-stat"><strong>{orders.length}</strong><small>Assigned runs</small></div><div className="quick-stat"><strong>98%</strong><small>On-time rate</small></div><div className="quick-stat"><strong>14</strong><small>Orders fulfilled</small></div></div><BusinessLedger role="delivery" notify={notify} /><PersonalizedWorkspace role="delivery" user={user} notify={notify} /><h2 className="subheading">Choose delivery profile</h2><div className="card"><select className="inline-input" value={partnerId} onChange={(event) => setPartnerId(event.target.value)}><option value="">Select partner</option>{partners.map((partner) => <option value={partner.id} key={partner.id}>{partner.name} · {partner.vehicle}</option>)}</select></div><h2 className="subheading">Assigned run</h2>{!currentOrder ? <div className="card empty">{icon('fa-motorcycle')}<span>No assigned customer deliveries</span></div> : <div className="card list"><div className="line">{icon('fa-store')}<div className="grow"><b>Pickup — {currentOrder.storeName}</b><small>{currentOrder.code} · {currentOrder.items.length} items</small></div><span className="seal">{currentOrder.status}</span></div><div className="line">{icon('fa-location-dot')}<div className="grow"><b>Drop — customer address</b><small>Greenview Heights · assigned by shopkeeper</small></div></div><div className="button-row"><Button disabled={busy} onClick={() => update('Picked up')}>Picked up</Button><Button disabled={busy} className="primary" onClick={() => update('Delivered')}>Complete</Button></div></div>}<div className="card ledger-summary"><h2>Custody proof</h2><p>Pickup and delivery statuses are connected to the shopkeeper order and customer history.</p><Button onClick={() => notify('Delivery receipt ready')}>View receipt</Button></div></div></div></>;
}
