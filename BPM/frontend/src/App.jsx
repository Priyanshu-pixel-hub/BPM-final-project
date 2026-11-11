import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { WorkflowSimulationPage } from './pages/WorkflowSimulationPage';
import { RecoveryHistoryPage } from './pages/RecoveryHistoryPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { AboutModelPage } from './pages/AboutModelPage';
import { api } from './services/api';

export function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [backendOnline, setBackendOnline] = useState(true);

  useEffect(() => {
    // Initial health check
    api.checkHealth().then(setBackendOnline);

    // Periodic heartbeat every 10 seconds
    const interval = setInterval(() => {
      api.checkHealth().then(setBackendOnline);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const pageHeaders = {
    dashboard: {
      title: 'Research Dashboard',
      subtitle: 'Session metrics and business process workflow overview'
    },
    simulation: {
      title: 'Run Workflow Simulation',
      subtitle: 'Inject failure scenarios, observe classification, and test recovery strategies'
    },
    history: {
      title: 'Recovery History Audit',
      subtitle: 'In-memory logs, state snapshots, and compensation records'
    },
    evaluation: {
      title: 'Model Evaluation & Benchmarking',
      subtitle: 'Empirical comparison between Baseline Policy and Proposed Recovery Model'
    },
    about: {
      title: 'About the Model',
      subtitle: 'Theoretical framework, exception classifications, and system architecture'
    }
  };

  const currentHeader = pageHeaders[currentPage] || pageHeaders.dashboard;

  return (
    <div className="app-container">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        backendOnline={backendOnline} 
      />

      <div className="main-wrapper">
        <header className="top-bar">
          <div className="page-title-wrap">
            <h1>{currentHeader.title}</h1>
            <p>{currentHeader.subtitle}</p>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Research Project: Modeling Exception Handling &amp; Process Recovery
          </div>
        </header>

        <main className="content-area">
          {currentPage === 'dashboard' && <DashboardPage onNavigate={setCurrentPage} />}
          {currentPage === 'simulation' && <WorkflowSimulationPage />}
          {currentPage === 'history' && <RecoveryHistoryPage />}
          {currentPage === 'evaluation' && <EvaluationPage />}
          {currentPage === 'about' && <AboutModelPage />}
        </main>
      </div>
    </div>
  );
}

export default App;
