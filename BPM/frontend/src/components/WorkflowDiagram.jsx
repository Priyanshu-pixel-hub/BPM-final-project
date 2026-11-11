import React from 'react';
import { StatusBadge } from './StatusBadge';

export function WorkflowDiagram({ tasks = {} }) {
  const taskSequence = [
    { id: 'place_order', name: 'Place Order', number: '01' },
    { id: 'validate_order', name: 'Validate Order', number: '02' },
    { id: 'process_payment', name: 'Process Payment', number: '03' },
    { id: 'reserve_inventory', name: 'Reserve Inventory', number: '04' },
    { id: 'generate_invoice', name: 'Generate Invoice', number: '05' },
    { id: 'complete_order', name: 'Complete Order', number: '06' }
  ];

  return (
    <div className="process-flow">
      {taskSequence.map((step) => {
        const taskState = tasks[step.id] || {
          status: 'Pending',
          attempts: 0,
          message: 'Awaiting execution'
        };

        const isRunning = taskState.status === 'Running' || taskState.status === 'Retrying';
        const isFailed = taskState.status === 'Failed' || taskState.status === 'Escalated';

        let nodeClass = 'process-step-node';
        if (isRunning) nodeClass += ' active-running';
        if (isFailed) nodeClass += ' active-failed';

        return (
          <div key={step.id} className={nodeClass}>
            <div>
              <div className="step-node-header">
                <span className="step-number">{step.number}</span>
                <StatusBadge status={taskState.status} />
              </div>
              <div className="step-name">{step.name}</div>
              <div className="step-attempts">
                Attempts: <strong>{taskState.attempts}</strong>
              </div>
            </div>

            <div className="step-msg" title={taskState.message}>
              {taskState.message || '—'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
