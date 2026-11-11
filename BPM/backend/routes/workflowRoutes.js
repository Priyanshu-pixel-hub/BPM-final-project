import express from 'express';
import { WorkflowEngine } from '../services/workflowEngine.js';

export function createWorkflowRouter(historyStore) {
  const router = express.Router();
  const engine = new WorkflowEngine({ historyStore });

  // Run a new workflow simulation
  router.post('/run', async (req, res) => {
    try {
      const { scenario, strategy, retryLimit, orderData } = req.body;
      const result = await engine.executeWorkflow({
        scenario,
        strategy,
        retryLimit: Number(retryLimit) || 2,
        orderData
      });
      res.json({ success: true, data: result });
    } catch (err) {
      console.error('Error executing workflow:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get full execution history
  router.get('/history', (req, res) => {
    res.json({ success: true, data: historyStore });
  });

  // Get single execution details
  router.get('/history/:id', (req, res) => {
    const item = historyStore.find(h => h.workflowId === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Workflow execution not found' });
    }
    res.json({ success: true, data: item });
  });

  // Reset demonstration data
  router.delete('/history', (req, res) => {
    historyStore.length = 0; // Clear in-place
    res.json({ success: true, message: 'Demonstration data cleared successfully' });
  });

  // Calculate live statistics from actual executions in historyStore
  router.get('/stats', (req, res) => {
    const totalWorkflows = historyStore.length;
    const successful = historyStore.filter(h => h.finalStatus === 'COMPLETED').length;
    const failed = historyStore.filter(h => h.finalStatus !== 'COMPLETED').length;
    const recoveryAttempts = historyStore.reduce((acc, h) => acc + (h.recoveryAttempts || 0), 0);
    const exceptionsHandled = historyStore.filter(h => h.exception !== null).length;

    const byCategory = {
      TECHNICAL: historyStore.filter(h => h.exception?.category === 'TECHNICAL').length,
      DATA_ERROR: historyStore.filter(h => h.exception?.category === 'DATA_ERROR').length,
      BUSINESS_RULE: historyStore.filter(h => h.exception?.category === 'BUSINESS_RULE').length
    };

    const byStrategy = {
      RETRY: historyStore.filter(h => h.selectedStrategy === 'RETRY').length,
      ROLLBACK: historyStore.filter(h => h.selectedStrategy === 'ROLLBACK').length,
      COMPENSATION: historyStore.filter(h => h.selectedStrategy === 'COMPENSATION').length,
      ESCALATION: historyStore.filter(h => h.selectedStrategy === 'ESCALATION').length
    };

    res.json({
      success: true,
      data: {
        totalWorkflows,
        successful,
        failed,
        recoveryAttempts,
        exceptionsHandled,
        byCategory,
        byStrategy,
        recentExecutions: historyStore.slice(0, 5)
      }
    });
  });

  return router;
}
