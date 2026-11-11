/**
 * State Manager Service
 * 
 * Tracks process lifecycle states, task execution records, attempts,
 * transactional data checkpoints, and history of state transitions.
 */

export const ProcessState = {
  CREATED: 'CREATED',
  VALIDATING: 'VALIDATING',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  INVENTORY_RESERVED: 'INVENTORY_RESERVED',
  INVOICED: 'INVOICED',
  COMPLETED: 'COMPLETED',
  // Recovery & Error states
  RETRYING: 'RETRYING',
  ROLLING_BACK: 'ROLLING_BACK',
  COMPENSATING: 'COMPENSATING',
  ESCALATED: 'ESCALATED',
  FAILED: 'FAILED'
};

export const TaskStatus = {
  PENDING: 'Pending',
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  RETRYING: 'Retrying',
  ROLLED_BACK: 'Rolled Back',
  COMPENSATED: 'Compensated',
  ESCALATED: 'Escalated',
  SKIPPED: 'Skipped'
};

export class StateManager {
  constructor(workflowId, orderData = {}) {
    this.workflowId = workflowId;
    this.processState = ProcessState.CREATED;
    this.stateHistory = [
      {
        timestamp: new Date().toISOString(),
        from: null,
        to: ProcessState.CREATED,
        reason: 'Workflow initialized'
      }
    ];

    // Business & Transactional data
    this.orderData = { ...orderData };
    this.transactionCheckpoint = null; // Snapshot for rollback
    this.committedMilestones = {
      orderCreated: true,
      orderValidated: false,
      paymentCompleted: false,
      paymentTransactionId: null,
      inventoryReserved: false,
      reservationId: null,
      reservedSku: null,
      reservedQuantity: 0,
      invoiceGenerated: false,
      invoiceNumber: null
    };

    // Task tracking
    this.tasks = {
      place_order: {
        id: 'place_order',
        name: 'Place Order',
        status: TaskStatus.PENDING,
        attempts: 0,
        message: 'Awaiting execution'
      },
      validate_order: {
        id: 'validate_order',
        name: 'Validate Order',
        status: TaskStatus.PENDING,
        attempts: 0,
        message: 'Awaiting execution'
      },
      process_payment: {
        id: 'process_payment',
        name: 'Process Payment',
        status: TaskStatus.PENDING,
        attempts: 0,
        message: 'Awaiting execution'
      },
      reserve_inventory: {
        id: 'reserve_inventory',
        name: 'Reserve Inventory',
        status: TaskStatus.PENDING,
        attempts: 0,
        message: 'Awaiting execution'
      },
      generate_invoice: {
        id: 'generate_invoice',
        name: 'Generate Invoice',
        status: TaskStatus.PENDING,
        attempts: 0,
        message: 'Awaiting execution'
      },
      complete_order: {
        id: 'complete_order',
        name: 'Complete Order',
        status: TaskStatus.PENDING,
        attempts: 0,
        message: 'Awaiting execution'
      }
    };

    // Compensation & Rollback ledger
    this.compensationLog = [];
    this.rollbackLog = [];
  }

  /**
   * Transition process state and record in history.
   */
  transitionTo(newState, reason = '') {
    const previousState = this.processState;
    this.processState = newState;
    this.stateHistory.push({
      timestamp: new Date().toISOString(),
      from: previousState,
      to: newState,
      reason
    });
  }

  /**
   * Checkpoint in-flight transactional state before starting a risky transaction.
   */
  createTransactionCheckpoint(taskId) {
    this.transactionCheckpoint = {
      taskId,
      timestamp: new Date().toISOString(),
      orderSnapshot: JSON.parse(JSON.stringify(this.orderData)),
      milestonesSnapshot: JSON.parse(JSON.stringify(this.committedMilestones))
    };
  }

  /**
   * Roll back uncommitted transactional changes.
   */
  rollbackTransaction(taskId, reason) {
    if (this.transactionCheckpoint) {
      this.orderData = JSON.parse(JSON.stringify(this.transactionCheckpoint.orderSnapshot));
      this.committedMilestones = JSON.parse(JSON.stringify(this.transactionCheckpoint.milestonesSnapshot));
    }
    const rollbackRecord = {
      timestamp: new Date().toISOString(),
      taskId,
      reason,
      restoredState: 'Restored pre-transaction state checkpoint'
    };
    this.rollbackLog.push(rollbackRecord);
    this.updateTask(taskId, TaskStatus.ROLLED_BACK, `Transaction rolled back: ${reason}`);
    this.transitionTo(ProcessState.ROLLING_BACK, `Rollback performed on task ${taskId}: ${reason}`);
    return rollbackRecord;
  }

  /**
   * Execute semantic compensation for previously committed business operations.
   */
  compensateCommittedMilestones(failedTaskId, reason) {
    this.transitionTo(ProcessState.COMPENSATING, `Compensating milestones due to failure in ${failedTaskId}`);
    const compensationActions = [];

    // Compensate Inventory Reservation if already committed
    if (this.committedMilestones.inventoryReserved) {
      const releaseAction = {
        type: 'RELEASE_INVENTORY',
        targetTask: 'reserve_inventory',
        reservationId: this.committedMilestones.reservationId,
        details: `Released reserved stock (${this.committedMilestones.reservedQuantity} units of SKU: ${this.committedMilestones.reservedSku}) back to available inventory.`,
        timestamp: new Date().toISOString()
      };
      this.committedMilestones.inventoryReserved = false;
      this.committedMilestones.reservationId = null;
      this.updateTask('reserve_inventory', TaskStatus.COMPENSATED, 'Compensated: Stock reservation released');
      compensationActions.push(releaseAction);
      this.compensationLog.push(releaseAction);
    }

    // Compensate Payment if already committed
    if (this.committedMilestones.paymentCompleted) {
      const refundAction = {
        type: 'SIMULATED_REFUND',
        targetTask: 'process_payment',
        transactionId: this.committedMilestones.paymentTransactionId,
        details: `Simulated refund triggered for transaction ID ${this.committedMilestones.paymentTransactionId}. Amount marked for credit reversal.`,
        timestamp: new Date().toISOString()
      };
      this.committedMilestones.paymentCompleted = false;
      this.committedMilestones.paymentTransactionId = null;
      this.updateTask('process_payment', TaskStatus.COMPENSATED, 'Compensated: Simulated refund credited');
      compensationActions.push(refundAction);
      this.compensationLog.push(refundAction);
    }

    return compensationActions;
  }

  /**
   * Update task state and execution count.
   */
  updateTask(taskId, status, message = null) {
    if (!this.tasks[taskId]) return;
    this.tasks[taskId].status = status;
    if (message) {
      this.tasks[taskId].message = message;
    }
    if (status === TaskStatus.RUNNING || status === TaskStatus.RETRYING) {
      this.tasks[taskId].attempts += 1;
    }
  }

  /**
   * Mark milestone as committed.
   */
  commitMilestone(milestoneKey, data = {}) {
    this.committedMilestones[milestoneKey] = true;
    Object.assign(this.committedMilestones, data);
  }

  /**
   * Get an immutable snapshot of current state for decision engine and frontend.
   */
  getSnapshot() {
    return {
      workflowId: this.workflowId,
      processState: this.processState,
      tasks: JSON.parse(JSON.stringify(this.tasks)),
      committedMilestones: { ...this.committedMilestones },
      stateHistory: [...this.stateHistory],
      compensationLog: [...this.compensationLog],
      rollbackLog: [...this.rollbackLog]
    };
  }
}
