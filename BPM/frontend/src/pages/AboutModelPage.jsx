import React from 'react';
import { 
  Workflow, 
  Search, 
  Layers, 
  GitBranch, 
  Database, 
  FileText,
  AlertCircle,
  RotateCcw,
  Undo2,
  RefreshCw,
  UserCheck
} from 'lucide-react';

export function AboutModelPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title & Introduction */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Modeling Exception Handling and Process Recovery in Business Processes</h2>
            <p className="card-subtitle">Conceptual Framework, Architecture, and Formal Methodology</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
              1. Problem Statement
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-body)', lineHeight: '1.6' }}>
              Standard business workflow management systems frequently handle runtime failures uniformly. 
              Treating all errors as generic technical faults leads to either <em>blind repeated executions of fundamentally invalid data</em>, 
              or <em>abrupt process crashes that leave already committed business resources (such as reserved warehouse inventory or debited payments) 
              orphaned and inconsistent</em>. Furthermore, re-running entire workflows from task 1 incurs high computational cost and duplicate real-world operations.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
              2. Research Objective
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-body)', lineHeight: '1.6' }}>
              To model and evaluate a structured, rule-based exception handling framework that:
              (a) categorizes runtime exceptions into deterministic and transient classes, 
              (b) dynamically decides between Retry, Rollback, Semantic Compensation, or Escalation, and 
              (c) maintains consistent state progression without repeating successfully completed tasks.
            </p>
          </div>
        </div>
      </div>

      {/* System Architecture Diagram */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Proposed System Architecture</h3>
            <p className="card-subtitle">Information flow and feedback loops between components</p>
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', alignItems: 'center', maxWidth: '1000px' }}>
            
            <div style={{ background: '#ffffff', border: '2px solid var(--accent)', borderRadius: '6px', padding: '12px 14px', textAlign: 'center', minWidth: '130px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Component 1</div>
              <strong style={{ fontSize: '13px', color: 'var(--accent)' }}>Workflow Engine</strong>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Task Orchestration</div>
            </div>

            <span style={{ fontSize: '18px', color: 'var(--text-muted)', fontWeight: 'bold' }}>→</span>

            <div style={{ background: '#ffffff', border: '1px solid var(--border-medium)', borderRadius: '6px', padding: '12px 14px', textAlign: 'center', minWidth: '130px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Component 2</div>
              <strong style={{ fontSize: '13px' }}>Exception Detector</strong>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Intercepts Faults</div>
            </div>

            <span style={{ fontSize: '18px', color: 'var(--text-muted)', fontWeight: 'bold' }}>→</span>

            <div style={{ background: '#ffffff', border: '1px solid var(--border-medium)', borderRadius: '6px', padding: '12px 14px', textAlign: 'center', minWidth: '130px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Component 3</div>
              <strong style={{ fontSize: '13px' }}>Exception Classifier</strong>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Category Mapping</div>
            </div>

            <span style={{ fontSize: '18px', color: 'var(--text-muted)', fontWeight: 'bold' }}>→</span>

            <div style={{ background: '#ffffff', border: '2px solid #7c3aed', borderRadius: '6px', padding: '12px 14px', textAlign: 'center', minWidth: '140px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Component 4</div>
              <strong style={{ fontSize: '13px', color: '#7c3aed' }}>Recovery Decision Engine</strong>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Rule-Based Selection</div>
            </div>

            <span style={{ fontSize: '18px', color: 'var(--text-muted)', fontWeight: 'bold' }}>↔</span>

            <div style={{ background: '#ffffff', border: '1px solid var(--border-medium)', borderRadius: '6px', padding: '12px 14px', textAlign: 'center', minWidth: '130px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Component 5</div>
              <strong style={{ fontSize: '13px' }}>State Manager</strong>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Milestone Snapshots</div>
            </div>

            <span style={{ fontSize: '18px', color: 'var(--text-muted)', fontWeight: 'bold' }}>→</span>

            <div style={{ background: '#ffffff', border: '1px solid var(--border-medium)', borderRadius: '6px', padding: '12px 14px', textAlign: 'center', minWidth: '130px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Component 6</div>
              <strong style={{ fontSize: '13px' }}>Execution Logger</strong>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Immutable Audit Log</div>
            </div>

          </div>

          <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Note: The State Manager maintains bidirectional communication with the Recovery Decision Engine to verify committed milestones prior to strategy resolution.
          </div>
        </div>
      </div>

      {/* Exception Categories & Recovery Strategies Grid */}
      <div className="eval-grid">
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '14px' }}>The Three Exception Categories</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div style={{ borderLeft: '3px solid var(--status-info-text)', paddingLeft: '12px' }}>
              <strong>1. Technical Failures (Transient)</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                Temporary network latency, service timeouts (HTTP 504), database connection pools exhausted. Recoverable via idempotent retries within configured retry bounds.
              </p>
            </div>

            <div style={{ borderLeft: '3px solid var(--status-warn-text)', paddingLeft: '12px' }}>
              <strong>2. Data Errors (Deterministic)</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                Schema malformations, missing mandatory fields (customer email), negative quantity constraints. Unrecoverable by retry; requires transactional rollback and input rejection.
              </p>
            </div>

            <div style={{ borderLeft: '3px solid var(--status-error-text)', paddingLeft: '12px' }}>
              <strong>3. Business Rule Violations (Policy)</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                Warehouse stock shortages, credit ceiling breaches, compliance restrictions. Requires semantic compensation if prior milestones were committed, or operator escalation.
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '14px' }}>The Four Recovery Strategies</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '12px' }}>
              <strong>A. Retry Strategy</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                Re-attempts ONLY the failed task. Enforces strict retry ceiling (1–3 attempts). Never repeats already completed antecedent tasks.
              </p>
            </div>

            <div style={{ borderLeft: '3px solid #7c3aed', paddingLeft: '12px' }}>
              <strong>B. Rollback Strategy</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                Undoes uncommitted in-flight transactional data, restoring pre-transaction state. Clearly distinguished from compensation.
              </p>
            </div>

            <div style={{ borderLeft: '3px solid #4338ca', paddingLeft: '12px' }}>
              <strong>C. Semantic Compensation</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                Applies real counter-actions to reverse already committed business milestones (e.g. releases reserved warehouse inventory back to available stock pool).
              </p>
            </div>

            <div style={{ borderLeft: '3px solid #be123c', paddingLeft: '12px' }}>
              <strong>D. Escalation Strategy</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                Halts automated recovery safely, preserves full process execution history, and flags the workflow for human operator intervention.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Process State Tracking Model & Metrics */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '12px' }}>Process State Lifecycle &amp; Evaluation Metrics</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', fontSize: '13px' }}>
          <div>
            <h4 style={{ fontWeight: '700', marginBottom: '6px' }}>Formal State Transitions</h4>
            <p style={{ color: 'var(--text-body)', lineHeight: '1.5' }}>
              <code>CREATED → VALIDATING → PAYMENT_PENDING → INVENTORY_RESERVED → INVOICED → COMPLETED</code>
            </p>
            <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '12px' }}>
              Error and recovery states: <code>RETRYING</code>, <code>ROLLING_BACK</code>, <code>COMPENSATING</code>, <code>ESCALATED</code>, <code>FAILED</code>.
            </p>
          </div>

          <div>
            <h4 style={{ fontWeight: '700', marginBottom: '6px' }}>Evaluation Metrics Measured</h4>
            <ul style={{ paddingLeft: '18px', color: 'var(--text-body)', lineHeight: '1.5' }}>
              <li><strong>Workflow Success Rate (%):</strong> Ratio of completed business objectives.</li>
              <li><strong>Final State Consistency (%):</strong> Absence of orphaned locks or uncompensated stock.</li>
              <li><strong>Completed Tasks Repeated:</strong> Redundant re-executions eliminated by state tracking.</li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontWeight: '700', marginBottom: '6px' }}>Current Limitations &amp; Future Work</h4>
            <ul style={{ paddingLeft: '18px', color: 'var(--text-body)', lineHeight: '1.5' }}>
              <li><strong>Simulated Infrastructure:</strong> Operations are evaluated via deterministic local models.</li>
              <li><strong>Future Work:</strong> Integrate asynchronous Saga choreographies, distributed consensus logs (Raft), and ML-based adaptive retry backoff.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
