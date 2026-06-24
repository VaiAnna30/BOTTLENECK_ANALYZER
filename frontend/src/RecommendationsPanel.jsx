import React from 'react';

export default function RecommendationsPanel({ recommendations, onClose }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 10, background: '#161b22', padding: '16px', borderRadius: '8px', border: '1px solid #30363d', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', width: '300px', maxHeight: '300px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, color: '#c9d1d9', fontSize: '1.1rem' }}>Upgrade Recommendations</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}>&times;</button>
      </div>
      {recommendations.map((rec, i) => (
        <div key={i} style={{ marginBottom: i < recommendations.length - 1 ? '12px' : 0, paddingBottom: i < recommendations.length - 1 ? '12px' : 0, borderBottom: i < recommendations.length - 1 ? '1px solid #30363d' : 'none' }}>
          <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px', fontSize: '0.95rem' }}>Edge: Node {rec.source} → Node {rec.target}</div>
          <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Current: {rec.current} Gbps | <span style={{ color: '#10b981' }}>Upgrade to: {rec.recommended} Gbps</span></div>
          <div style={{ color: '#3b82f6', fontSize: '0.85rem', marginTop: '4px' }}>Expected Impact: +{rec.improvement}% Capacity</div>
        </div>
      ))}
    </div>
  );
}
