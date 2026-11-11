/**
 * Workflow Engine Service
 * 
 * Orchestrates business workflow execution, failure injection,
 * exception detection, classification, recovery execution, and event logging.
 */

import { StateManager, ProcessState, TaskStatus } from './stateManager.js';
import { ExceptionClassifier, ExceptionCategory } from './exceptionClassifier.js';
import { RecoveryEngine, RecoveryStrategy } from './recoveryEngine.js';

export const FailureScenario = {
  NONE: 'none',
  TEMP_PAYMENT_FAILURE: 'temp_payment_failure',
  INVALID_DATA: 'invalid_order_data',
  INVENTORY_FAILURE: 'inventory_reservation_failure',
  REPEATED_PAYMENT_FAILURE: 'repeated_payment_failure',
  INVOICE_FAILURE_AFTER_INVENTORY: 'invoice_failure_after_inventory',
  // Additional scenarios for thorough evaluation
  TEMP_INVENTORY_FAILURE: 'temp_inventory_failure',
  MANUAL_ESCALATION_SCENARIO: 'manual_escalation_scenario'
};

export class WorkflowEngine {
  constructor(options = {}) {
    this.historyStore = options.historyStore || [];
  }

  /**
   * Run a workflow simulation with configured scenario, recovery strategy, and retry limit.
   */
  async executeWorkflow({
    workflowId = `WF-${Date.now().toString().slice(-6)}`,
    scenario = FailureScenario.NONE,
    strategy = RecoveryStrategy.AUTOMATIC,
    retryLimit = 2,
    orderData = {
      orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customer: 'Dr. Jane Smith (Research Dept)',
      email: 'jane.smith@university.edu',
      items: [{ sku: 'SKU-402', name: 'Microcontroller Lab Kit', qty: 2, price: 74.50 }],
      total: 149.00
    }
  }) {
    const stateManager = new StateManager(workflowId, orderData);
    const logs = [];
    let logCounter = 1;

    const addLog = (message, type = 'INFO', metadata = {}) => {
      const entry = {
        seq: logCounter++,
        timestamp: new Date().toLocaleTimeString(),
        message,
        type,
        metadata
      };
      logs.push(entry);
      return entry;
    };

    addLog(`Workflow ${workflowId} initialized for Order ${orderData.orderId || 'NEW'}. Scenario: [${scenario}], Strategy: [${strategy}], Retry Limit: [${retryLimit}].`, 'INFO');

    const tasksOrder = [
      'place_order',
      'validate_order',
      'process_payment',
      'reserve_inventory',
      'generate_invoice',
      'complete_order'
    ];

    let currentTaskIdx = 0;
    let finalOutcome = 'SUCCESS';
    let exceptionEncountered = null;
    let strategyChosen = null;
    let recoveryAttemptCount = 0;
    let unnecessaryRepeats = 0;
    let completedTasksRepeated = 0;

    // Execution loop
    while (currentTaskIdx < tasksOrder.length) {
      const taskId = tasksOrder[currentTaskIdx];
      const task = stateManager.tasks[taskId];

      // Track checkpoint before transactional step
      stateManager.createTransactionCheckpoint(taskId);
      stateManager.updateTask(taskId, TaskStatus.RUNNING, `Task executing (Attempt ${task.attempts + 1})...`);
      
      addLog(`Executing task '${task.name}' (Attempt ${task.attempts})...`, 'INFO', { taskId, attempts: task.attempts });

      // Determine simulated error injection for current task
      const simulatedError = this._getSimulatedError(taskId, scenario, task.attempts, orderData);

      if (simulatedError) {
        addLog(`[EXCEPTION DETECTED] in task '${task.name}': ${simulatedError.message} (Code: ${simulatedError.code})`, 'ERROR', { taskId, error: simulatedError });
        
        stateManager.updateTask(taskId, TaskStatus.FAILED, `Execution failed: ${simulatedError.message}`);
        stateManager.transitionTo(ProcessState.FAILED, `Failure in ${task.name}`);

        // 1. Exception Classification
        const classification = ExceptionClassifier.classify(simulatedError, {
          taskName: task.name,
          attempts: task.attempts,
          hasCompletedMilestones: 
            stateManager.committedMilestones.inventoryReserved ||
            stateManager.committedMilestones.paymentCompleted
        });

        exceptionEncountered = classification;
        addLog(`[CLASSIFIER] Exception categorized as ${classification.categoryLabel} [${classification.category}]. Reason: ${classification.explanation}`, 'WARN', { classification });

        // 2. Recovery Strategy Decision
        const recoveryDecision = RecoveryEngine.decideStrategy({
          configuredStrategy: strategy,
          classification,
          taskInfo: task,
          stateSnapshot: stateManager.getSnapshot(),
          retryLimit
        });

        strategyChosen = recoveryDecision.strategy;
        recoveryAttemptCount++;

        addLog(`[RECOVERY ENGINE] Strategy selected: ${recoveryDecision.strategy}. Policy rationale: ${recoveryDecision.reason}`, 'RECOVERY', { recoveryDecision });

        // 3. Recovery Strategy Execution
        if (recoveryDecision.strategy === RecoveryStrategy.RETRY && recoveryDecision.canExecute) {
          stateManager.updateTask(taskId, TaskStatus.RETRYING, `Retrying task...`);
          stateManager.transitionTo(ProcessState.RETRYING, `Retrying task ${task.name}`);
          addLog(`[RETRY] Resuming from failed task '${task.name}'. Previously completed tasks are NOT re-executed.`, 'RECOVERY', { taskId });
          // Loop continues at currentTaskIdx; attempts count has incremented
          continue;
        } else if (recoveryDecision.strategy === RecoveryStrategy.ROLLBACK) {
          const rollbackRecord = stateManager.rollbackTransaction(taskId, classification.explanation);
          addLog(`[ROLLBACK] Reverted uncommitted changes in task '${task.name}'. State restored to pre-transaction checkpoint.`, 'RECOVERY', { rollbackRecord });
          finalOutcome = 'ROLLED_BACK';
          break;
        } else if (recoveryDecision.strategy === RecoveryStrategy.COMPENSATION) {
          const compensationActions = stateManager.compensateCommittedMilestones(taskId, classification.explanation);
          compensationActions.forEach(action => {
            addLog(`[COMPENSATION] Executed counter-action: ${action.details}`, 'RECOVERY', { action });
          });
          finalOutcome = 'COMPENSATED';
          break;
        } else if (recoveryDecision.strategy === RecoveryStrategy.ESCALATION || !recoveryDecision.canExecute) {
          stateManager.updateTask(taskId, TaskStatus.ESCALATED, `Escalated: ${recoveryDecision.reason}`);
          stateManager.transitionTo(ProcessState.ESCALATED, `Workflow escalated to supervisor`);
          addLog(`[ESCALATION] Automated recovery halted. Process state preserved for manual intervention. Reason: ${recoveryDecision.reason}`, 'WARN', { recoveryDecision });
          finalOutcome = 'ESCALATED';
          break;
        } else {
          finalOutcome = 'FAILED';
          break;
        }
      }

      // If no error, task succeeds
      this._commitTaskSuccess(taskId, stateManager);
      addLog(`Task '${task.name}' completed successfully.`, 'SUCCESS', { taskId });
      currentTaskIdx++;
    }

    // Determine final workflow state
    if (currentTaskIdx >= tasksOrder.length) {
      stateManager.transitionTo(ProcessState.COMPLETED, 'All workflow tasks completed successfully');
      addLog(`Workflow ${workflowId} completed successfully. All business milestones confirmed.`, 'SUCCESS');
      finalOutcome = 'COMPLETED';
    } else if (finalOutcome === 'SUCCESS') {
      finalOutcome = 'FAILED';
    }

    const completedTasksCount = Object.values(stateManager.tasks).filter(
      t => t.status === TaskStatus.COMPLETED
    ).length;

    const totalTasksExecuted = Object.values(stateManager.tasks).reduce(
      (sum, t) => sum + t.attempts, 0
    );

    const executionSummary = {
      workflowId,
      timestamp: new Date().toISOString(),
      orderId: orderData.orderId,
      scenario,
      configuredStrategy: strategy,
      selectedStrategy: strategyChosen || 'NONE',
      exception: exceptionEncountered ? {
        category: exceptionEncountered.category,
        categoryLabel: exceptionEncountered.categoryLabel,
        errorCode: exceptionEncountered.errorCode,
        explanation: exceptionEncountered.explanation
      } : null,
      retryLimit,
      recoveryAttempts: recoveryAttemptCount,
      totalTasksExecuted,
      completedTasksCount,
      unnecessaryRepeats,
      completedTasksRepeated,
      finalStatus: finalOutcome,
      processState: stateManager.processState,
      tasks: stateManager.tasks,
      committedMilestones: stateManager.committedMilestones,
      stateHistory: stateManager.stateHistory,
      compensationLog: stateManager.compensationLog,
      rollbackLog: stateManager.rollbackLog,
      logs
    };

    // Store execution in session history
    this.historyStore.unshift(executionSummary);

    return executionSummary;
  }

  /**
   * Helper to commit milestone data on successful task execution.
   */
  _commitTaskSuccess(taskId, stateManager) {
    switch (taskId) {
      case 'place_order':
        stateManager.commitMilestone('orderCreated', { orderCreatedTime: new Date().toISOString() });
        stateManager.updateTask(taskId, TaskStatus.COMPLETED, 'Order draft initialized');
        stateManager.transitionTo(ProcessState.VALIDATING, 'Order placed, proceeding to validation');
        break;
      case 'validate_order':
        stateManager.commitMilestone('orderValidated', { validatedTime: new Date().toISOString() });
        stateManager.updateTask(taskId, TaskStatus.COMPLETED, 'Order parameters verified');
        stateManager.transitionTo(ProcessState.PAYMENT_PENDING, 'Validation passed, proceeding to payment');
        break;
      case 'process_payment':
        stateManager.commitMilestone('paymentCompleted', {
          paymentTransactionId: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
          paymentAmount: 149.00
        });
        stateManager.updateTask(taskId, TaskStatus.COMPLETED, 'Payment authorized & debited ($149.00)');
        stateManager.transitionTo(ProcessState.INVENTORY_RESERVED, 'Payment authorized, reserving stock');
        break;
      case 'reserve_inventory':
        stateManager.commitMilestone('inventoryReserved', {
          reservationId: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
          reservedSku: 'SKU-402',
          reservedQuantity: 2
        });
        stateManager.updateTask(taskId, TaskStatus.COMPLETED, 'Stock allocated (SKU-402, Qty: 2)');
        stateManager.transitionTo(ProcessState.INVOICED, 'Stock reserved, generating invoice');
        break;
      case 'generate_invoice':
        stateManager.commitMilestone('invoiceGenerated', {
          invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
        });
        stateManager.updateTask(taskId, TaskStatus.COMPLETED, 'Tax invoice generated and archived');
        stateManager.transitionTo(ProcessState.COMPLETED, 'Invoice ready, completing order');
        break;
      case 'complete_order':
        stateManager.updateTask(taskId, TaskStatus.COMPLETED, 'Fulfillment closed, confirmation dispatched');
        break;
    }
  }

  /**
   * Simulated error injection logic based on chosen scenario.
   */
  _getSimulatedError(taskId, scenario, attempts, orderData) {
    if (scenario === FailureScenario.NONE) return null;

    // 1. Temporary Payment Failure (Succeeds on attempt >= 2)
    if (scenario === FailureScenario.TEMP_PAYMENT_FAILURE) {
      if (taskId === 'process_payment' && attempts === 1) {
        return {
          code: 'PAYMENT_GATEWAY_TIMEOUT',
          message: 'Payment gateway connection timed out (HTTP 504 Gateway Timeout). Endpoint response exceeded 3000ms threshold.'
        };
      }
    }

    // 2. Invalid Order Data (Deterministic Data Error during validation)
    if (scenario === FailureScenario.INVALID_DATA) {
      if (taskId === 'validate_order') {
        return {
          code: 'INVALID_DATA',
          message: 'Validation failed: Customer email is malformed or missing, and item quantity (-2) violates non-negative constraint.'
        };
      }
    }

    // 3. Inventory Reservation Failure (Business Rule Violation: Out of Stock)
    if (scenario === FailureScenario.INVENTORY_FAILURE) {
      if (taskId === 'reserve_inventory') {
        return {
          code: 'INSUFFICIENT_INVENTORY',
          message: 'Warehouse stock depleted: Requested SKU-402 has 0 units available in central fulfillment center.'
        };
      }
    }

    // 4. Repeated Payment Failure (Fails continuously regardless of attempt)
    if (scenario === FailureScenario.REPEATED_PAYMENT_FAILURE) {
      if (taskId === 'process_payment') {
        return {
          code: 'PAYMENT_GATEWAY_TIMEOUT',
          message: `Persistent payment processor failure: Host unreachable (Attempt ${attempts}). Gateway rejected transaction.`
        };
      }
    }

    // 5. Invoice Generation Failure After Inventory Reservation (Requires Compensation)
    if (scenario === FailureScenario.INVOICE_FAILURE_AFTER_INVENTORY) {
      if (taskId === 'generate_invoice') {
        return {
          code: 'INVOICE_SERVICE_TIMEOUT',
          message: 'Fiscal invoicing service unavailable: Tax calculation engine connection timed out after inventory committed.'
        };
      }
    }

    // 6. Temporary Inventory Service Failure (For Evaluation TC5)
    if (scenario === FailureScenario.TEMP_INVENTORY_FAILURE) {
      if (taskId === 'reserve_inventory' && attempts === 1) {
        return {
          code: 'INVENTORY_SERVICE_TIMEOUT',
          message: 'Temporary warehouse database lock: Inventory lock acquisition timed out (Attempt 1).'
        };
      }
    }

    // 7. Manual Escalation Scenario (For Evaluation TC6)
    if (scenario === FailureScenario.MANUAL_ESCALATION_SCENARIO) {
      if (taskId === 'validate_order') {
        return {
          code: 'POLICY_VIOLATION',
          message: 'Risk management policy alert: Order flagged for high-risk manual compliance screening.'
        };
      }
    }

    return null;
  }
}
