import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Play, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Activity } from 'lucide-react';

export function EvaluationPage() {
  const [evalData, setEvalData] = useState(null);
  const [running, setRunning] = useState(false);

  const runBenchmark = async () => {
    try {
      setRunning(true);
      const data = await api.runEvaluation();
      setEvalData(data);
    } catch (err) {
      alert('Error running evaluation benchmark: ' + err.message);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    runBenchmark();
  }, []);

  // Format chart data for Recharts
  const chartData = evalData ? [
    {
      metric: 'Success Rate (%)',
      Baseline: evalData.baseline.metrics.successRatePct,
      ProposedModel: evalData.proposed.metrics.successRatePct
    },
    {
      metric: 'State Consistency (%)',
      Baseline: evalData.baseline.metrics.finalStateConsistencyPct,
      ProposedModel: evalData.proposed.metrics.finalStateConsistencyPct
    },
    {
      metric: 'Unnecessary Task Repeats',
      Baseline: evalData.baseline.metrics.unnecessaryRepeatedTasks,
      ProposedModel: evalData.proposed.metrics.unnecessaryRepeatedTasks
    },
    {
      metric: 'Completed Tasks Re-run',
      Baseline: evalData.baseline.metrics.completedTasksRepeated,
      ProposedModel: evalData.proposed.metrics.completedTasksRepeated
    }
  ] : [];

  return (
    <div>
      {/* Benchmark Header Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Comparative Research Evaluation</h2>
            <p className="card-subtitle">Empirical comparison between Baseline Workflow Policy vs Proposed Exception Recovery Model</p>
          </div>
          <button className="btn btn-primary" onClick={runBenchmark} disabled={running}>
            <Play size={15} />
            <span>{running ? 'Executing Benchmark Suite...' : 'Re-Run Evaluation Suite'}</span>
          </button>
        </div>

        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '13px', lineHeight: '1.6' }}>
          <strong>Academic Methodology Notice:</strong> This benchmark runs 6 standardized test scenarios (TC1–TC6) 
          through both the Baseline engine and the Proposed Model. All metrics are calculated by actual simulation executions. 
          <em> Note: These experiments operate over a deterministic local business workflow engine, not live third-party payment gateways.</em>
        </div>
      </div>

      {/* Model Definition Breakdown Cards */}
      <div className="eval-grid">
        <div className="card" style={{ borderLeft: '4px solid #94a3b8' }}>
          <h3 className="card-title" style={{ color: '#475569' }}>Baseline Workflow Policy</h3>
          <p className="card-subtitle" style={{ marginBottom: '12px' }}>Traditional static workflow management</p>
          <ul style={{ fontSize: '13px', color: 'var(--text-body)', paddingLeft: '18px', lineHeight: '1.5' }}>
            <li><strong>No Exception Classification:</strong> All failures handled uniformly as generic errors.</li>
            <li><strong>Blind Retries:</strong> Re-executes invalid input without validating underlying cause.</li>
            <li><strong>Restart From Step 1:</strong> On retry, re-runs completed tasks (re-validates and re-bills).</li>
            <li><strong>No Semantic Compensation:</strong> Downstream failures leave reserved inventory locked and orphaned.</li>
          </ul>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <h3 className="card-title" style={{ color: 'var(--accent)' }}>Proposed Recovery Model</h3>
          <p className="card-subtitle" style={{ marginBottom: '12px' }}>Exception-aware, state-preserving architecture</p>
          <ul style={{ fontSize: '13px', color: 'var(--text-body)', paddingLeft: '18px', lineHeight: '1.5' }}>
            <li><strong>Three Formal Classes:</strong> Distinguishes Technical, Data Error, and Business Rule.</li>
            <li><strong>State-Aware Resume:</strong> Retries ONLY failed task without repeating completed steps.</li>
            <li><strong>Semantic Compensation:</strong> Reverses completed business commitments (releases inventory).</li>
            <li><strong>Policy Escalation:</strong> Halts automated recovery cleanly upon retry limit exhaustion.</li>
          </ul>
        </div>
      </div>

      {/* Comparison Metrics Summary Table */}
      {evalData && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Empirical Benchmark Metrics Table</h3>
              <p className="card-subtitle">Aggregated performance across TC1–TC6</p>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Last run: {new Date(evalData.timestamp).toLocaleTimeString()}
            </span>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Evaluation Metric</th>
                  <th>Baseline Model</th>
                  <th>Proposed Model</th>
                  <th>Research Impact &amp; Rationale</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Workflow Success Rate</strong></td>
                  <td><span style={{ color: '#d97706', fontWeight: '700' }}>{evalData.baseline.metrics.successRatePct}%</span></td>
                  <td><span style={{ color: 'var(--status-success-text)', fontWeight: '700' }}>{evalData.proposed.metrics.successRatePct}%</span></td>
                  <td>Higher completion rate through targeted retries for transient failures.</td>
                </tr>
                <tr>
                  <td><strong>Final State Consistency</strong></td>
                  <td><span style={{ color: '#dc2626', fontWeight: '700' }}>{evalData.baseline.metrics.finalStateConsistencyPct}%</span></td>
                  <td><span style={{ color: 'var(--status-success-text)', fontWeight: '700' }}>{evalData.proposed.metrics.finalStateConsistencyPct}%</span></td>
                  <td>100% consistency achieved via semantic inventory compensation and rollback.</td>
                </tr>
                <tr>
                  <td><strong>Unnecessary Repeated Tasks</strong></td>
                  <td><span style={{ color: '#dc2626', fontWeight: '700' }}>{evalData.baseline.metrics.unnecessaryRepeatedTasks} tasks</span></td>
                  <td><span style={{ color: 'var(--status-success-text)', fontWeight: '700' }}>{evalData.proposed.metrics.unnecessaryRepeatedTasks} tasks</span></td>
                  <td>Eliminated redundant validations of bad data and eliminated full restart.</td>
                </tr>
                <tr>
                  <td><strong>Completed Tasks Re-Executed</strong></td>
                  <td><span style={{ color: '#dc2626', fontWeight: '700' }}>{evalData.baseline.metrics.completedTasksRepeated} tasks</span></td>
                  <td><span style={{ color: 'var(--status-success-text)', fontWeight: '700' }}>{evalData.proposed.metrics.completedTasksRepeated} tasks</span></td>
                  <td>Proposed model resumes in-place; baseline re-charges and re-validates.</td>
                </tr>
                <tr>
                  <td><strong>Total Recovery Attempts</strong></td>
                  <td>{evalData.baseline.metrics.totalRecoveryAttempts} attempts</td>
                  <td>{evalData.proposed.metrics.totalRecoveryAttempts} attempts</td>
                  <td>Proposed model attempts recovery only when exception is recoverable.</td>
                </tr>
                <tr>
                  <td><strong>Average Recovery Duration</strong></td>
                  <td>{evalData.baseline.metrics.avgRecoveryDurationMs} ms</td>
                  <td>{evalData.proposed.metrics.avgRecoveryDurationMs} ms</td>
                  <td>Faster turnaround because completed tasks are skipped during retry.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recharts Visual Comparison */}
      {chartData.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Comparative Performance Charts</h3>
              <p className="card-subtitle">Visual evaluation of success rate, state consistency, and redundant executions</p>
            </div>
          </div>

          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="metric" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '6px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                <Bar dataKey="Baseline" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ProposedModel" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Test Scenarios TC1 - TC6 Detail Breakdown */}
      {evalData && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Scenario Breakdown (TC1 – TC6)</h3>
              <p className="card-subtitle">Per-test-case results comparing Baseline vs Proposed outcomes</p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Scenario Description</th>
                  <th>Baseline Outcome</th>
                  <th>Proposed Outcome</th>
                  <th>Key Research Finding</th>
                </tr>
              </thead>
              <tbody>
                {evalData.proposed.testCases.map((tc, idx) => {
                  const baseTc = evalData.baseline.testCases[idx];
                  return (
                    <tr key={tc.testCaseId}>
                      <td><strong>{tc.testCaseId}</strong></td>
                      <td>
                        <strong>{tc.name}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tc.scenario}</div>
                      </td>
                      <td>
                        <span style={{ color: baseTc.success ? '#059669' : '#dc2626', fontWeight: '600' }}>
                          {baseTc.outcome}
                        </span>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{baseTc.details}</div>
                      </td>
                      <td>
                        <span style={{ color: tc.success ? '#059669' : '#2563eb', fontWeight: '600' }}>
                          {tc.outcome}
                        </span>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tc.details}</div>
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        {tc.testCaseId === 'TC1' && 'Proposed model retried only payment; baseline re-executed place_order and validate_order.'}
                        {tc.testCaseId === 'TC2' && 'Proposed model recognized deterministic data error and rolled back; baseline retried twice uselessly.'}
                        {tc.testCaseId === 'TC3' && 'Proposed model triggered semantic compensation (released inventory); baseline left inventory orphaned.'}
                        {tc.testCaseId === 'TC4' && 'Proposed model enforced 2-attempt retry limit and escalated cleanly with state snapshot.'}
                        {tc.testCaseId === 'TC5' && 'Proposed model resumed directly at inventory allocation without re-billing customer card.'}
                        {tc.testCaseId === 'TC6' && 'Proposed model identified compliance rule and escalated to human operator safely.'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
