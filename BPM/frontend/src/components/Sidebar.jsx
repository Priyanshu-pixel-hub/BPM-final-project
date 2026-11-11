import React from 'react';
import { 
  LayoutDashboard, 
  PlayCircle, 
  History, 
  BarChart3, 
  BookOpen, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export function Sidebar({ currentPage, onNavigate, backendOnline }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'simulation', label: 'Run Workflow', icon: PlayCircle },
    { id: 'history', label: 'Recovery History', icon: History },
    { id: 'evaluation', label: 'Evaluation', icon: BarChart3 },
    { id: 'about', label: 'About the Model', icon: BookOpen }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">BPM Recovery Engine</div>
        <div className="sidebar-subtitle">Research Prototype</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <IconComponent size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div>Engine Status:</div>
        <div className="status-indicator">
          {backendOnline ? (
            <>
              <div className="dot-online"></div>
              <span>Backend Connected</span>
            </>
          ) : (
            <>
              <AlertCircle size={14} color="#ef4444" />
              <span style={{ color: '#ef4444' }}>Backend Offline</span>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
