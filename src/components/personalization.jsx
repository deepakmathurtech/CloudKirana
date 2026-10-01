import { useEffect, useState } from 'react';
import { Button } from './ui';

const defaults = {
  manufacturer: {
    name: 'Aarav Foods Pvt Ltd',
    location: 'Noida manufacturing plant',
    focus: 'Batch registration',
    capacity: '8,000 units/day',
    quality: '98% pass rate',
    channel: 'B2B wholesale',
    alerts: true
  },
  wholesaler: {
    name: 'Noida Bulk Traders',
    location: 'Noida wholesale hub',
    focus: 'Inbound stock',
    capacity: '32 tons',
    quality: '91% fill rate',
    channel: 'Regional retail network',
    alerts: true
  },
  distributor: {
    name: 'Noida Distribution Network',
    location: 'Noida distribution hub',
    focus: 'Route planning',
    capacity: '18 routes',
    quality: '3.1h avg delivery',
    channel: 'Store coverage',
    alerts: true
  },
  retailer: {
    name: 'Sharma General Store',
    location: 'Sector 62, Noida',
    focus: 'Customer orders',
    capacity: '91 SKUs live',
    quality: '4.8/5 customer rating',
    channel: 'Local neighborhood sales',
    alerts: true
  },
  delivery: {
    name: 'Delivery partner',
    location: 'Sector 62, Noida',
    focus: 'Assigned deliveries',
    capacity: '12 runs today',
    quality: '98% on-time',
    channel: 'Final-mile handoff',
    alerts: true
  },
  consumer: {
    name: 'Customer',
    location: 'Sector 62, Noida',
    focus: 'Fast delivery',
    capacity: '3 delivery windows',
    quality: 'Same-day convenience',
    channel: 'Home delivery & pickup',
    alerts: true
  }
};

const roleConfig = {
  manufacturer: {
    heading: 'Production workspace',
    accent: '#153a2c',
    summary: [
      { label: 'Capacity', key: 'capacity' },
      { label: 'Quality', key: 'quality' },
      { label: 'Channel', key: 'channel' }
    ],
    fields: [
      { name: 'name', label: 'Business name', type: 'text' },
      { name: 'location', label: 'Plant location', type: 'text' },
      { name: 'capacity', label: 'Daily capacity', type: 'text' },
      { name: 'quality', label: 'Quality target', type: 'text' },
      { name: 'focus', label: 'Daily focus', type: 'select', options: ['Batch registration', 'Quality review', 'Dispatch readiness', 'Supplier reconciliation'] }
    ]
  },
  wholesaler: {
    heading: 'Bulk trading workspace',
    accent: '#2a6349',
    summary: [
      { label: 'Storage', key: 'capacity' },
      { label: 'Service', key: 'quality' },
      { label: 'Reach', key: 'channel' }
    ],
    fields: [
      { name: 'name', label: 'Wholesale name', type: 'text' },
      { name: 'location', label: 'Warehouse', type: 'text' },
      { name: 'capacity', label: 'Inventory load', type: 'text' },
      { name: 'quality', label: 'Fill rate goal', type: 'text' },
      { name: 'focus', label: 'Daily focus', type: 'select', options: ['Inbound stock', 'Supplier reviews', 'Transfer planning', 'Retail demand mapping'] }
    ]
  },
  distributor: {
    heading: 'Route coordination workspace',
    accent: '#be4f2e',
    summary: [
      { label: 'Routes', key: 'capacity' },
      { label: 'Speed', key: 'quality' },
      { label: 'Coverage', key: 'channel' }
    ],
    fields: [
      { name: 'name', label: 'Network name', type: 'text' },
      { name: 'location', label: 'Distribution hub', type: 'text' },
      { name: 'capacity', label: 'Active routes', type: 'text' },
      { name: 'quality', label: 'Delivery target', type: 'text' },
      { name: 'focus', label: 'Day priority', type: 'select', options: ['Route planning', 'Dispatch updates', 'Retail proofs', 'Vehicle allocation'] }
    ]
  },
  retailer: {
    heading: 'Store operations workspace',
    accent: '#e8a33d',
    summary: [
      { label: 'Stock', key: 'capacity' },
      { label: 'Experience', key: 'quality' },
      { label: 'Customer mix', key: 'channel' }
    ],
    fields: [
      { name: 'name', label: 'Store name', type: 'text' },
      { name: 'location', label: 'Marketplace', type: 'text' },
      { name: 'capacity', label: 'Live products', type: 'text' },
      { name: 'quality', label: 'Customer signal', type: 'text' },
      { name: 'focus', label: 'Daily focus', type: 'select', options: ['Customer orders', 'Restock planning', 'Shelf recovery', 'Offer push'] }
    ]
  },
  delivery: {
    heading: 'Delivery execution workspace',
    accent: '#153a2c',
    summary: [
      { label: 'Runs', key: 'capacity' },
      { label: 'Punctuality', key: 'quality' },
      { label: 'Mode', key: 'channel' }
    ],
    fields: [
      { name: 'name', label: 'Partner name', type: 'text' },
      { name: 'location', label: 'Service zone', type: 'text' },
      { name: 'capacity', label: 'Today’s delivery count', type: 'text' },
      { name: 'quality', label: 'Performance target', type: 'text' },
      { name: 'focus', label: 'Delivery focus', type: 'select', options: ['Assigned deliveries', 'Proof collection', 'Route handoff', 'Return tracking'] }
    ]
  },
  consumer: {
    heading: 'Personal shopping workspace',
    accent: '#2a6349',
    summary: [
      { label: 'Windows', key: 'capacity' },
      { label: 'Comfort', key: 'quality' },
      { label: 'Mode', key: 'channel' }
    ],
    fields: [
      { name: 'name', label: 'Display name', type: 'text' },
      { name: 'location', label: 'Delivery zone', type: 'text' },
      { name: 'capacity', label: 'Preferred windows', type: 'text' },
      { name: 'quality', label: 'Preferred experience', type: 'text' },
      { name: 'focus', label: 'Shopping focus', type: 'select', options: ['Fast delivery', 'Pickup today', 'Bulk order', 'New arrivals'] }
    ]
  }
};

export function PersonalizedWorkspace({ role, user, notify }) {
  const key = `cloudKirana:${role}:profile`;
  const config = roleConfig[role] || roleConfig.consumer;

  const [profile, setProfile] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      return { ...defaults[role], ...saved };
    } catch {
      return defaults[role];
    }
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfile((current) => ({ ...defaults[role], ...current }));
  }, [role]);

  const update = (event) => setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));

  const save = (event) => {
    event.preventDefault();
    localStorage.setItem(key, JSON.stringify(profile));
    setSaved(true);
    notify('Your workspace preferences were saved');
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <form
      className="card personal-card"
      onSubmit={save}
      style={{
        border: `1px solid ${config.accent}18`,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(239,245,232,0.95))',
        boxShadow: '0 8px 18px rgba(21,58,44,0.08)'
      }}
    >
      <div className="section-title">
        <div>
          <h2>{config.heading}</h2>
          <small>Personalized for {user?.displayName || profile.name}</small>
        </div>
        <span className="seal" style={{ background: config.accent, color: '#fff' }}>{saved ? 'Saved' : 'Private'}</span>
      </div>

      <div className="profile-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', marginBottom: '12px' }}>
        {config.summary.map((item) => (
          <div key={item.label} className="profile-mini" style={{ background: 'rgba(21,58,44,0.04)', borderRadius: '12px', padding: '10px 8px', display: 'grid', gap: '4px' }}>
            <small style={{ color: '#6e7a67', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</small>
            <strong style={{ fontSize: '13px', color: '#153a2c' }}>{profile[item.key] || '—'}</strong>
          </div>
        ))}
      </div>

      <div className="form-grid">
        {config.fields.map((field) => (
          <label key={field.name}>
            {field.label}
            {field.type === 'select' ? (
              <select name={field.name} value={profile[field.name] || field.options[0]} onChange={update}>
                {field.options.map((option) => <option value={option} key={option}>{option}</option>)}
              </select>
            ) : (
              <input name={field.name} value={profile[field.name] || ''} onChange={update} />
            )}
          </label>
        ))}
      </div>

      <label className="preference-check">
        <input
          type="checkbox"
          checked={profile.alerts !== false}
          onChange={(event) => setProfile((current) => ({ ...current, alerts: event.target.checked }))}
        />
        Send me chain handoff alerts
      </label>

      <Button className="primary full">Save preferences</Button>
    </form>
  );
}
