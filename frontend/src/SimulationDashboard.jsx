import React from 'react';

export default function SimulationDashboard({ metrics, onClose }) {
  if (!metrics) return null;

  return (
    <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, background: '#161b22', padding: '16px', borderRadius: '8px', border: '1px solid #30363d', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', width: '250px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, color: '#c9d1d9', fontSize: '1.1rem' }}>Simulation Dashboard</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}>&times;</button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ color: '#8b949e', fontSize: '0.9rem' }}>Avg Utilization:</span>
        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>{metrics.avgUtil}%</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ color: '#8b949e', fontSize: '0.9rem' }}>Congested Links:</span>
        <span style={{ color: metrics.congested > 0 ? '#dc2626' : '#10b981', fontWeight: 'bold', fontSize: '0.9rem' }}>{metrics.congested}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#8b949e', fontSize: '0.9rem' }}>Network Health:</span>
        <span style={{ color: metrics.health < 50 ? '#dc2626' : (metrics.health < 80 ? '#eab308' : '#10b981'), fontWeight: 'bold', fontSize: '0.9rem' }}>{metrics.health}%</span>
      </div>
    </div>
  );
}
