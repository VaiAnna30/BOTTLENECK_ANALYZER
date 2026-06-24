import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { 
  Controls, 
  Background, 
  applyNodeChanges, 
  applyEdgeChanges,
  addEdge 
} from 'reactflow';
import axios from 'axios';
import AuthModal from './AuthModal';
import CustomRouterNode from './CustomRouterNode';
import SimulationDashboard from './SimulationDashboard';
import RecommendationsPanel from './RecommendationsPanel';
import 'reactflow/dist/style.css';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const initialNodes = [
  { id: '0', position: { x: 50, y: 200 }, data: { label: 'Source (0)' }, type: 'input', deletable: false },
  { id: '1', position: { x: 650, y: 200 }, data: { label: 'Sink (1)' }, type: 'output', deletable: false },
];

const nodeTypes = {
  customRouter: CustomRouterNode,
};

export default function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState([]);
  const [maxFlow, setMaxFlow] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [showMetrics, setShowMetrics] = useState(true);
  const [showRecs, setShowRecs] = useState(true);
  const [loading, setLoading] = useState(false);
  const [nextNodeId, setNextNodeId] = useState(2);

  const [savedNetworks, setSavedNetworks] = useState([]);
  const [showLoadMenu, setShowLoadMenu] = useState(false);

  // Auth State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState(localStorage.getItem('username') || null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [pendingSave, setPendingSave] = useState(false);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchSavedNetworks();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setSavedNetworks([]);
    }
  }, [token]);

  const handleLoginSuccess = (username) => {
    setUser(username);
    setToken(localStorage.getItem('token'));
    if (pendingSave) {
      setPendingSave(false);
      executeSave();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
    setToken(null);
    setSavedNetworks([]);
  };

  const fetchSavedNetworks = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/network`);
      setSavedNetworks(response.data);
    } catch (error) {
      console.error("Failed to fetch saved networks:", error);
    }
  };

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  const onConnect = useCallback((connection) => {
    const newEdgeId = `e${connection.source}-${connection.target}`;

    const defaultEdge = {
      ...connection,
      id: newEdgeId,
      label: `10 Gbps`,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#4b5563', strokeWidth: 2 }, 
      labelStyle: { fill: '#c9d1d9', fontWeight: 600 }
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
      type: 'customRouter',
      position: { x: 350, y: Math.random() * 200 + 100 }, 
      data: { label: `Router ${nextNodeId}` }
    };
    
    setNodes((nds) => [...nds, newNode]);
    setNextNodeId((prevId) => prevId + 1);
  };

  const handleSaveClick = () => {
    if (!token) {
      setPendingSave(true);
      setShowAuthModal(true);
    } else {
      executeSave();
    }
  };

  const deleteSelected = () => {
    setNodes((nds) => nds.filter((node) => !node.selected || node.id === '0' || node.id === '1'));
    setEdges((eds) => eds.filter((edge) => !edge.selected));
  };

  const onEdgeDoubleClick = (event, edge) => {
    const newCapacity = window.prompt("Enter new bandwidth capacity (Gbps):", edge.label.split(' ')[0]);
    if (newCapacity && !isNaN(newCapacity)) {
      setEdges((eds) => eds.map((e) => 
        e.id === edge.id ? { ...e, label: `${newCapacity} Gbps` } : e
      ));
    }
  };

  const executeSave = async () => {
    const networkName = window.prompt("Enter a name for this network layout:", "US East CDN Config");
    if (!networkName) return;

    setLoading(true);
    try {
      const payload = {
        name: networkName,
        nodes: nodes,
        edges: edges
      };

      await axios.post(`${API_URL}/api/network/save`, payload);
      alert("Network saved successfully.");
      
      fetchSavedNetworks(); 
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save network configuration.");
    }
    setLoading(false);
  };

  const loadNetwork = async (networkId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/network/${networkId}`);
      const data = response.data;

      setNodes(data.nodes || []);
      
      const cleanEdges = (data.edges || []).map(e => ({
        ...e,
        animated: true,
        style: { stroke: '#4b5563', strokeWidth: 2 },
        labelStyle: { fill: '#c9d1d9', fontWeight: 600 }
      }));
      setEdges(cleanEdges);

      setMaxFlow(null);
      setMetrics(null);
      setRecommendations([]);
      setShowLoadMenu(false);

      const highestId = data.nodes && data.nodes.length > 0 
        ? Math.max(...data.nodes.map(n => parseInt(n.id) || 0)) 
        : 0;
      setNextNodeId(highestId >= 2 ? highestId + 1 : 2);

    } catch (error) {
      console.error("Failed to load network:", error);
      alert("Failed to load network. It may be corrupted or inaccessible.");
    }
    setLoading(false);
  };

  const deleteNetwork = async (networkId, e) => {
    e.stopPropagation(); // Prevent loading the network when clicking delete
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this network?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_URL}/api/network/${networkId}`);
      fetchSavedNetworks(); // Refresh list
    } catch (error) {
      console.error("Failed to delete network:", error);
      alert("Failed to delete network.");
    }
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

      const response = await axios.post(`${API_URL}/api/analyze`, payload);
      const { max_flow, bottleneck, edge_flows } = response.data;
      
      setMaxFlow(max_flow);

      let totalUtil = 0;
      let activeEdgesCount = 0;
      let congestedCount = 0;
      const nextRecommendations = [];

      const updatedEdges = edges.map((edge) => {
          const isBottleneck = bottleneck.some(
            (b) => b.u === parseInt(edge.source) && b.v === parseInt(edge.target)
          );

          const edgeFlowData = edge_flows ? edge_flows.find(
            (ef) => ef.u === parseInt(edge.source) && ef.v === parseInt(edge.target)
          ) : null;
          
          const capacity = parseInt(edge.label.split(' ')[0]);
          const flow = edgeFlowData ? edgeFlowData.flow : 0;
          const utilization = capacity > 0 ? flow / capacity : 0;

          if (flow > 0) {
            totalUtil += utilization;
            activeEdgesCount++;
            if (utilization >= 0.9) congestedCount++;
          }

          if (isBottleneck && !nextRecommendations.some(r => r.edgeId === edge.id)) {
             const maxCapInNetwork = Math.max(...edges.map(e => parseInt(e.label.split(' ')[0]) || 0));
             const recommendedCap = Math.max(Math.ceil(capacity * 1.5), maxCapInNetwork, capacity + 10);
             nextRecommendations.push({
               edgeId: edge.id,
               source: edge.source,
               target: edge.target,
               current: capacity,
               recommended: recommendedCap,
               improvement: Math.round(((recommendedCap - capacity) / capacity) * 100)
             });
          }

          let edgeColor = '#4b5563'; // Grey (no traffic)
          if (flow > 0) {
            if (utilization >= 0.9) edgeColor = '#dc2626'; // Red (Congested)
            else if (utilization >= 0.5) edgeColor = '#eab308'; // Yellow (Moderate)
            else edgeColor = '#10b981'; // Green (Healthy)
          }

          return {
            ...edge,
            animated: flow > 0, // Animate only if traffic is flowing
            style: { stroke: edgeColor, strokeWidth: isBottleneck ? 4 : (flow > 0 ? 3 : 2) },
            labelStyle: { fill: edgeColor, fontWeight: isBottleneck ? 800 : 600 }
          };
      });

      setEdges(updatedEdges);

      const avgUtil = activeEdgesCount > 0 ? totalUtil / activeEdgesCount : 0;
      setMetrics({
        avgUtil: Math.round(avgUtil * 100),
        congested: congestedCount,
        health: Math.max(0, Math.round((1 - avgUtil) * 100))
      });
      setShowMetrics(true);
      setRecommendations(nextRecommendations);
      setShowRecs(true);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Error running simulation. Check backend connection.");
    }
    setLoading(false);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0d1117' }}>
      
      {showAuthModal && (
        <AuthModal 
          onClose={() => {
            setShowAuthModal(false);
            setPendingSave(false);
          }} 
          onLoginSuccess={handleLoginSuccess} 
        />
      )}

      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0, color: '#c9d1d9', fontSize: '1.5rem', fontWeight: 600 }}>Network Analyzer</h2>
          <p style={{ margin: '4px 0 0 0', color: '#8b949e', fontSize: '0.9rem' }}>Topology design and bandwidth optimization.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {maxFlow !== null && (
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981', marginRight: '16px', padding: '6px 12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              Max Flow: {maxFlow} Gbps
            </div>
          )}

          {user ? (
             <div style={{ display: 'flex', alignItems: 'center', marginRight: '12px', color: '#8b949e', fontSize: '0.9rem' }}>
                <span style={{ marginRight: '12px' }}>Welcome, <strong style={{ color: '#c9d1d9' }}>{user}</strong></span>
                <button onClick={handleLogout} style={btnOutlineStyle}>Logout</button>
             </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} style={btnOutlineStyle}>
              Sign In
            </button>
          )}
          
          <button onClick={addRouterNode} style={btnStyle('#30363d', '#c9d1d9')}>
            Add Router
          </button>

          <button onClick={deleteSelected} style={btnStyle('#dc2626', '#fff')}>
            Delete Selected
          </button>

          <button onClick={handleSaveClick} disabled={loading} style={btnStyle('#10b981', '#fff', loading)}>
            Save Network
          </button>

          {user && (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowLoadMenu(!showLoadMenu)} 
                style={btnStyle('#30363d', '#c9d1d9', loading)}
              >
                Load Network
              </button>
              
              {showLoadMenu && (
                <div style={dropdownStyle}>
                  {savedNetworks.length === 0 ? (
                    <div style={{ padding: '12px', color: '#8b949e', fontSize: '0.9rem' }}>No saved networks.</div>
                  ) : (
                    savedNetworks.map(net => (
                      <div 
                        key={net._id} 
                        onClick={() => loadNetwork(net._id)}
                        style={dropdownItemStyle}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 500, color: '#c9d1d9' }}>{net.name}</div>
                          <button 
                            onClick={(e) => deleteNetwork(net._id, e)} 
                            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}
                            title="Delete network"
                          >
                            &times;
                          </button>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#8b949e', marginTop: '4px' }}>
                          {new Date(net.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <button onClick={runAnalysis} disabled={loading} style={btnStyle('#238636', '#fff', loading)}>
            {loading ? 'Processing...' : 'Run Simulation'}
          </button>
        </div>
      </div>

      <div style={{ flexGrow: 1, borderTop: '1px solid #30363d', position: 'relative' }} onClick={() => setShowLoadMenu(false)}>
        
        {showMetrics && <SimulationDashboard metrics={metrics} onClose={() => setShowMetrics(false)} />}
        {showRecs && <RecommendationsPanel recommendations={recommendations} onClose={() => setShowRecs(false)} />}

        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange} 
          onEdgesChange={onEdgesChange} 
          onConnect={onConnect} 
          onEdgeDoubleClick={onEdgeDoubleClick}
          nodeTypes={nodeTypes}
          proOptions={{ hideAttribution: true }}
          fitView
        >
          <Background color="#30363d" gap={20} size={1.5} />
          <Controls style={{ button: { backgroundColor: '#161b22', border: '1px solid #30363d', color: '#c9d1d9' } }} />
        </ReactFlow>
      </div>

    </div>
  );
}

const headerStyle = {
  padding: '16px 24px', 
  backgroundColor: '#161b22', 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center',
  borderBottom: '1px solid #30363d'
};

const btnStyle = (bgColor, color, disabled = false) => ({
  padding: '8px 16px', 
  fontSize: '0.9rem', 
  backgroundColor: disabled ? '#30363d' : bgColor,
  color: disabled ? '#8b949e' : color, 
  border: '1px solid rgba(255,255,255,0.1)', 
  borderRadius: '6px',
  cursor: disabled ? 'not-allowed' : 'pointer', 
  fontWeight: '600',
  transition: 'all 0.2s ease',
  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
});

const btnOutlineStyle = {
  padding: '8px 16px',
  fontSize: '0.9rem',
  backgroundColor: 'transparent',
  color: '#10b981',
  border: '1px solid #10b981',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '600',
  transition: 'all 0.2s ease',
};

const dropdownStyle = {
  position: 'absolute',
  top: '44px',
  right: '0',
  backgroundColor: '#161b22',
  borderRadius: '6px',
  border: '1px solid #30363d',
  boxShadow: '0px 8px 24px rgba(0,0,0,0.5)',
  minWidth: '220px',
  maxHeight: '300px',
  overflowY: 'auto',
  zIndex: 10
};

const dropdownItemStyle = {
  padding: '12px 16px',
  borderBottom: '1px solid #30363d',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  transition: 'background-color 0.2s'
};