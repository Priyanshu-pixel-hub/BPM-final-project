/**
 * Frontend API Service
 * Interacts with Node.js Express backend endpoints via Vite proxy.
 */

const API_BASE = '/api';

export const api = {
  // Fetch live stats calculated from actual in-memory workflow runs
  async getStats() {
    const res = await fetch(`${API_BASE}/workflow/stats`);
    if (!res.ok) throw new Error('Failed to fetch workflow stats');
    const json = await res.json();
    return json.data;
  },

  // Execute a workflow simulation run
  async runWorkflow(payload) {
    const res = await fetch(`${API_BASE}/workflow/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to execute workflow');
    const json = await res.json();
    return json.data;
  },

  // Get full execution history
  async getHistory() {
    const res = await fetch(`${API_BASE}/workflow/history`);
    if (!res.ok) throw new Error('Failed to fetch execution history');
    const json = await res.json();
    return json.data;
  },

  // Get single execution details
  async getHistoryItem(id) {
    const res = await fetch(`${API_BASE}/workflow/history/${id}`);
    if (!res.ok) throw new Error('Failed to fetch workflow details');
    const json = await res.json();
    return json.data;
  },

  // Reset in-memory demonstration data
  async resetHistory() {
    const res = await fetch(`${API_BASE}/workflow/history`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to reset demonstration data');
    const json = await res.json();
    return json;
  },

  // Run the benchmark evaluation suite (TC1-TC6)
  async runEvaluation() {
    const res = await fetch(`${API_BASE}/evaluation/run`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to run evaluation suite');
    const json = await res.json();
    return json.data;
  },

  // Check backend health
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) return false;
      const json = await res.json();
      return json.status === 'ONLINE';
    } catch {
      return false;
    }
  }
};
