import { useState, useEffect } from 'react';
import api from '../api';

export default function GraphExplorer() {
  const [schema, setSchema] = useState({ labels: [], relationshipTypes: [] });
  const [selectedLabel, setSelectedLabel] = useState('');
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [neighbors, setNeighbors] = useState([]);

  useEffect(() => {
    api.get('/admin/schema').then(r => setSchema(r.data));
  }, []);

  const fetchNodes = async (label) => {
    setSelectedLabel(label);
    setLoading(true);
    try {
      const r = await api.get(`/admin/query?q=${encodeURIComponent(`MATCH (n:${label}) RETURN n LIMIT 50`)}`);
      setNodes(r.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedNode) {
      const id = selectedNode.id || selectedNode.candidateId || selectedNode.jobId || selectedNode.appId;
      const label = selectedLabel;
      const idKey = selectedNode.candidateId ? 'candidateId' : (selectedNode.jobId ? 'jobId' : (selectedNode.appId ? 'appId' : 'id'));
      
      api.get(`/admin/query?q=${encodeURIComponent(`MATCH (n:${label} {${idKey}: "${id}"})-[r]-(m) RETURN type(r) as rel, labels(m)[0] as neighbor, m.name || m.title || m.email as name LIMIT 20`)}`)
        .then(r => setNeighbors(r.data.data))
        .catch(e => console.error(e));
    } else {
      setNeighbors([]);
    }
  }, [selectedNode, selectedLabel]);

  return (
    <div className="container" style={{ paddingTop: 100, paddingBottom: 60 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Graph <span className="gradient-text">Explorer</span></h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Browse nodes and traverse relationships in real-time</p>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '280px 1fr' }}>
        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Node Labels</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {schema.labels.map(l => (
                <button
                  key={l}
                  onClick={() => { setSelectedNode(null); fetchNodes(l); }}
                  className={`btn ${selectedLabel === l ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ justifyContent: 'start', padding: '10px 16px', fontSize: 13 }}
                >
                  🏷️ {l}
                </button>
              ))}
            </div>
          </div>
          
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Relationship Types</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {schema.relationshipTypes.map(t => (
                <span key={t} className="badge badge-purple" style={{ fontSize: 11, background: 'rgba(69, 178, 232, 0.1)', color: 'var(--accent)', border: '1px solid var(--accent-glow)' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="card" style={{ minHeight: 700, display: 'flex', flexDirection: 'column' }}>
          {!selectedLabel && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <p>Select a label to explore nodes and their connections</p>
              </div>
            </div>
          )}

          {loading && <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>}

          {selectedLabel && !loading && (
            <div style={{ display: 'grid', gridTemplateColumns: selectedNode ? '1fr 350px' : '1fr', gap: 24, flex: 1 }}>
              {/* Node List */}
              <div style={{ overflowY: 'auto', maxHeight: '75vh' }}>
                <h3 style={{ marginBottom: 16, fontSize: 16 }}>{selectedLabel} Nodes</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {nodes.map((n, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedNode(n.n)}
                      className="card card-hover"
                      style={{
                        padding: 16, border: '1px solid var(--border)', borderRadius: 8,
                        background: selectedNode === n.n ? 'var(--bg-elevated)' : 'transparent',
                        cursor: 'pointer', transition: '0.2s', textAlign: 'left'
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{n.n.name || n.n.title || n.n.email || 'Unnamed Node'}</div>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        {n.n.id || n.n.candidateId || n.n.jobId || 'System ID'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inspector + Relationship Traversal */}
              {selectedNode && (
                <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 24, overflowY: 'auto', maxHeight: '75vh' }}>
                  <div className="flex-between" style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 16 }}>Node Inspector</h3>
                    <button onClick={() => setSelectedNode(null)} style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
                  </div>
                  
                  {/* Properties */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                    <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Properties</h4>
                    {Object.entries(selectedNode).map(([k, v]) => (
                      <div key={k}>
                        <div className="form-label" style={{ fontSize: 10 }}>{k}</div>
                        <div className="mono" style={{ 
                          fontSize: 12, padding: '8px 12px', background: 'var(--bg-secondary)', 
                          borderRadius: 6, color: 'var(--accent)', border: '1px solid var(--border)',
                          wordBreak: 'break-all'
                        }} title={String(v)}>
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Neighbors (Connections) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Connections ({neighbors.length})</h4>
                    {neighbors.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No relationships found</div>}
                    {neighbors.map((nb, i) => (
                      <div key={i} style={{ 
                        padding: '12px', background: 'rgba(69, 178, 232, 0.05)', 
                        border: '1px solid var(--border-hover)', borderRadius: 8,
                        display: 'flex', flexDirection: 'column', gap: 4
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="badge badge-purple" style={{ fontSize: 9 }}>{nb.rel}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>→ {nb.neighbor}</span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{nb.name || 'Unnamed Record'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
