import React from 'react';
import { Handle, Position } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';

export default function CustomRouterNode({ data, selected }) {
  return (
    <div style={{
      padding: '10px 20px',
      border: '1px solid #30363d',
      borderRadius: '8px',
      background: '#161b22',
      color: '#c9d1d9',
      boxShadow: selected ? '0 0 0 2px #10b981, 0 4px 12px rgba(16, 185, 129, 0.4)' : '0 4px 6px rgba(0,0,0,0.3)',
      textAlign: 'center',
      minWidth: '120px',
      minHeight: '40px',
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <NodeResizer minWidth={120} minHeight={40} isVisible={selected} lineStyle={{ borderColor: '#10b981' }} handleStyle={{ width: 8, height: 8, background: '#10b981', border: '1px solid #161b22' }} />
      {/* Target handle placed in the exact center */}
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          width: '12px',
          height: '12px',
          backgroundColor: '#10b981',
          border: '2px solid #0d1117',
          zIndex: 1
        }} 
      />
      {/* Source handle placed in the exact center, slightly offset or transparent if we want them to look like one */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          width: '12px',
          height: '12px',
          backgroundColor: '#10b981',
          border: '2px solid #0d1117',
          zIndex: 2,
          opacity: 0 // Hide one so it just looks like a single central point
        }} 
      />
      <div style={{ fontWeight: '600' }}>{data.label}</div>
    </div>
  );
}
