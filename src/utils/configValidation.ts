import { ConfigScope, ScopeType, ConfigStatus, ScreenConfig } from '@/types';

/**
 * Validates a config scope based on scope type
 */
export interface ScopeValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateScope(scope: ConfigScope): ScopeValidationResult {
  const errors: string[] = [];

  switch (scope.type) {
    case 'PRODUCT':
      if (!scope.productCode) {
        errors.push('Product code is required for PRODUCT scope');
      }
      if (scope.partnerCode) {
        errors.push('Partner code must not be provided for PRODUCT scope');
      }
      if (scope.branchCode) {
        errors.push('Branch code must not be provided for PRODUCT scope');
      }
      break;

    case 'PARTNER':
      if (!scope.productCode) {
        errors.push('Product code is required for PARTNER scope');
      }
      if (!scope.partnerCode) {
        errors.push('Partner code is required for PARTNER scope');
      }
      if (scope.branchCode) {
        errors.push('Branch code must not be provided for PARTNER scope');
      }
      break;

    case 'BRANCH':
      if (!scope.productCode) {
        errors.push('Product code is required for BRANCH scope');
      }
      if (!scope.partnerCode) {
        errors.push('Partner code is required for BRANCH scope');
      }
      if (!scope.branchCode) {
        errors.push('Branch code is required for BRANCH scope');
      }
      break;

    default:
      errors.push(`Invalid scope type: ${(scope as any).type}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates if activation is allowed (checks for multiple ACTIVE configs)
 */
export interface ActivationValidationResult {
  canActivate: boolean;
  errors: string[];
  warnings: string[];
  impact?: {
    affectedBranches?: number;
    message: string;
  };
}

export function validateActivation(
  config: ScreenConfig,
  existingConfigs: ScreenConfig[]
): ActivationValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Find other ACTIVE configs with the same screen + scope
  const conflictingConfigs = existingConfigs.filter(
    (c) =>
      c.configId !== config.configId &&
      c.screenId === config.screenId &&
      c.status === 'ACTIVE' &&
      c.scope.type === config.scope.type &&
      c.scope.productCode === config.scope.productCode &&
      c.scope.partnerCode === config.scope.partnerCode &&
      c.scope.branchCode === config.scope.branchCode
  );

  if (conflictingConfigs.length > 0) {
    errors.push(
      `Cannot activate: ${conflictingConfigs.length} other ACTIVE configuration(s) exist for the same screen and scope`
    );
  }

  // For BRANCH scope, warn about impact
  if (config.scope.type === 'BRANCH') {
    warnings.push(
      `This configuration will override PARTNER/PRODUCT configurations for branch ${config.scope.branchCode}`
    );
  } else if (config.scope.type === 'PARTNER') {
    // Count branches that would be affected
    const affectedBranches = existingConfigs.filter(
      (c) =>
        c.scope.type === 'BRANCH' &&
        c.scope.productCode === config.scope.productCode &&
        c.scope.partnerCode === config.scope.partnerCode &&
        c.status === 'ACTIVE'
    ).length;

    if (affectedBranches > 0) {
      warnings.push(
        `This configuration will serve as fallback for ${affectedBranches} branch(es) that don't have BRANCH-level overrides`
      );
    }
  }

  return {
    canActivate: errors.length === 0,
    errors,
    warnings,
    impact:
      config.scope.type === 'PARTNER'
        ? {
            affectedBranches: existingConfigs.filter(
              (c) =>
                c.scope.type === 'BRANCH' &&
                c.scope.productCode === config.scope.productCode &&
                c.scope.partnerCode === config.scope.partnerCode
            ).length,
            message: `Will affect ${existingConfigs.filter(
              (c) =>
                c.scope.type === 'BRANCH' &&
                c.scope.productCode === config.scope.productCode &&
                c.scope.partnerCode === config.scope.partnerCode
            ).length} branches`,
          }
        : undefined,
  };
}

/**
 * Validates scope immutability (scope cannot be changed after creation)
 */
export function validateScopeChange(
  oldScope: ConfigScope,
  newScope: ConfigScope
): ScopeValidationResult {
  const errors: string[] = [];

  if (
    oldScope.type !== newScope.type ||
    oldScope.productCode !== newScope.productCode ||
    oldScope.partnerCode !== newScope.partnerCode ||
    oldScope.branchCode !== newScope.branchCode
  ) {
    errors.push('Scope is immutable and cannot be changed after creation');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Gets a human-readable scope identifier
 */
export function getScopeIdentifier(scope: ConfigScope): string {
  switch (scope.type) {
    case 'PRODUCT':
      return scope.productCode;
    case 'PARTNER':
      return `${scope.productCode} > ${scope.partnerCode}`;
    case 'BRANCH':
      return `${scope.productCode} > ${scope.partnerCode} > ${scope.branchCode}`;
    default:
      return 'Unknown';
  }
}

