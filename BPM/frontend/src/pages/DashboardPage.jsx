import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PlayCircle, ArrowRight, RefreshCw, ShieldAlert, Cpu, CheckCircle2 } from 'lucide-react';

export function DashboardPage({ onNavigate }) {
  const [stats, setStats] = useState({
    totalWorkflows: 0,
    successful: 0,
    failed: 0,
    recoveryAttempts: 0,
    exceptionsHandled: 0,
    recentExecutions: []
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const workflowPipeline = [
    { title: 'Place Order', desc: 'Initialize order intent' },
    { title: 'Validate Order', desc: 'Check data & limits' },
    { title: 'Process Payment', desc: 'Authorize debit' },
    { title: 'Reserve Inventory', desc: 'Allocate stock' },
    { title: 'Generate Invoice', desc: 'Fiscal tax invoice' },
    { title: 'Complete Order', desc: 'Close fulfillment' }
  ];

  return (
    <div>
      {/* Research Project Overview Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Modeling Exception Handling and Process Recovery in Business Processes</h2>
            <p className="card-subtitle">College Research Presentation Prototype & Evaluation Platform</p>
          </div>
          <button className="btn btn-primary" onClick={() => onNavigate('simulation')}>
            <PlayCircle size={16} />
            <span>Run New Workflow</span>
          </button>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-body)', lineHeight: '1.6' }}>
          <strong>Research Objective:</strong> Modern distributed business workflows frequently encounter transient 
          infrastructure timeouts, deterministic data validation errors, and domain business rule violations. 
          This project evaluates an automated <em>Exception Handling &amp; Process Recovery Engine</em> that classifies exceptions 
          in real-time and applies context-aware recovery strategies—<strong>Retry</strong>, <strong>Rollback</strong>, 
          <strong>Semantic Compensation</strong>, and <strong>Escalation</strong>—while preserving process state consistency without redundant task re-executions.
        </p>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Standard Business Process Workflow Architecture:
          </div>
          <div className="state-path" style={{ background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            {workflowPipeline.map((step, idx) => (
              <React.Fragment key={idx}>
                <div style={{ display: 'inline-flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>{step.title}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{step.desc}</span>
                </div>
                {idx < workflowPipeline.length - 1 && <span className="state-arrow" style={{ margin: '0 8px' }}>→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Live In-Memory Metrics Grid */}
      <div className="card-header" style={{ marginBottom: '12px', borderBottom: 'none' }}>
        <div>
          <h3 className="card-title">Session Execution Metrics</h3>
          <p className="card-subtitle">Calculated dynamically from real workflow executions in memory</p>
        </div>
        <button className="btn btn-secondary" onClick={loadStats} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Workflows Executed</div>
          <div className="stat-value">{stats.totalWorkflows}</div>
          <div className="stat-desc">Simulation sessions run</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Successful Workflows</div>
          <div className="stat-value" style={{ color: 'var(--status-success-text)' }}>
            {stats.successful}
          </div>
          <div className="stat-desc">Fully completed tasks</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Failed / Escalated</div>
          <div className="stat-value" style={{ color: stats.failed > 0 ? 'var(--status-error-text)' : 'var(--text-main)' }}>
            {stats.failed}
          </div>
          <div className="stat-desc">Unrecovered or halted</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Recovery Attempts</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>
            {stats.recoveryAttempts}
          </div>
          <div className="stat-desc">Retry, rollback &amp; compensation</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Exceptions Handled</div>
          <div className="stat-value" style={{ color: '#d97706' }}>
            {stats.exceptionsHandled}
          </div>
          <div className="stat-desc">Classified &amp; mitigated</div>
        </div>
      </div>

      {/* Recent Executions Overview */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Recent Workflow Executions</h3>
            <p className="card-subtitle">Latest runs stored in memory during this session</p>
          </div>
          {stats.recentExecutions?.length > 0 && (
            <button className="btn btn-secondary" onClick={() => onNavigate('history')}>
              <span>View Full History</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {stats.recentExecutions?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            <p style={{ marginBottom: '12px' }}>No workflow executions recorded yet in this session.</p>
            <button className="btn btn-primary" onClick={() => onNavigate('simulation')}>
              <PlayCircle size={15} />
              <span>Launch First Workflow</span>
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Workflow ID</th>
                  <th>Scenario Injected</th>
                  <th>Exception Category</th>
                  <th>Strategy Selected</th>
                  <th>Attempts</th>
                  <th>Final Outcome</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentExecutions.map((item) => (
                  <tr key={item.workflowId} onClick={() => onNavigate('history')}>
                    <td><strong>{item.workflowId}</strong></td>
                    <td>{item.scenario}</td>
                    <td>{item.exception ? item.exception.categoryLabel : 'None (Nominal)'}</td>
                    <td><code>{item.selectedStrategy}</code></td>
                    <td>{item.totalTasksExecuted} tasks ({item.recoveryAttempts} recovery)</td>
                    <td><StatusBadge status={item.finalStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
