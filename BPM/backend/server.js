import express from 'express';
import cors from 'cors';
import { createWorkflowRouter } from './routes/workflowRoutes.js';
import { createEvaluationRouter } from './routes/evaluationRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Global in-memory session history store
const inMemoryHistoryStore = [];

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/workflow', createWorkflowRouter(inMemoryHistoryStore));
app.use('/api/evaluation', createEvaluationRouter());

// Root health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    project: 'Modeling Exception Handling and Process Recovery in Business Processes',
    inMemoryRecordsCount: inMemoryHistoryStore.length,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`BPM Recovery Simulation Backend running at http://localhost:${PORT}`);
});
