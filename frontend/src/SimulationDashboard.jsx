import React from 'react';

export default function SimulationDashboard({ metrics, onClose }) {
  if (!metrics) return null;

  return (
    <div className="glass-panel floating-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem', letterSpacing: '-0.02em' }}>Simulation Dashboard</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem', padding: 0, lineHeight: 1 }}>&times;</button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Avg Utilization:</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.95rem' }}>{metrics.avgUtil}%</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Congested Links:</span>
        <span style={{ color: metrics.congested > 0 ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: '600', fontSize: '0.95rem' }}>{metrics.congested}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Network Health:</span>
        <span style={{ color: metrics.health < 50 ? 'var(--accent-red)' : (metrics.health < 80 ? '#eab308' : 'var(--accent-green)'), fontWeight: '600', fontSize: '0.95rem' }}>{metrics.health}%</span>
      </div>
    </div>
  );
}
