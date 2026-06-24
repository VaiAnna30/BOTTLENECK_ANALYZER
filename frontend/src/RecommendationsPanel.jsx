import React from 'react';

export default function RecommendationsPanel({ recommendations, onClose }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="glass-panel floating-recs">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem', letterSpacing: '-0.02em' }}>Upgrade Recommendations</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem', padding: 0, lineHeight: 1 }}>&times;</button>
      </div>
      {recommendations.map((rec, i) => (
        <div key={i} style={{ marginBottom: i < recommendations.length - 1 ? '16px' : 0, paddingBottom: i < recommendations.length - 1 ? '16px' : 0, borderBottom: i < recommendations.length - 1 ? '1px solid var(--panel-border)' : 'none' }}>
          <div style={{ color: 'var(--text-primary)', fontWeight: '600', marginBottom: '6px', fontSize: '1rem' }}>Edge: {rec.sourceLabel} → {rec.targetLabel}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Current: <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{rec.current} Gbps</span> | <span style={{ color: 'var(--accent-green)', fontWeight: 500 }}>Upgrade to: {rec.recommended} Gbps</span></div>
          <div style={{ color: 'var(--accent-blue)', fontSize: '0.85rem', marginTop: '6px', fontWeight: 500 }}>Expected Impact: +{rec.improvement}% Capacity</div>
        </div>
      ))}
    </div>
  );
}
