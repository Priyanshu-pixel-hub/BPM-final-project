/**
 * Recovery Decision Engine
 * 
 * Implements the four core recovery strategies:
 * - RETRY: Re-attempt failed task without repeating completed tasks, up to retryLimit
 * - ROLLBACK: Undo uncommitted in-flight transactional state to pre-transaction snapshot
 * - COMPENSATION: Semantically reverse completed business operations (e.g., release reserved stock, simulated refund)
 * - ESCALATION: Halt automated recovery, preserve process state, flag for human operator intervention
 * 
 * Also implements the Automatic Rule-Based Recovery Policy.
 */

import { ExceptionCategory } from './exceptionClassifier.js';
import { ProcessState, TaskStatus } from './stateManager.js';

export const RecoveryStrategy = {
  AUTOMATIC: 'AUTOMATIC',
  RETRY: 'RETRY',
  ROLLBACK: 'ROLLBACK',
  COMPENSATION: 'COMPENSATION',
  ESCALATION: 'ESCALATION'
};

export class RecoveryEngine {
  /**
   * Decide recovery strategy based on user configuration, exception classification, and process state.
   * 
   * @param {Object} params
   * @param {string} params.configuredStrategy - The strategy requested by user (AUTOMATIC, RETRY, ROLLBACK, COMPENSATION, ESCALATION)
   * @param {Object} params.classification - Result from ExceptionClassifier
   * @param {Object} params.taskInfo - Details of failed task (id, attempts, etc.)
   * @param {Object} params.stateSnapshot - Current process snapshot from StateManager
   * @param {number} params.retryLimit - Max retry count (1 to 3)
   * @returns {Object} Recovery decision { strategy, reason, canExecute, details }
   */
  static decideStrategy({
    configuredStrategy,
    classification,
    taskInfo,
    stateSnapshot,
    retryLimit = 2
  }) {
    const attempts = taskInfo.attempts || 1;
    const hasCommittedMilestones = 
      stateSnapshot.committedMilestones.inventoryReserved ||
      stateSnapshot.committedMilestones.paymentCompleted;

    // If user explicitly forced a manual strategy
    if (configuredStrategy && configuredStrategy !== RecoveryStrategy.AUTOMATIC) {
      if (configuredStrategy === RecoveryStrategy.RETRY) {
        if (attempts > retryLimit) {
          return {
            strategy: RecoveryStrategy.ESCALATION,
            fallbackFrom: RecoveryStrategy.RETRY,
            reason: `Forced Retry strategy exhausted: task reached ${attempts} attempts (limit: ${retryLimit}). Escalating for manual review.`,
            canExecute: false,
            action: 'ESCALATE'
          };
        }
        return {
          strategy: RecoveryStrategy.RETRY,
          reason: `Manual override: Executing RETRY attempt ${attempts} of ${retryLimit}. Only failed task '${taskInfo.name}' will execute.`,
          canExecute: true,
          action: 'RETRY_TASK'
        };
      }

      if (configuredStrategy === RecoveryStrategy.ROLLBACK) {
        return {
          strategy: RecoveryStrategy.ROLLBACK,
          reason: `Manual override: Executing ROLLBACK for uncommitted changes in task '${taskInfo.name}'.`,
          canExecute: true,
          action: 'ROLLBACK_TRANSACTION'
        };
      }

      if (configuredStrategy === RecoveryStrategy.COMPENSATION) {
        return {
          strategy: RecoveryStrategy.COMPENSATION,
          reason: `Manual override: Executing COMPENSATION to reverse completed business actions (e.g. inventory release/simulated refund).`,
          canExecute: true,
          action: 'COMPENSATE_MILESTONES'
        };
      }

      if (configuredStrategy === RecoveryStrategy.ESCALATION) {
        return {
          strategy: RecoveryStrategy.ESCALATION,
          reason: `Manual override: Workflow immediately escalated to supervisor. Automated processing halted.`,
          canExecute: false,
          action: 'ESCALATE'
        };
      }
    }

    // AUTOMATIC RULE-BASED SELECTION POLICY
    // Rule 1: Deterministic Data Errors must not be retried with unchanged input
    if (classification.category === ExceptionCategory.DATA_ERROR) {
      return {
        strategy: RecoveryStrategy.ROLLBACK,
        reason: `Automatic Selection: Data errors are deterministic. Retrying invalid input is ineffective. Initiating rollback to reject bad data and preserve state integrity.`,
        canExecute: true,
        action: 'ROLLBACK_TRANSACTION'
      };
    }

    // Rule 2: Technical transient failures -> Retry if within retryLimit
    if (classification.category === ExceptionCategory.TECHNICAL) {
      if (attempts <= retryLimit) {
        return {
          strategy: RecoveryStrategy.RETRY,
          reason: `Automatic Selection: Transient technical failure detected. Retrying task '${taskInfo.name}' (attempt ${attempts} of max ${retryLimit}). Already completed steps will NOT be repeated.`,
          canExecute: true,
          action: 'RETRY_TASK'
        };
      } else {
        return {
          strategy: RecoveryStrategy.ESCALATION,
          fallbackFrom: RecoveryStrategy.RETRY,
          reason: `Automatic Selection: Retry limit of ${retryLimit} attempts reached without service recovery. Escalating to human operator.`,
          canExecute: false,
          action: 'ESCALATE'
        };
      }
    }

    // Rule 3: Business Rule Violation or Downstream Failure with prior committed business milestones
    if (hasCommittedMilestones) {
      return {
        strategy: RecoveryStrategy.COMPENSATION,
        reason: `Automatic Selection: Downstream failure occurred after business milestones were committed (e.g., inventory reservation). Triggering semantic compensation to restore business consistency.`,
        canExecute: true,
        action: 'COMPENSATE_MILESTONES'
      };
    }

    // Rule 4: Business Rule Violation without prior milestones
    if (classification.category === ExceptionCategory.BUSINESS_RULE) {
      return {
        strategy: RecoveryStrategy.ESCALATION,
        reason: `Automatic Selection: Business rule violation (${classification.errorCode}). Automated recovery cannot override business constraints. Escalating to operator.`,
        canExecute: false,
        action: 'ESCALATE'
      };
    }

    // Default Fallback: Escalation
    return {
      strategy: RecoveryStrategy.ESCALATION,
      reason: `Automatic Selection: Unrecoverable workflow condition. Escalating to operations support.`,
      canExecute: false,
      action: 'ESCALATE'
    };
  }
}
