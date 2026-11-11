import express from 'express';
import { EvaluationService } from '../services/evaluationService.js';

export function createEvaluationRouter() {
  const router = express.Router();

  // Run the repeatable test suite TC1-TC6 comparing Baseline vs Proposed
  router.post('/run', async (req, res) => {
    try {
      const evaluationResult = await EvaluationService.runSuite();
      res.json({ success: true, data: evaluationResult });
    } catch (err) {
      console.error('Error running evaluation suite:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
