# Modeling Exception Handling and Process Recovery in Business Processes

A rule-based exception-handling and process-recovery model, demonstrated on an **order-processing workflow**. The system runs a sequence of business tasks, detects and classifies exceptions, selects a recovery strategy (retry, rollback, compensation, or escalation), and records the resulting process state.

The project has a **Node.js + Express** backend (the workflow/recovery engine) and a **React + Vite** frontend (a simulator and dashboard).

> **Scope note:** The order workflow is a case study. This prototype is **not** a configurable engine for arbitrary business processes, and business effects (payments, inventory) are simulated in application state. It is not connected to a real payment gateway or warehouse system.

---

## Table of Contents

1. [Overview](#overview)
2. [Objectives](#objectives)
3. [Order-Processing Workflow](#order-processing-workflow)
4. [Exception Classification](#exception-classification)
5. [Recovery Strategies](#recovery-strategies)
6. [Recovery Decision Policy](#recovery-decision-policy)
7. [Architecture](#architecture)
8. [Project Structure](#project-structure)
9. [Getting Started](#getting-started)
10. [Using the Application](#using-the-application)
11. [API Reference](#api-reference)
12. [Failure Scenarios and Evaluation](#failure-scenarios-and-evaluation)
13. [Results](#results)
14. [Known Limitations](#known-limitations)
15. [Future Work](#future-work)
16. [Tech Stack](#tech-stack)
17. [References](#references)
18. [Authors](#authors)

---

## Overview

Business processes can be interrupted by technical failures, invalid input, and business-rule violations. Treating every failure the same way wastes resources (repeating tasks that cannot succeed), re-executes tasks that already completed, and can leave business effects such as payments and inventory reservations unresolved.

This project models a structured alternative. It classifies each exception, chooses a recovery action based on the exception type and the current process state, and resumes from the failed task rather than restarting the whole workflow.

The method follows five stages:

```
Execute workflow
      ↓
Detect exception
      ↓
Classify: Technical / Data / Business Rule
      ↓
Select recovery strategy
      ↓
Retry / Rollback / Compensate / Escalate
      ↓
Verify and record process state
```

## Objectives

- Classify exceptions into technical failures, data errors, and business-rule violations.
- Select an appropriate recovery strategy from retry, rollback, compensation, and escalation.
- Maintain checkpoints and committed business milestones to support recovery.
- Avoid unnecessary repetition of previously completed tasks.
- Evaluate the prototype using predefined failure scenarios.

## Order-Processing Workflow

The prototype models six sequential tasks:

| #   | Task              | Description                                         |
| --- | ----------------- | --------------------------------------------------- |
| 1   | Place Order       | Order is received                                   |
| 2   | Validate Order    | Customer and quantity data are checked              |
| 3   | Process Payment   | Payment is taken (milestone: _payment completed_)   |
| 4   | Reserve Inventory | Stock is reserved (milestone: _inventory reserved_) |
| 5   | Generate Invoice  | Invoice is produced                                 |
| 6   | Complete Order    | Order is finalized                                  |

A checkpoint is maintained before each task. The engine tracks task status and committed business milestones (payment completion, inventory reservation), and failure scenarios are injected at selected tasks to test the recovery logic.

## Exception Classification

| Category          | Meaning                                  | Example error codes                                                                                                                                  | Recommended action                                                 |
| ----------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Technical**     | Transient service or network failure     | `PAYMENT_GATEWAY_TIMEOUT`, `INVENTORY_SERVICE_TIMEOUT`, `INVOICE_SERVICE_TIMEOUT`, `NETWORK_TIMEOUT`, `SERVICE_503`, `TEMPORARY_SERVICE_UNAVAILABLE` | Retry                                                              |
| **Data error**    | Invalid or missing input (deterministic) | `INVALID_DATA`, `MISSING_CUSTOMER_INFO`, `INVALID_QUANTITY`, `VALIDATION_*`                                                                          | Rollback                                                           |
| **Business rule** | Violation of a business constraint       | `INSUFFICIENT_INVENTORY`, `OUT_OF_STOCK`, `CREDIT_LIMIT_EXCEEDED`, `POLICY_VIOLATION`                                                                | Compensation if prior effects were committed, otherwise escalation |

Unrecognized error codes are classified as a generic technical failure and escalated for manual review.

## Recovery Strategies

- **Retry:** Re-execute the failed task when the failure is transient. A retry limit (1–3, default 2) prevents infinite repetition. The workflow resumes at the failed task, not from the start.
- **Rollback:** Restore the checkpoint state for the current task or transaction. Intended for invalid data or uncommitted changes. It does not restart the whole workflow.
- **Compensation:** Run corrective business actions to offset effects that were already committed (for example, releasing reserved inventory or issuing a simulated refund). Compensation does not erase the original action.
- **Escalation:** Stop automated recovery and preserve process information for human intervention when the failure cannot be safely resolved automatically.

## Recovery Decision Policy

The recovery engine uses the exception category, retry count, and committed milestones.

**Intended policy:**

1. Classify the exception as technical, data, or business-rule.
2. Data exception → **ROLLBACK**.
3. Technical exception and retries within limit → **RETRY**.
4. Committed effects require reversal → **COMPENSATION**.
5. Otherwise → **ESCALATION**.
6. Execute the selected strategy and record the outcome.

The Recovery Strategy dropdown in the UI also allows a **manual override** (force Retry, Rollback, Compensation, or Escalation) instead of the default **Automatic** mode. A forced Retry that exceeds the limit falls back to Escalation.

> The current code does not fully follow the intended ordering for exhausted retries versus compensation. See [Known Limitations](#known-limitations).

## Architecture

### Backend (`backend/`)

| Module                                              | Responsibility                                                                                       |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Workflow Engine** (`workflowEngine.js`)           | Executes the six tasks, injects test failures, coordinates task transitions                          |
| **Exception Classifier** (`exceptionClassifier.js`) | Maps error codes to categories and recommended actions                                               |
| **Recovery Engine** (`recoveryEngine.js`)           | Applies rule-based strategy selection and retry limits                                               |
| **State Manager** (`stateManager.js`)               | Stores task states, checkpoints, committed milestones, state history, and rollback/compensation logs |
| **Evaluation Service** (`evaluationService.js`)     | Runs the six predefined test cases and aggregates metrics                                            |

Execution history is held in an **in-memory store**, so it is cleared when the server restarts.

### Frontend (`frontend/`)

React + Vite single-page app with five pages: Dashboard, Run Workflow, Recovery History, Evaluation, and About the Model. In development, Vite proxies `/api` requests to the backend on port 3001.

## Project Structure

```
BPM/
├── package.json                  # Root scripts (install, start backend/frontend)
├── backend/
│   ├── server.js                 # Express entry point (port 3001)
│   ├── package.json
│   ├── routes/
│   │   ├── workflowRoutes.js     # Run workflows, history, stats
│   │   └── evaluationRoutes.js   # Run the TC1–TC6 evaluation suite
│   └── services/
│       ├── workflowEngine.js
│       ├── exceptionClassifier.js
│       ├── recoveryEngine.js
│       ├── stateManager.js
│       └── evaluationService.js
└── frontend/
    ├── index.html
    ├── vite.config.js            # Dev server on 5173, proxies /api → :3001
    ├── package.json
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── styles.css
        ├── services/api.js       # Fetch wrapper for backend endpoints
        ├── components/           # Sidebar, WorkflowDiagram, StateTracker,
        │                         # ExecutionLog, StatusBadge
        └── pages/                # Dashboard, WorkflowSimulation,
                                  # RecoveryHistory, Evaluation, AboutModel
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (a recent LTS version; the project uses ES modules and Vite 8, so Node 20+ is recommended)
- npm

### Installation

From the `BPM/` root:

```bash
npm run install:all
```

This installs dependencies for both `backend/` and `frontend/`.

### Run the backend

```bash
npm run start:backend
```

The API starts at **http://localhost:3001**. You can change the port with the `PORT` environment variable. For auto-reload during development:

```bash
cd backend
npm run dev
```

### Run the frontend

In a second terminal:

```bash
npm run start:frontend
```

Open **http://localhost:5173**.

### Verify the backend

```bash
curl http://localhost:3001/api/health
```

Expected: a JSON response with `"status": "ONLINE"`.

### Production build (frontend)

```bash
cd frontend
npm run build
npm run preview
```

## Using the Application

| Page                 | What it does                                                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dashboard**        | Session metrics (total runs, successes, failures, recovery attempts) and a workflow overview                                                                    |
| **Run Workflow**     | Choose a failure scenario, recovery strategy, and retry limit; run the workflow and watch the task states, classification, strategy decision, and execution log |
| **Recovery History** | Audit of in-memory runs, state snapshots, and rollback/compensation records. Includes a reset option                                                            |
| **Evaluation**       | Runs the TC1–TC6 suite and shows the comparison of the baseline and proposed models                                                                             |
| **About the Model**  | Framework, exception categories, and architecture summary                                                                                                       |

A typical first session: open **Run Workflow**, pick _Temporary payment failure_ with _Automatic_ strategy, and observe the payment task fail once, get classified as technical, and be retried successfully without re-running earlier tasks.

## API Reference

Base URL: `http://localhost:3001/api`

| Method   | Endpoint                | Description                                        |
| -------- | ----------------------- | -------------------------------------------------- |
| `GET`    | `/health`               | Health check and in-memory record count            |
| `POST`   | `/workflow/run`         | Execute a workflow simulation                      |
| `GET`    | `/workflow/history`     | List all executions                                |
| `GET`    | `/workflow/history/:id` | Get one execution by `workflowId`                  |
| `DELETE` | `/workflow/history`     | Clear in-memory history                            |
| `GET`    | `/workflow/stats`       | Live statistics (totals, by category, by strategy) |
| `POST`   | `/evaluation/run`       | Run the TC1–TC6 evaluation suite                   |

### `POST /workflow/run`

Request body:

```json
{
  "scenario": "temp_payment_failure",
  "strategy": "AUTOMATIC",
  "retryLimit": 2,
  "orderData": {}
}
```

- `scenario`: one of the values listed in [Failure Scenarios](#failure-scenarios-and-evaluation).
- `strategy`: `AUTOMATIC`, `RETRY`, `ROLLBACK`, `COMPENSATION`, or `ESCALATION`.
- `retryLimit`: number, defaults to `2`.
- `orderData`: optional order details.

Example:

```bash
curl -X POST http://localhost:3001/api/workflow/run \
  -H "Content-Type: application/json" \
  -d '{"scenario":"temp_payment_failure","strategy":"AUTOMATIC","retryLimit":2}'
```

Responses use the shape `{ "success": true, "data": ... }`, or `{ "success": false, "error": "..." }` on failure.

## Failure Scenarios and Evaluation

Scenario identifiers accepted by the engine:

| Scenario ID                       | Injected failure                                              |
| --------------------------------- | ------------------------------------------------------------- |
| `none`                            | No failure (happy path)                                       |
| `temp_payment_failure`            | Payment gateway timeout on attempt 1, succeeds afterwards     |
| `invalid_order_data`              | Data validation failure at _Validate Order_                   |
| `inventory_reservation_failure`   | Insufficient inventory (business rule) at _Reserve Inventory_ |
| `repeated_payment_failure`        | Payment fails on every attempt                                |
| `invoice_failure_after_inventory` | Invoice service timeout after inventory was reserved          |
| `temp_inventory_failure`          | Inventory service timeout on attempt 1, succeeds afterwards   |
| `manual_escalation_scenario`      | Policy violation at _Validate Order_ requiring manual review  |

The evaluation suite runs six test cases using automatic recovery with a retry limit of two:

| ID  | Scenario                                                  |
| --- | --------------------------------------------------------- |
| TC1 | Temporary payment failure, followed by recovery           |
| TC2 | Invalid order data during validation                      |
| TC3 | Invoice failure after inventory reservation               |
| TC4 | Repeated payment failure that reaches the retry limit     |
| TC5 | Temporary inventory-service failure, followed by recovery |
| TC6 | Business-policy violation requiring manual escalation     |

## Results

### Observed outcomes (one execution of the current evaluation code)

| ID  | Exception                         | Final status | State check      |
| --- | --------------------------------- | ------------ | ---------------- |
| TC1 | Temporary payment failure         | COMPLETED    | Consistent       |
| TC2 | Invalid order data                | ROLLED BACK  | Consistent       |
| TC3 | Invoice failure after reservation | ESCALATED    | **Inconsistent** |
| TC4 | Repeated payment failure          | ESCALATED    | Consistent       |
| TC5 | Temporary inventory failure       | COMPLETED    | Consistent       |
| TC6 | Policy violation                  | ESCALATED    | Consistent       |

Two workflows completed, one was rolled back, and three were escalated. Five of six final states (83%) were marked consistent.

**TC3 is an important limitation.** The technical exception reaches retry exhaustion and is escalated, but the previously committed inventory reservation is not compensated by the current automatic policy.

### Comparative simulation (illustrative)

| Metric                   | Baseline      | Proposed      | Change          |
| ------------------------ | ------------- | ------------- | --------------- |
| Average recovery time    | 1,420 ms      | 380 ms        | 73.2% reduction |
| Task re-execution count  | 4.2 / failure | 0.8 / failure | 80.9% reduction |
| Workflow completion rate | 81.5%         | 97.2%         | +15.7 pts       |
| State consistency rate   | 68.0%         | 100.0%        | —               |

**Please read these figures with care.** They come from a simulation, and the baseline is a predefined policy rather than a separately executed engine. They are preliminary functional observations, not statistically reliable performance claims. See the next section.

## Known Limitations

- The baseline is hard-coded in the evaluation service and is not run by a separate baseline engine.
- Execution duration for the proposed model includes a random addition, so it is not a stable benchmark.
- The repeated-task metric is set to zero rather than derived from execution traces.
- In TC3, retry exhaustion leads to escalation _before_ checking whether committed milestones require compensation.
- The retry-attempt counter may be incremented at more than one task-state transition, so retry counts should be verified against the actual execution trace.
- Business effects are simulated; there is no real payment or warehouse integration.
- History is stored in memory only and is lost on server restart.
- The workflow is fixed to the six-task order process and is not user-configurable.

## Future Work

- Correct retry counting and the ordering of recovery-policy checks (compensate after retry exhaustion when committed effects remain).
- Implement and execute a real baseline workflow engine.
- Derive all metrics directly from execution logs.
- Remove random timing adjustments and repeat tests across multiple runs.
- Extend the framework to configurable workflows beyond the order-processing case study.

## Tech Stack

- **Backend:** Node.js, Express 4, CORS (ES modules)
- **Frontend:** React 19, Vite, Recharts, Lucide React
- **Storage:** In-memory (no database)

## References

1. N. Russell, W. M. P. van der Aalst, and A. H. M. ter Hofstede, "Workflow Exception Patterns," in _Business Process Management_, Lecture Notes in Computer Science, vol. 4001, pp. 288–302, 2006. doi: 10.1007/11767138_20.
2. P. Antunes, "BPM and Exception Handling: Focus on Organizational Resilience," 2011. doi: 10.1109/TSMCC.2010.2062504.

## Authors

Department of Information Technology, Indian Institute of Information Technology Allahabad, India

| Name              | Roll No.   |
| ----------------- | ---------- |
| Praneel Gupta     | IIB2024029 |
| Thatikonda Vikas  | IIB2024036 |
| Priyanshu Shekhar | IIB2024037 |
