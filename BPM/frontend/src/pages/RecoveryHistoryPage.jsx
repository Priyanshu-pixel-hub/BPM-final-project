import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { ExecutionLog } from '../components/ExecutionLog';
import { StateTracker } from '../components/StateTracker';
import { Trash2, RefreshCw, Eye, CheckCircle2, AlertOctagon } from 'lucide-react';

export function RecoveryHistoryPage() {
  const [history, setHistory] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getHistory();
      setHistory(data);
      if (data.length > 0 && !selectedWorkflow) {
        setSelectedWorkflow(data[0]);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to clear all in-memory demonstration execution records?')) {
      try {
        await api.resetHistory();
        setHistory([]);
        setSelectedWorkflow(null);
      } catch (err) {
        alert('Failed to clear demonstration data: ' + err.message);
      }
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Recovery History Audit Log</h2>
            <p className="card-subtitle">Complete chronological record of all workflow simulations executed in memory</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={loadHistory} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
            <button className="btn btn-danger" onClick={handleResetData} disabled={history.length === 0}>
              <Trash2 size={14} />
              <span>Reset Demonstration Data</span>
            </button>
          </div>
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <p>No workflow execution records found in memory.</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>Execute one or more simulations from the "Run Workflow" page to inspect logs here.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Workflow ID</th>
                  <th>Scenario Injected</th>
                  <th>Exception Category</th>
                  <th>Strategy</th>
                  <th>Tasks Executed</th>
                  <th>Recovery Attempts</th>
                  <th>Final Status</th>
                  <th>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => {
                  const isSelected = selectedWorkflow?.workflowId === item.workflowId;
                  return (
                    <tr 
                      key={item.workflowId} 
                      onClick={() => setSelectedWorkflow(item)}
                      style={{ backgroundColor: isSelected ? 'var(--accent-subtle)' : undefined }}
                    >
                      <td><strong>{item.workflowId}</strong></td>
                      <td>{item.scenario}</td>
                      <td>
                        {item.exception ? (
                          <span style={{ fontWeight: '500' }}>{item.exception.categoryLabel}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Nominal (None)</span>
                        )}
                      </td>
                      <td><code>{item.selectedStrategy}</code></td>
                      <td>{item.totalTasksExecuted} tasks</td>
                      <td>{item.recoveryAttempts}</td>
                      <td><StatusBadge status={item.finalStatus} /></td>
                      <td>
                        <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Workflow Inspection Modal / Detail Panel */}
      {selectedWorkflow && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Detailed Audit: {selectedWorkflow.workflowId}</h3>
              <p className="card-subtitle">
                Executed at: {new Date(selectedWorkflow.timestamp).toLocaleString()} | Order: {selectedWorkflow.orderId}
              </p>
            </div>
            <StatusBadge status={selectedWorkflow.finalStatus} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px', background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Injected Scenario</div>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>{selectedWorkflow.scenario}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Exception Category</div>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>
                {selectedWorkflow.exception ? selectedWorkflow.exception.categoryLabel : 'None (Completed Without Failure)'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Strategy Selected</div>
              <div style={{ fontSize: '13px', fontWeight: '600' }}><code>{selectedWorkflow.selectedStrategy}</code></div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completed Tasks</div>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>{selectedWorkflow.completedTasksCount} of 6</div>
            </div>
          </div>

          {/* State Snapshot */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Process State Snapshot</h4>
            <StateTracker 
              processState={selectedWorkflow.processState}
              committedMilestones={selectedWorkflow.committedMilestones}
              compensationLog={selectedWorkflow.compensationLog}
              rollbackLog={selectedWorkflow.rollbackLog}
            />
          </div>

          {/* Execution Log */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Complete Chronological Trace</h4>
            <ExecutionLog logs={selectedWorkflow.logs} />
          </div>
        </div>
      )}
    </div>
  );
}
