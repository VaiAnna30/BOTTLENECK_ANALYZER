import React, { useState, useCallback } from 'react';
import ReactFlow, { 
  Controls, 
  Background, 
  applyNodeChanges, 
  applyEdgeChanges,
  addEdge 
} from 'reactflow';
import axios from 'axios';
import 'reactflow/dist/style.css';

const initialNodes = [
  { id: '0', position: { x: 50, y: 200 }, data: { label: 'Source (0)' }, type: 'input' },
  { id: '1', position: { x: 650, y: 200 }, data: { label: 'Sink (1)' }, type: 'output' },
];

export default function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState([]);
  const [maxFlow, setMaxFlow] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [nextNodeId, setNextNodeId] = useState(2);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  const onConnect = useCallback((connection) => {
    const newEdgeId = `e${connection.source}-${connection.target}`;

    const defaultEdge = {
      ...connection,
      id: newEdgeId,
      label: `10 Gbps`,
      animated: true,
      style: { stroke: '#b1b1b7', strokeWidth: 2 }, 
      labelStyle: { fill: '#333', fontWeight: 600 }
    };

    setEdges((eds) => addEdge(defaultEdge, eds));

    setTimeout(() => {
      const capacityInput = window.prompt("Enter bandwidth capacity for this link (e.g. 10):", "10");
      
      if (capacityInput && !isNaN(capacityInput)) {
        setEdges((currentEdges) => 
          currentEdges.map((edge) => 
            edge.id === newEdgeId ? { ...edge, label: `${capacityInput} Gbps` } : edge
          )
        );
      }
    }, 50);
  }, [setEdges]);

  const addRouterNode = () => {
    const newNode = {
      id: nextNodeId.toString(),
      position: { x: 350, y: Math.random() * 200 + 100 }, 
      data: { label: `Router ${nextNodeId}` }
    };
    
    setNodes((nds) => [...nds, newNode]);
    setNextNodeId((prevId) => prevId + 1);
  };

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const formattedEdges = edges.map(edge => ({
        u: parseInt(edge.source),
        v: parseInt(edge.target),
        capacity: parseInt(edge.label.split(' ')[0])
      }));

      const sinkNode = nodes.find(n => n.type === 'output');

      const payload = {
        numNodes: nodes.length,
        numEdges: edges.length,
        source: 0,
        sink: parseInt(sinkNode.id),
        edges: formattedEdges
      };

      const response = await axios.post('http://localhost:5000/api/analyze', payload);
      const { max_flow, bottleneck } = response.data;
      
      setMaxFlow(max_flow);

      setEdges((currentEdges) => 
        currentEdges.map((edge) => {
          const isBottleneck = bottleneck.some(
            (b) => b.u === parseInt(edge.source) && b.v === parseInt(edge.target)
          );

          if (isBottleneck) {
            return {
              ...edge,
              animated: false,
              style: { stroke: '#ff0072', strokeWidth: 5 },
              labelStyle: { fill: '#ff0072', fontWeight: 800 }
            };
          } else {
            return {
              ...edge,
              animated: true,
              style: { stroke: '#b1b1b7', strokeWidth: 2 },
              labelStyle: { fill: '#333', fontWeight: 600 }
            };
          }
        })
      );
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Error running simulation. Check backend connection.");
    }
    setLoading(false);
  };

  // --- NEW FEATURE: SAVE TO MONGODB ATLAS ---
  const saveNetwork = async () => {
    const networkName = window.prompt("Enter a name for this network layout:", "US East CDN Config");
    if (!networkName) return;

    setLoading(true);
    try {
      // Structure the data exactly as your Mongoose Schema expects it
      const payload = {
        name: networkName,
        nodes: nodes.map(n => ({
          id: n.id,
          label: n.data.label,
          isSource: n.type === 'input',
          isSink: n.type === 'output',
          xPosition: n.position.x,
          yPosition: n.position.y
        })),
        edges: edges.map(e => ({
          SourceId: e.source,
          TargetId: e.target,
          capacity: parseInt(e.label.split(' ')[0])
        }))
      };

      // Call the new Node.js endpoint
      await axios.post('http://localhost:5000/api/network/save', payload);
      alert("✅ Network saved to MongoDB Atlas successfully!");
    } catch (error) {
      console.error("Save failed:", error);
      alert("❌ Failed to save network to the database.");
    }
    setLoading(false);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ padding: '20px', backgroundColor: '#1e1e1e', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>Network Bottleneck Analyzer</h2>
          <p style={{ margin: '5px 0 0 0', color: '#ccc' }}>Build your topology, set capacities, and analyze the flow.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {maxFlow !== null && (
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4ade80', marginRight: '10px' }}>
              Total Max Flow: {maxFlow} Gbps
            </div>
          )}
          
          <button onClick={addRouterNode} style={btnStyle('#4b5563')}>
            + Add Router
          </button>

          {/* NEW: Database Save Button */}
          <button onClick={saveNetwork} disabled={loading} style={btnStyle('#10b981', loading)}>
            💾 Save Network
          </button>

          <button onClick={runAnalysis} disabled={loading} style={btnStyle('#007bff', loading)}>
            {loading ? 'Running...' : 'Run Simulation'}
          </button>
        </div>
      </div>

      <div style={{ flexGrow: 1 }}>
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView>
          <Background color="#ccc" gap={16} />
          <Controls />
        </ReactFlow>
      </div>

    </div>
  );
}

// Helper for button styling
const btnStyle = (bgColor, disabled = false) => ({
  padding: '10px 20px', 
  fontSize: '1rem', 
  backgroundColor: disabled ? '#6c757d' : bgColor,
  color: 'white', 
  border: 'none', 
  borderRadius: '5px',
  cursor: disabled ? 'not-allowed' : 'pointer', 
  fontWeight: 'bold'
});