import React from 'react';

export function StateTracker({ processState = 'CREATED', committedMilestones = {}, compensationLog = [], rollbackLog = [] }) {
  const normalStates = [
    'CREATED',
    'VALIDATING',
    'PAYMENT_PENDING',
    'INVENTORY_RESERVED',
    'INVOICED',
    'COMPLETED'
  ];

  const isAbnormal = ['RETRYING', 'ROLLING_BACK', 'COMPENSATING', 'ESCALATED', 'FAILED'].includes(processState);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
          Process Lifecycle State Flow
        </div>
        <div className="state-path">
          {normalStates.map((st, index) => {
            const isActive = processState === st;
            return (
              <React.Fragment key={st}>
                <span className={`state-crumb ${isActive ? 'active' : ''}`}>
                  {st}
                </span>
                {index < normalStates.length - 1 && <span className="state-arrow">→</span>}
              </React.Fragment>
            );
          })}

          {isAbnormal && (
            <>
              <span className="state-arrow">⚡</span>
              <span className="state-crumb active" style={{ backgroundColor: '#dc2626' }}>
                {processState}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Committed Milestones Ledger */}
      <div style={{ background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px' }}>
          Committed Business Milestones (State Persistence):
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '12px' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Order Validated: </span>
            <strong>{committedMilestones?.orderValidated ? 'Yes' : 'No'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Payment Debited: </span>
            <strong>{committedMilestones?.paymentCompleted ? `Yes (${committedMilestones.paymentTransactionId || 'TXN'})` : 'No'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Stock Reserved: </span>
            <strong>{committedMilestones?.inventoryReserved ? `Yes (${committedMilestones.reservationId || 'RES'})` : 'No'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Invoice Issued: </span>
            <strong>{committedMilestones?.invoiceGenerated ? `Yes (${committedMilestones.invoiceNumber || 'INV'})` : 'No'}</strong>
          </div>
        </div>

        {/* Semantic Compensation records if any */}
        {compensationLog && compensationLog.length > 0 && (
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border-medium)' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#4338ca' }}>
              Semantic Compensating Actions Recorded:
            </span>
            <ul style={{ marginTop: '4px', paddingLeft: '18px', fontSize: '12px', color: 'var(--text-body)' }}>
              {compensationLog.map((act, i) => (
                <li key={i}>{act.details}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Transactional Rollback records if any */}
        {rollbackLog && rollbackLog.length > 0 && (
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border-medium)' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#7c3aed' }}>
              Transactional Rollbacks Recorded:
            </span>
            <ul style={{ marginTop: '4px', paddingLeft: '18px', fontSize: '12px', color: 'var(--text-body)' }}>
              {rollbackLog.map((rb, i) => (
                <li key={i}>{rb.reason} ({rb.restoredState})</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
