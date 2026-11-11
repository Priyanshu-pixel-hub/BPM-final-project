import React, { useRef, useEffect } from 'react';

export function ExecutionLog({ logs = [] }) {
  const terminalRef = useRef(null);

  // Auto-scroll to latest log entry
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  if (!logs || logs.length === 0) {
    return (
      <div className="log-terminal" style={{ minHeight: '140px', justifyContent: 'center', alignItems: 'center', color: '#64748b' }}>
        No execution events recorded. Click "Start Workflow" to begin simulation.
      </div>
    );
  }

  return (
    <div className="log-terminal" ref={terminalRef}>
      {logs.map((entry, idx) => (
        <div key={idx} className="log-row">
          <span className="log-seq">[{entry.seq || idx + 1}]</span>
          <span className="log-time">{entry.timestamp}</span>
          <span className={`log-msg type-${entry.type || 'INFO'}`}>
            {entry.message}
          </span>
        </div>
      ))}
    </div>
  );
}
