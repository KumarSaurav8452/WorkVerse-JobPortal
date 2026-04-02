import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';

const NODE_LIMIT = 50;

export default function GraphExplorer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [schema, setSchema] = useState({ labels: [], relationshipTypes: [] });
  const [selectedLabel, setSelectedLabel] = useState('');
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [neighbors, setNeighbors] = useState([]);
  const [relationshipSummary, setRelationshipSummary] = useState([]);

  const view = searchParams.get('view') || 'overview';
  const presetLabel = searchParams.get('label') || '';

  useEffect(() => {
    api.get('/admin/schema')
      .then((response) => setSchema(response.data))
      .catch((error) => console.error('Schema load failed:', error));
  }, []);

  const loadNodes = async (label) => {
    if (!label) return;

    setSelectedLabel(label);
    setSelectedNode(null);
    setLoading(true);

    try {
      const response = await api.get(
        `/admin/query?q=${encodeURIComponent(`MATCH (n:${label}) RETURN n LIMIT ${NODE_LIMIT}`)}`
      );
      setNodes(response.data.data || []);
    } catch (error) {
      console.error('Node load failed:', error);
      setNodes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRelationshipSummary = async () => {
    setLoading(true);
    setSelectedLabel('');
    setSelectedNode(null);

    try {
      const response = await api.get(
        `/admin/query?q=${encodeURIComponent(`
MATCH ()-[r]->()
RETURN type(r) AS relationshipType, count(r) AS total
ORDER BY total DESC
LIMIT 25
        `)}`
      );
      setRelationshipSummary(response.data.data || []);
    } catch (error) {
      console.error('Relationship summary failed:', error);
      setRelationshipSummary([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!schema.labels.length) return;

    if (view === 'relationships') {
      loadRelationshipSummary();
      return;
    }

    if (presetLabel && schema.labels.includes(presetLabel)) {
      loadNodes(presetLabel);
      return;
    }

    if (view === 'nodes' && schema.labels.length > 0) {
      loadNodes(schema.labels[0]);
    }
  }, [schema.labels, presetLabel, view]);

  useEffect(() => {
    if (!selectedNode || !selectedLabel) {
      setNeighbors([]);
      return;
    }

    const id =
      selectedNode.id ||
      selectedNode.candidateId ||
      selectedNode.jobId ||
      selectedNode.appId ||
      selectedNode.employerId;

    const idKey = selectedNode.candidateId
      ? 'candidateId'
      : selectedNode.jobId
        ? 'jobId'
        : selectedNode.appId
          ? 'appId'
          : selectedNode.employerId
            ? 'employerId'
            : 'id';

    if (!id) {
      setNeighbors([]);
      return;
    }

    api.get(
      `/admin/query?q=${encodeURIComponent(`
MATCH (n:${selectedLabel} { ${idKey}: "${id}" })-[r]-(m)
RETURN type(r) AS rel, labels(m)[0] AS neighbor, coalesce(m.name, m.title, m.email, m.company, m.location) AS name
LIMIT 20
      `)}`
    )
      .then((response) => setNeighbors(response.data.data || []))
      .catch((error) => {
        console.error('Neighbor load failed:', error);
        setNeighbors([]);
      });
  }, [selectedNode, selectedLabel]);

  const headerText = useMemo(() => {
    if (view === 'relationships') {
      return {
        title: 'Relationship Explorer',
        subtitle: 'Inspect which graph connections are most common across the platform.',
      };
    }

    if (selectedLabel) {
      return {
        title: `${selectedLabel} Explorer`,
        subtitle: `Browsing up to ${NODE_LIMIT} ${selectedLabel.toLowerCase()} nodes with property inspection and relationship traversal.`,
      };
    }

    return {
      title: 'Graph Explorer',
      subtitle: 'Browse nodes, inspect properties, and traverse relationships in real time.',
    };
  }, [selectedLabel, view]);

  const selectView = (nextView, label = '') => {
    const next = new URLSearchParams();
    next.set('view', nextView);
    if (label) next.set('label', label);
    setSearchParams(next);
  };

  return (
    <div className="container" style={{ paddingTop: 100, paddingBottom: 60 }}>
      <div className="flex-between" style={{ marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>
            {headerText.title.split(' ')[0]} <span className="gradient-text">{headerText.title.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{headerText.subtitle}</p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className={`btn btn-sm ${view !== 'relationships' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => selectView('overview')}>
            Overview
          </button>
          <button type="button" className={`btn btn-sm ${view === 'relationships' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => selectView('relationships')}>
            Relationships
          </button>
          <Link to="/admin/console" className="btn btn-ghost btn-sm">Open Console</Link>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '280px 1fr', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Node Labels</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {schema.labels.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => selectView('nodes', label)}
                  className={`btn ${selectedLabel === label && view !== 'relationships' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ justifyContent: 'start', padding: '10px 16px', fontSize: 13 }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Relationship Types</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {schema.relationshipTypes.map((type) => (
                <span
                  key={type}
                  className="badge badge-purple"
                  style={{ fontSize: 11, background: 'rgba(69, 178, 232, 0.1)', color: 'var(--accent)', border: '1px solid var(--accent-glow)' }}
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ minHeight: 700, display: 'flex', flexDirection: 'column' }}>
          {loading && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="spinner" />
            </div>
          )}

          {!loading && view === 'overview' && !selectedLabel && (
            <div style={{ flex: 1, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {schema.labels.map((label) => (
                <button
                  key={label}
                  type="button"
                  className="metric-card"
                  onClick={() => selectView('nodes', label)}
                  style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid var(--border)' }}
                >
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                    Explore
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{label}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    Open the {label.toLowerCase()} collection and inspect individual nodes.
                  </div>
                </button>
              ))}
              <button
                type="button"
                className="metric-card"
                onClick={() => selectView('relationships')}
                style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid var(--border)' }}
              >
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Analyze
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Relationships</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  View connection density and relationship-type distribution across the graph.
                </div>
              </button>
            </div>
          )}

          {!loading && view === 'relationships' && (
            <div>
              <div className="flex-between" style={{ marginBottom: 18 }}>
                <h3 style={{ fontSize: 16 }}>Relationship Breakdown</h3>
                <span className="badge badge-purple">{relationshipSummary.length} types</span>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                {relationshipSummary.map((item) => (
                  <div
                    key={item.relationshipType}
                    className="metric-card"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.relationshipType}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        Relationship type present in the live graph.
                      </div>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--warning)' }}>
                      {Number(item.total || 0).toLocaleString()}
                    </div>
                  </div>
                ))}

                {relationshipSummary.length === 0 && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No relationship data found.</div>
                )}
              </div>
            </div>
          )}

          {!loading && selectedLabel && view !== 'relationships' && (
            <div style={{ display: 'grid', gridTemplateColumns: selectedNode ? '1fr 350px' : '1fr', gap: 24, flex: 1 }}>
              <div style={{ overflowY: 'auto', maxHeight: '75vh' }}>
                <div className="flex-between" style={{ marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: 16 }}>{selectedLabel} Nodes</h3>
                  <span className="badge badge-blue">{nodes.length} loaded</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {nodes.map((entry, index) => {
                    const node = entry.n;
                    const isSelected = selectedNode && JSON.stringify(selectedNode) === JSON.stringify(node);

                    return (
                      <div
                        key={`${selectedLabel}-${index}`}
                        onClick={() => setSelectedNode(node)}
                        className="card card-hover"
                        style={{
                          padding: 16,
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                          cursor: 'pointer',
                          transition: '0.2s',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          {node.name || node.title || node.email || node.company || 'Unnamed Node'}
                        </div>
                        <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          {node.id || node.candidateId || node.jobId || node.appId || node.employerId || 'System Record'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedNode && (
                <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 24, overflowY: 'auto', maxHeight: '75vh' }}>
                  <div className="flex-between" style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 16 }}>Node Inspector</h3>
                    <button
                      type="button"
                      onClick={() => setSelectedNode(null)}
                      style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}
                    >
                      x
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                    <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Properties</h4>
                    {Object.entries(selectedNode).map(([key, value]) => (
                      <div key={key}>
                        <div className="form-label" style={{ fontSize: 10 }}>{key}</div>
                        <div
                          className="mono"
                          style={{
                            fontSize: 12,
                            padding: '8px 12px',
                            background: 'var(--bg-secondary)',
                            borderRadius: 6,
                            color: 'var(--accent)',
                            border: '1px solid var(--border)',
                            wordBreak: 'break-all',
                          }}
                          title={String(value)}
                        >
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Connections ({neighbors.length})</h4>

                    {neighbors.length === 0 && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No relationships found for this node.
                      </div>
                    )}

                    {neighbors.map((neighbor, index) => (
                      <div
                        key={`${neighbor.rel}-${index}`}
                        style={{
                          padding: '12px',
                          background: 'rgba(69, 178, 232, 0.05)',
                          border: '1px solid var(--border-hover)',
                          borderRadius: 8,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="badge badge-purple" style={{ fontSize: 9 }}>{neighbor.rel}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{neighbor.neighbor}</span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                          {neighbor.name || 'Unnamed Record'}
                        </div>
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
