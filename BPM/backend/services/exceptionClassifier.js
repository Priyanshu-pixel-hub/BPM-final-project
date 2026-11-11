/**
 * Exception Classifier Service
 * 
 * Implements the three formal exception categories:
 * 1. Technical Failures (transient errors, network timeouts, temporary service outages)
 * 2. Data Errors (schema validation, missing required attributes, negative values)
 * 3. Business Rule Violations (inventory stock limits, credit restrictions, policy violations)
 */

export const ExceptionCategory = {
  TECHNICAL: 'TECHNICAL',
  DATA_ERROR: 'DATA_ERROR',
  BUSINESS_RULE: 'BUSINESS_RULE'
};

export class ExceptionClassifier {
  /**
   * Classify a workflow error based on error attributes and task context.
   * 
   * @param {Object} error - Error object with code, message, and details
   * @param {Object} context - Context containing taskName, attempts, completedTasks
   * @returns {Object} Classification metadata
   */
  static classify(error, context = {}) {
    const errorCode = error.code || 'UNKNOWN_ERROR';
    const message = error.message || 'An unspecified workflow error occurred';

    // 1. Data Errors (Deterministic input/validation failures)
    if (
      errorCode === 'INVALID_DATA' ||
      errorCode === 'MISSING_CUSTOMER_INFO' ||
      errorCode === 'INVALID_QUANTITY' ||
      errorCode.startsWith('VALIDATION_')
    ) {
      return {
        category: ExceptionCategory.DATA_ERROR,
        categoryLabel: 'Data Error',
        errorCode,
        severity: 'MEDIUM',
        isTransient: false,
        recoverableByRetry: false,
        recommendedStrategy: 'ROLLBACK',
        explanation: `Deterministic data validation failure: ${message}. Retrying without data correction will produce identical failure. Transactional changes must be rolled back.`
      };
    }

    // 2. Business Rule Violations (Domain policy rejections)
    if (
      errorCode === 'INSUFFICIENT_INVENTORY' ||
      errorCode === 'CREDIT_LIMIT_EXCEEDED' ||
      errorCode === 'POLICY_VIOLATION' ||
      errorCode === 'OUT_OF_STOCK'
    ) {
      const hasPriorMilestones = context.hasCompletedMilestones || false;
      return {
        category: ExceptionCategory.BUSINESS_RULE,
        categoryLabel: 'Business Rule Violation',
        errorCode,
        severity: 'HIGH',
        isTransient: false,
        recoverableByRetry: false,
        recommendedStrategy: hasPriorMilestones ? 'COMPENSATION' : 'ESCALATION',
        explanation: `Business policy constraint violated: ${message}. Workflow cannot proceed automatically without violating business rules.`
      };
    }

    // 3. Technical Failures (Transient connectivity, timeout, service gateway down)
    if (
      errorCode === 'PAYMENT_GATEWAY_TIMEOUT' ||
      errorCode === 'TEMPORARY_SERVICE_UNAVAILABLE' ||
      errorCode === 'INVENTORY_SERVICE_TIMEOUT' ||
      errorCode === 'INVOICE_SERVICE_TIMEOUT' ||
      errorCode === 'NETWORK_TIMEOUT' ||
      errorCode === 'SERVICE_503'
    ) {
      return {
        category: ExceptionCategory.TECHNICAL,
        categoryLabel: 'Technical Failure',
        errorCode,
        severity: 'LOW',
        isTransient: true,
        recoverableByRetry: true,
        recommendedStrategy: 'RETRY',
        explanation: `Transient infrastructure error: ${message}. Service expected to recover; idempotent retry of this specific task is recommended within configured limits.`
      };
    }

    // Default classification for unexpected errors
    return {
      category: ExceptionCategory.TECHNICAL,
      categoryLabel: 'Technical Failure (Generic)',
      errorCode: 'UNHANDLED_EXCEPTION',
      severity: 'HIGH',
      isTransient: false,
      recoverableByRetry: false,
      recommendedStrategy: 'ESCALATION',
      explanation: `Unclassified exception: ${message}. Requires manual operator intervention.`
    };
  }
}
