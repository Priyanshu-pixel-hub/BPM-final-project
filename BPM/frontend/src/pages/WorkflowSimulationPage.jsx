import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { WorkflowDiagram } from '../components/WorkflowDiagram';
import { ExecutionLog } from '../components/ExecutionLog';
import { StateTracker } from '../components/StateTracker';
import { StatusBadge } from '../components/StatusBadge';
import { Play, RotateCcw, FastForward, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export function WorkflowSimulationPage() {
  const [scenario, setScenario] = useState('none');
  const [strategy, setStrategy] = useState('AUTOMATIC');
  const [retryLimit, setRetryLimit] = useState(2);
  const [isRunning, setIsRunning] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);

  // Active Simulation State
  const initialTasks = {
    place_order: { id: 'place_order', name: 'Place Order', status: 'Pending', attempts: 0, message: 'Awaiting execution' },
    validate_order: { id: 'validate_order', name: 'Validate Order', status: 'Pending', attempts: 0, message: 'Awaiting execution' },
    process_payment: { id: 'process_payment', name: 'Process Payment', status: 'Pending', attempts: 0, message: 'Awaiting execution' },
    reserve_inventory: { id: 'reserve_inventory', name: 'Reserve Inventory', status: 'Pending', attempts: 0, message: 'Awaiting execution' },
    generate_invoice: { id: 'generate_invoice', name: 'Generate Invoice', status: 'Pending', attempts: 0, message: 'Awaiting execution' },
    complete_order: { id: 'complete_order', name: 'Complete Order', status: 'Pending', attempts: 0, message: 'Awaiting execution' }
  };

  const [currentTasks, setCurrentTasks] = useState(initialTasks);
  const [processState, setProcessState] = useState('CREATED');
  const [committedMilestones, setCommittedMilestones] = useState({});
  const [compensationLog, setCompensationLog] = useState([]);
  const [rollbackLog, setRollbackLog] = useState([]);
  const [displayedLogs, setDisplayedLogs] = useState([]);
  const [executionSummary, setExecutionSummary] = useState(null);

  // Animation timer ref for safe cancellation
  const animationTimerRef = useRef(null);
  const fullResultRef = useRef(null);

  useEffect(() => {
    return () => {
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    };
  }, []);

  const resetWorkflow = () => {
    if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    setIsRunning(false);
    setCurrentTasks(initialTasks);
    setProcessState('CREATED');
    setCommittedMilestones({});
    setCompensationLog([]);
    setRollbackLog([]);
    setDisplayedLogs([]);
    setErrorBanner(null);
    setExecutionSummary(null);
  };

  const handleStartWorkflow = async () => {
    resetWorkflow();
    setIsRunning(true);

    try {
      // 1. Call Backend to run actual workflow execution logic
      const result = await api.runWorkflow({
        scenario,
        strategy,
        retryLimit: Number(retryLimit)
      });

      fullResultRef.current = result;

      // 2. Animate step-by-step playback for audience demonstration
      await animateWorkflowExecution(result);
    } catch (err) {
      console.error('Execution error:', err);
      setIsRunning(false);
      setErrorBanner({
        category: 'TECHNICAL',
        title: 'Backend Communication Error',
        explanation: err.message
      });
    }
  };

  const animateWorkflowExecution = async (result) => {
    const totalLogs = result.logs || [];
    let currentLogIndex = 0;

    const playNextEvent = () => {
      if (currentLogIndex >= totalLogs.length) {
        // Animation finished: set final state
        finishPlayback(result);
        return;
      }

      const logEntry = totalLogs[currentLogIndex];
      setDisplayedLogs(prev => [...prev, logEntry]);

      // Dynamically update UI based on event metadata
      if (logEntry.metadata) {
        const { taskId, attempts, classification, recoveryDecision, action, rollbackRecord } = logEntry.metadata;

        if (taskId) {
          setCurrentTasks(prev => {
            const task = { ...(prev[taskId] || {}) };
            if (logEntry.type === 'INFO') {
              task.status = 'Running';
              task.attempts = attempts || task.attempts + 1;
              task.message = logEntry.message;
            } else if (logEntry.type === 'SUCCESS') {
              task.status = 'Completed';
              task.message = logEntry.message;
            } else if (logEntry.type === 'ERROR') {
              task.status = 'Failed';
              task.message = logEntry.message;
            } else if (logEntry.type === 'RECOVERY') {
              if (logEntry.message.includes('Retrying')) {
                task.status = 'Retrying';
              } else if (logEntry.message.includes('ROLLBACK')) {
                task.status = 'Rolled Back';
              }
            }
            return { ...prev, [taskId]: task };
          });
        }

        if (classification) {
          setErrorBanner({
            category: classification.category,
            categoryLabel: classification.categoryLabel,
            title: `Exception Detected: ${classification.errorCode}`,
            explanation: classification.explanation
          });
        }

        if (recoveryDecision) {
          if (recoveryDecision.strategy === 'ESCALATION') {
            setProcessState('ESCALATED');
          } else if (recoveryDecision.strategy === 'ROLLBACK') {
            setProcessState('ROLLING_BACK');
          } else if (recoveryDecision.strategy === 'COMPENSATION') {
            setProcessState('COMPENSATING');
          } else if (recoveryDecision.strategy === 'RETRY') {
            setProcessState('RETRYING');
          }
        }
      }

      currentLogIndex++;
      // Short delay (450ms) between events so presentation audience can follow
      animationTimerRef.current = setTimeout(playNextEvent, 450);
    };

    playNextEvent();
  };

  const finishPlayback = (result) => {
    if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    setIsRunning(false);
    setCurrentTasks(result.tasks);
    setProcessState(result.processState);
    setCommittedMilestones(result.committedMilestones);
    setCompensationLog(result.compensationLog || []);
    setRollbackLog(result.rollbackLog || []);
    setDisplayedLogs(result.logs);
    setExecutionSummary(result);
    if (result.exception) {
      setErrorBanner({
        category: result.exception.category,
        categoryLabel: result.exception.categoryLabel,
        title: `Exception: ${result.exception.errorCode}`,
        explanation: result.exception.explanation
      });
    }
  };

  const skipToEnd = () => {
    if (fullResultRef.current) {
      finishPlayback(fullResultRef.current);
    }
  };

  return (
    <div>
      {/* Simulation Controls Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Business Process Workflow Simulation</h2>
            <p className="card-subtitle">Configure failure injection, recovery policy, and observer execution in real-time</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isRunning && (
              <button className="btn btn-secondary" onClick={skipToEnd}>
                <FastForward size={15} />
                <span>Skip to End</span>
              </button>
            )}
            <button className="btn btn-secondary" onClick={resetWorkflow} disabled={isRunning}>
              <RotateCcw size={15} />
              <span>Reset</span>
            </button>
            <button className="btn btn-primary" onClick={handleStartWorkflow} disabled={isRunning}>
              <Play size={15} />
              <span>{isRunning ? 'Executing...' : 'Start Workflow'}</span>
            </button>
          </div>
        </div>

        <div className="controls-grid">
          {/* A. Failure Scenario */}
          <div className="form-group">
            <label className="form-label">A. Failure Scenario</label>
            <select
              className="form-select"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              disabled={isRunning}
            >
              <option value="none">No Failure (Happy Path)</option>
              <option value="temp_payment_failure">Temporary Payment Failure (Attempt 1 fails, Attempt 2 succeeds)</option>
              <option value="invalid_order_data">Invalid Order Data (Validation failure)</option>
              <option value="inventory_reservation_failure">Inventory Reservation Failure (Out of stock)</option>
              <option value="repeated_payment_failure">Repeated Payment Failure (Persistent outage)</option>
              <option value="invoice_failure_after_inventory">Invoice Failure After Inventory Reservation (Tests Compensation)</option>
            </select>
          </div>

          {/* B. Recovery Strategy */}
          <div className="form-group">
            <label className="form-label">B. Recovery Strategy</label>
            <select
              className="form-select"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              disabled={isRunning}
            >
              <option value="AUTOMATIC">Automatic Strategy Selection (Rule-based policy)</option>
              <option value="RETRY">Retry (Only failed task)</option>
              <option value="ROLLBACK">Rollback (Revert uncommitted transaction)</option>
              <option value="COMPENSATION">Compensation (Semantic counter-actions)</option>
              <option value="ESCALATION">Escalation (Supervisor intervention)</option>
            </select>
          </div>

          {/* C. Retry Limit */}
          <div className="form-group">
            <label className="form-label">C. Retry Limit</label>
            <select
              className="form-select"
              value={retryLimit}
              onChange={(e) => setRetryLimit(Number(e.target.value))}
              disabled={isRunning}
            >
              <option value={1}>1 Retry Attempt</option>
              <option value={2}>2 Retry Attempts (Standard)</option>
              <option value={3}>3 Retry Attempts</option>
            </select>
          </div>
        </div>

        {/* Strategy Guidance Notice */}
        <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--text-muted)' }}>
          <strong>Policy Note:</strong> {
            strategy === 'AUTOMATIC' 
              ? 'Automatic mode categorizes errors dynamically: Technical → Retry (within limit); Data Errors → Rollback/Reject without retry; Downstream failure with committed milestones → Compensation; Exhausted attempts → Escalation.' 
              : `Manual Override active: System is instructed to enforce '${strategy}'.`
          }
        </div>
      </div>

      {/* Exception Banner if detected */}
      {errorBanner && (
        <div className={`alert-box alert-${errorBanner.category?.toLowerCase() || 'technical'}`}>
          <div className="alert-title">
            <AlertTriangle size={18} />
            <span>{errorBanner.categoryLabel || 'Exception Detected'}: {errorBanner.title}</span>
          </div>
          <div className="alert-desc">
            {errorBanner.explanation}
          </div>
        </div>
      )}

      {/* Workflow Step Diagram Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Process Execution Pipeline</h3>
            <p className="card-subtitle">Real-time status of each workflow step with attempt counts and messages</p>
          </div>
          <div>
            Process State: <span style={{ fontWeight: '700', color: 'var(--accent)' }}>{processState}</span>
          </div>
        </div>

        <WorkflowDiagram tasks={currentTasks} />
      </div>

      {/* State Tracking & Milestones */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Process State &amp; Transaction Ledger</h3>
            <p className="card-subtitle">State transitions, committed business milestones, rollback checkpoints, and compensating actions</p>
          </div>
          {executionSummary && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Final Outcome:</span>
              <StatusBadge status={executionSummary.finalStatus} />
            </div>
          )}
        </div>

        <StateTracker 
          processState={processState}
          committedMilestones={committedMilestones}
          compensationLog={compensationLog}
          rollbackLog={rollbackLog}
        />
      </div>

      {/* Execution Log Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Chronological Execution Log</h3>
            <p className="card-subtitle">Real-time trace generated by backend workflow engine and exception detector</p>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {displayedLogs.length} events logged
          </span>
        </div>

        <ExecutionLog logs={displayedLogs} />
      </div>
    </div>
  );
}
