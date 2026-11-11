import React from 'react';

export function StatusBadge({ status }) {
  const norm = (status || 'Pending').toLowerCase().replace(/\s+/g, '-');
  
  const classMap = {
    'pending': 'badge-pending',
    'running': 'badge-running',
    'completed': 'badge-completed',
    'failed': 'badge-failed',
    'retrying': 'badge-retrying',
    'rolled-back': 'badge-rolled-back',
    'compensated': 'badge-compensated',
    'escalated': 'badge-escalated',
    'skipped': 'badge-skipped'
  };

  const badgeClass = classMap[norm] || 'badge-pending';

  return (
    <span className={`badge ${badgeClass}`}>
      {status || 'Pending'}
    </span>
  );
}
