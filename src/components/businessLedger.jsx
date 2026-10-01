import { useEffect, useState } from 'react';
import { backendRequest } from '../lib/cloudData';
import { Button, Empty } from './ui';

const names = { manufacturer: 'Aarav Foods Pvt Ltd', wholesaler: 'Noida Bulk Traders', distributor: 'Noida Distribution Network', retailer: 'Sharma General Store', delivery: 'Delivery partner' };
const roleRelationshipHints = {
  manufacturer: { headline: 'Factory supply network', detail: 'Track batch-linked receivables and long-term manufacturing partnerships.' },
  wholesaler: { headline: 'Wholesale buyer network', detail: 'Keep credit terms healthy across fast-moving retail demand.' },
  distributor: { headline: 'Route partner network', detail: 'Monitor partner coverage, proof collection, and recurring order commitments.' },
  retailer: { headline: 'Store supplier network', detail: 'Balance repeat procurement and local cash-flow discipline.' },
  delivery: { headline: 'Fleet and route network', detail: 'Track settlements, payout cycles, and route-linked partner reliability.' }
};

export function BusinessLedger({ role, notify, initialTab = 'accounts' }) {
  const [tab, setTab] = useState(initialTab);
  const [data, setData] = useState({ entries: [], relationships: [], totals: { receivable: 0, payable: 0, paid: 0 } });
  const [form, setForm] = useState({ partnerRole: 'wholesaler', partner: 'Noida Bulk Traders', terms: 'Net 30', creditLimit: '50000' });
  const [entry, setEntry] = useState({ type: 'receivable', amount: '', description: '', counterpartyRole: 'wholesaler', counterparty: 'Noida Bulk Traders', reference: '' });
  const load = async () => { const response = await backendRequest(`/api/accounting?role=${role}`); setData(response); };
  useEffect(() => { load(); }, [role]);
  const change = (setter) => (event) => setter((current) => ({ ...current, [event.target.name]: event.target.value }));
  const addRelationship = async (event) => {
    event.preventDefault();
    try {
      await backendRequest('/api/relationships', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ownerRole: role, owner: names[role], ...form, creditLimit: Number(form.creditLimit || 0) }) });
      await load();
      notify('Trading relationship added');
    } catch {
      notify('Could not create relationship');
    }
  };
  const addEntry = async (event) => {
    event.preventDefault();
    try {
      await backendRequest('/api/accounting/entries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role, owner: names[role], ...entry, amount: Number(entry.amount) }) });
      setEntry({ ...entry, amount: '', description: '', reference: '' });
      await load();
      notify('Accounting entry posted');
    } catch {
      notify('Could not add accounting entry');
    }
  };
  const hint = roleRelationshipHints[role] || roleRelationshipHints.wholesaler;

  return <div className="business-ledger">
    <div className="card ledger-summary">
      <div className="section-title">
        <div>
          <h2>{hint.headline}</h2>
          <small>{hint.detail}</small>
        </div>
        <span className="seal">{role}</span>
      </div>
    </div>
    <div className="business-tabs">
      <button className={tab === 'accounts' ? 'selected' : ''} onClick={() => setTab('accounts')}>Accounts</button>
      <button className={tab === 'relationships' ? 'selected' : ''} onClick={() => setTab('relationships')}>Relationships</button>
      <button className={tab === 'post' ? 'selected' : ''} onClick={() => setTab('post')}>Post entry</button>
    </div>
    {tab === 'accounts' && <Accounts data={data} role={role} />}
    {tab === 'relationships' && <Relationships data={data} form={form} change={change(setForm)} add={addRelationship} />}
    {tab === 'post' && <PostEntry entry={entry} change={change(setEntry)} add={addEntry} />}
  </div>;
}
function Accounts({ data, role }) {
  const roleMetrics = {
    manufacturer: {
      stats: [
        { label: 'Receivables', value: `₹${(data.totals?.receivable || 0).toFixed(2)}`, tone: 'positive' },
        { label: 'Raw cost', value: `₹${(data.totals?.payable || 0).toFixed(2)}`, tone: 'negative' },
        { label: 'Batch value', value: `₹${(data.totals?.paid || 0).toFixed(2)}`, tone: 'neutral' }
      ],
      health: 'Production margin',
      settlement: 'Batch flow'
    },
    wholesaler: {
      stats: [
        { label: 'Open demand', value: `₹${(data.totals?.receivable || 0).toFixed(2)}`, tone: 'positive' },
        { label: 'Supplier dues', value: `₹${(data.totals?.payable || 0).toFixed(2)}`, tone: 'negative' },
        { label: 'Stock settled', value: `₹${(data.totals?.paid || 0).toFixed(2)}`, tone: 'neutral' }
      ],
      health: 'Bulk liquidity',
      settlement: 'Stock turn'
    },
    distributor: {
      stats: [
        { label: 'Route billing', value: `₹${(data.totals?.receivable || 0).toFixed(2)}`, tone: 'positive' },
        { label: 'Fleet costs', value: `₹${(data.totals?.payable || 0).toFixed(2)}`, tone: 'negative' },
        { label: 'Cash in hand', value: `₹${(data.totals?.paid || 0).toFixed(2)}`, tone: 'neutral' }
      ],
      health: 'Route margin',
      settlement: 'Dispatch cycle'
    },
    retailer: {
      stats: [
        { label: 'Store sales', value: `₹${(data.totals?.receivable || 0).toFixed(2)}`, tone: 'positive' },
        { label: 'Supplier bills', value: `₹${(data.totals?.payable || 0).toFixed(2)}`, tone: 'negative' },
        { label: 'Cash settled', value: `₹${(data.totals?.paid || 0).toFixed(2)}`, tone: 'neutral' }
      ],
      health: 'Shop cash flow',
      settlement: 'Shelf turnover'
    },
    delivery: {
      stats: [
        { label: 'Payout receivables', value: `₹${(data.totals?.receivable || 0).toFixed(2)}`, tone: 'positive' },
        { label: 'Fuel & fees', value: `₹${(data.totals?.payable || 0).toFixed(2)}`, tone: 'negative' },
        { label: 'Settlements', value: `₹${(data.totals?.paid || 0).toFixed(2)}`, tone: 'neutral' }
      ],
      health: 'Fleet liquidity',
      settlement: 'Route payout'
    }
  };

  const selectedRole = roleMetrics[role] || roleMetrics.wholesaler;
  const stats = selectedRole.stats;
  const trend = [44, 58, 63, 78, 72, 90, 84];
  const netBalance = (data.totals?.receivable || 0) - (data.totals?.payable || 0);
  const aging = {
    '0-15 days': 18,
    '16-30 days': 26,
    '31-45 days': 12,
    '45+ days': 7
  };

  return <>
    <div className="stats account-stats">
      {stats.map(({ label, value, tone }) => (
        <div className="stat account-stat" key={label}>
          <small>{label}</small>
          <strong className={tone}>{value}</strong>
        </div>
      ))}
    </div>

    <div className="card" style={{ display: 'grid', gap: 12 }}>
      <div className="section-title">
        <div>
          <h2>Net balance</h2>
          <small>Current financial health</small>
        </div>
        <span className="seal">ERP view</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        <div style={{ background: 'rgba(21,58,44,0.04)', borderRadius: 12, padding: 12 }}>
          <small style={{ color: '#6e7a67', display: 'block' }}>Net balance</small>
          <strong style={{ color: '#153a2c', fontSize: 22 }}>₹{netBalance.toFixed(2)}</strong>
        </div>
        <div style={{ background: 'rgba(232,163,61,0.1)', borderRadius: 12, padding: 12 }}>
          <small style={{ color: '#6e7a67', display: 'block' }}>{selectedRole.health}</small>
          <strong style={{ color: '#153a2c', fontSize: 22 }}>{Math.min(98, Math.max(60, 76))}%</strong>
        </div>
      </div>
    </div>

    <div className="card" style={{ display: 'grid', gap: 12 }}>
      <div className="section-title">
        <div>
          <h2>Ageing summary</h2>
          <small>Outstanding cycle review</small>
        </div>
        <span className="seal">Aging</span>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {Object.entries(aging).map(([bucket, value]) => (
          <div key={bucket} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ color: '#6e7a67' }}>{bucket}</span>
            <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'rgba(21,58,44,0.08)', overflow: 'hidden', margin: '0 8px' }}>
              <div style={{ width: `${value}%`, height: '100%', background: 'linear-gradient(90deg, #e8a33d, #153a2c)', borderRadius: 999 }} />
            </div>
            <strong style={{ color: '#153a2c', minWidth: 32, textAlign: 'right' }}>{value}%</strong>
          </div>
        ))}
      </div>
    </div>

    <div className="card" style={{ display: 'grid', gap: 12 }}>
      <div className="section-title">
        <div>
          <h2>{selectedRole.settlement}</h2>
          <small>7-day operating trend</small>
        </div>
        <span className="seal">ERP view</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 92 }}>
        {trend.map((height, index) => (
          <div key={index} style={{ flex: 1, height: `${height}%`, borderRadius: 10, background: index === trend.length - 1 ? 'linear-gradient(180deg, #e8a33d, #153a2c)' : 'linear-gradient(180deg, rgba(21,58,44,0.18), rgba(21,58,44,0.8))' }} />
        ))}
      </div>
    </div>

    <div className="card ledger-list">
      <div className="section-title">
        <h2>Accounting ledger</h2>
        <span className="seal">Double-entry ready</span>
      </div>
      {!data.entries.length ? <Empty iconName="fa-file-invoice-dollar">No entries yet</Empty> : data.entries.map((item) => (
        <div className="line ledger-line" key={item.id}>
          <div className="grow">
            <b>{item.description}</b>
            <small>{item.reference || item.id} · {item.counterparty || 'Internal'}</small>
          </div>
          <div className="ledger-meta">
            <span className="ledger-pill">{item.type}</span>
            <strong className={item.type === 'payable' || item.type === 'payment' ? 'negative' : 'positive'}>₹{Number(item.amount || 0).toFixed(2)}</strong>
          </div>
        </div>
      ))}
    </div>
  </>;
}

function Relationships({ data, form, change, add }) {
  const totalCredit = data.relationships.reduce((sum, item) => sum + (Number(item.creditLimit) || 0), 0);
  const totalOutstanding = data.relationships.reduce((sum, item) => sum + (Number(item.outstanding) || 0), 0);
  const healthyCount = data.relationships.filter((item) => (item.health || 'Healthy') !== 'At risk').length;

  return <>
    <div className="card" style={{ display: 'grid', gap: 12 }}>
      <div className="section-title">
        <div>
          <h2>Trading relationships</h2>
          <small>Healthy network coverage</small>
        </div>
        <span className="seal">Live</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        <div style={{ background: 'rgba(21,58,44,0.04)', borderRadius: 12, padding: 10 }}>
          <small style={{ color: '#6e7a67', display: 'block' }}>Partners</small>
          <strong style={{ fontSize: 18, color: '#153a2c' }}>{data.relationships.length}</strong>
        </div>
        <div style={{ background: 'rgba(232,163,61,0.1)', borderRadius: 12, padding: 10 }}>
          <small style={{ color: '#6e7a67', display: 'block' }}>Credit book</small>
          <strong style={{ fontSize: 18, color: '#153a2c' }}>₹{totalCredit.toFixed(2)}</strong>
        </div>
        <div style={{ background: 'rgba(21,58,44,0.04)', borderRadius: 12, padding: 10 }}>
          <small style={{ color: '#6e7a67', display: 'block' }}>Healthy</small>
          <strong style={{ fontSize: 18, color: '#153a2c' }}>{healthyCount}/{data.relationships.length || 0}</strong>
        </div>
      </div>
    </div>

    <form className="card relationship-form" onSubmit={add}>
      <h2>Long-term trading relationship</h2>
      <p>Save payment terms and credit limits for repeat transfers.</p>
      <div className="form-grid">
        <select name="partnerRole" value={form.partnerRole} onChange={change}>
          <option value="manufacturer">Manufacturer</option>
          <option value="wholesaler">Wholesaler</option>
          <option value="distributor">Distributor</option>
          <option value="retailer">Shopkeeper</option>
        </select>
        <input name="partner" value={form.partner} onChange={change} placeholder="Partner name" required />
      </div>
      <div className="form-grid">
        <select name="terms" value={form.terms} onChange={change}>
          <option>Prepaid</option>
          <option>Net 15</option>
          <option>Net 30</option>
          <option>Net 45</option>
        </select>
        <input name="creditLimit" type="number" value={form.creditLimit} onChange={change} placeholder="Credit limit" />
      </div>
      <Button className="primary full">Save relationship</Button>
    </form>

    <div className="card" style={{ display: 'grid', gap: 12 }}>
      {data.relationships.length ? data.relationships.map((item) => {
        const status = item.health || 'Healthy';
        const risk = Number(item.outstanding || 0) > Number(item.creditLimit || 0) ? 'At risk' : status;
        const statusColor = risk === 'At risk' ? '#9b3a2b' : '#1d6b46';
        const statusBg = risk === 'At risk' ? 'rgba(155,58,43,0.1)' : 'rgba(29,107,70,0.1)';

        return <div key={item.id} style={{ border: '1px solid #e4dcc4', borderRadius: 18, padding: 14, background: 'linear-gradient(180deg, #fff, #faf7f0)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div>
              <b style={{ display: 'block', color: '#153a2c', fontSize: 16 }}>{item.partner}</b>
              <small style={{ color: '#6e7a67' }}>{item.terms} • {item.partnerRole || 'Partner'}</small>
            </div>
            <span style={{ background: statusBg, color: statusColor, borderRadius: 999, padding: '6px 10px', fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' }}>{risk}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            <div style={{ background: 'rgba(21,58,44,0.04)', borderRadius: 10, padding: 8 }}>
              <small style={{ color: '#6e7a67', display: 'block' }}>Limit</small>
              <strong style={{ color: '#153a2c' }}>₹{(item.creditLimit || 0).toFixed(2)}</strong>
            </div>
            <div style={{ background: 'rgba(232,163,61,0.1)', borderRadius: 10, padding: 8 }}>
              <small style={{ color: '#6e7a67', display: 'block' }}>Outstanding</small>
              <strong style={{ color: '#153a2c' }}>₹{(item.outstanding || 0).toFixed(2)}</strong>
            </div>
            <div style={{ background: 'rgba(21,58,44,0.04)', borderRadius: 10, padding: 8 }}>
              <small style={{ color: '#6e7a67', display: 'block' }}>Due</small>
              <strong style={{ color: '#153a2c' }}>{(Number(item.outstanding || 0) > 0 ? 'Pending' : 'Clear')}</strong>
            </div>
          </div>
        </div>;
      }) : <Empty iconName="fa-people-arrows">No relationships yet</Empty>}
    </div>
  </>;
}

function PostEntry({ entry, change, add }) {
  return <form className="card relationship-form" onSubmit={add}>
    <h2>Post accounting entry</h2>
    <p>Record invoices, payables, receivables, and settlements against the chain.</p>
    <div className="form-grid">
      <select name="type" value={entry.type} onChange={change}>
        <option value="receivable">Receivable</option>
        <option value="payable">Payable</option>
        <option value="payment">Payment / settlement</option>
      </select>
      <input name="amount" type="number" value={entry.amount} onChange={change} placeholder="Amount" required />
    </div>
    <input name="description" value={entry.description} onChange={change} placeholder="Description" required />
    <div className="form-grid">
      <input name="counterparty" value={entry.counterparty} onChange={change} placeholder="Counterparty" />
      <input name="reference" value={entry.reference} onChange={change} placeholder="Invoice / transfer reference" />
    </div>
    <Button className="primary full">Post to ledger</Button>
  </form>;
}
