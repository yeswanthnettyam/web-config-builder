import { useMemo } from 'react';
import { ScreenConfig, ResolvedConfig, ConfigScope, ScopeType } from '@/types';

interface UseConfigResolverParams {
  screenId: string;
  scope: ConfigScope;
  allConfigs: ScreenConfig[];
}

interface UseConfigResolverResult {
  resolvedConfig: ResolvedConfig<ScreenConfig> | null;
  resolvedFrom: ScopeType | null;
  inheritanceChain: string[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to resolve config using the hierarchy:
 * 1. BRANCH (if branchCode exists)
 * 2. PARTNER (if partnerCode exists)
 * 3. PRODUCT (fallback - MUST exist)
 *
 * For FLOW configs, only resolves:
 * 1. PARTNER (if exists)
 * 2. PRODUCT (fallback)
 */
export function useConfigResolver<T extends ScreenConfig>({
  screenId,
  scope,
  allConfigs,
}: UseConfigResolverParams): UseConfigResolverResult {
  return useMemo(() => {
    // Filter configs for the same screen and product
    const relevantConfigs = allConfigs.filter(
      (c) => c.screenId === screenId && c.scope.productCode === scope.productCode
    );

    // Filter only ACTIVE configs for resolution
    const activeConfigs = relevantConfigs.filter((c) => c.status === 'ACTIVE');

    let resolvedConfig: ScreenConfig | null = null;
    let resolvedFrom: ScopeType | null = null;
    const inheritanceChain: string[] = [];

    // Resolution order: BRANCH → PARTNER → PRODUCT
    if (scope.branchCode) {
      // Try BRANCH first
      const branchConfig = activeConfigs.find(
        (c) =>
          c.scope.type === 'BRANCH' &&
          c.scope.partnerCode === scope.partnerCode &&
          c.scope.branchCode === scope.branchCode
      );

      if (branchConfig) {
        resolvedConfig = branchConfig;
        resolvedFrom = 'BRANCH';
        inheritanceChain.push('BRANCH');
      } else {
        inheritanceChain.push('BRANCH (not found)');
      }
    }

    // Try PARTNER if BRANCH not found or not applicable
    if (!resolvedConfig && scope.partnerCode) {
      const partnerConfig = activeConfigs.find(
        (c) =>
          c.scope.type === 'PARTNER' &&
          c.scope.partnerCode === scope.partnerCode
      );

      if (partnerConfig) {
        resolvedConfig = partnerConfig;
        resolvedFrom = 'PARTNER';
        inheritanceChain.push('PARTNER');
      } else {
        inheritanceChain.push('PARTNER (not found)');
      }
    }

    // Fallback to PRODUCT (MUST exist)
    if (!resolvedConfig) {
      const productConfig = activeConfigs.find(
        (c) => c.scope.type === 'PRODUCT'
      );

      if (productConfig) {
        resolvedConfig = productConfig;
        resolvedFrom = 'PRODUCT';
        inheritanceChain.push('PRODUCT');
      } else {
        // PRODUCT config not found - this is an error
        return {
          resolvedConfig: null,
          resolvedFrom: null,
          inheritanceChain,
          isLoading: false,
          error: new Error(
            `PRODUCT configuration not found for screen ${screenId} and product ${scope.productCode}`
          ),
        };
      }
    }

    // Build inheritance chain in resolution order
    const finalInheritanceChain: string[] = [];
    if (scope.branchCode) {
      finalInheritanceChain.push(
        `BRANCH: ${scope.productCode} > ${scope.partnerCode} > ${scope.branchCode}`
      );
    }
    if (scope.partnerCode) {
      finalInheritanceChain.push(
        `PARTNER: ${scope.productCode} > ${scope.partnerCode}`
      );
    }
    finalInheritanceChain.push(`PRODUCT: ${scope.productCode}`);

    return {
      resolvedConfig: {
        config: resolvedConfig as T,
        resolvedFrom: resolvedFrom!,
        inheritanceChain: finalInheritanceChain,
      },
      resolvedFrom: resolvedFrom!,
      inheritanceChain: finalInheritanceChain,
      isLoading: false,
      error: null,
    };
  }, [screenId, scope, allConfigs]);
}

/**
 * Hook specifically for FLOW config resolution (no BRANCH level)
 */
export function useFlowConfigResolver<T extends ScreenConfig>({
  screenId,
  scope,
  allConfigs,
}: UseConfigResolverParams): UseConfigResolverResult {
  return useMemo(() => {
    // Filter configs for the same screen and product
    const relevantConfigs = allConfigs.filter(
      (c) => c.screenId === screenId && c.scope.productCode === scope.productCode
    );

    // Filter only ACTIVE configs
    const activeConfigs = relevantConfigs.filter((c) => c.status === 'ACTIVE');

    let resolvedConfig: ScreenConfig | null = null;
    let resolvedFrom: ScopeType | null = null;
    const inheritanceChain: string[] = [];

    // For FLOW: Only PARTNER → PRODUCT (no BRANCH)
    if (scope.partnerCode) {
      const partnerConfig = activeConfigs.find(
        (c) =>
          c.scope.type === 'PARTNER' &&
          c.scope.partnerCode === scope.partnerCode
      );

      if (partnerConfig) {
        resolvedConfig = partnerConfig;
        resolvedFrom = 'PARTNER';
        inheritanceChain.push('PARTNER');
      } else {
        inheritanceChain.push('PARTNER (not found)');
      }
    }

    // Fallback to PRODUCT (MUST exist)
    if (!resolvedConfig) {
      const productConfig = activeConfigs.find(
        (c) => c.scope.type === 'PRODUCT'
      );

      if (productConfig) {
        resolvedConfig = productConfig;
        resolvedFrom = 'PRODUCT';
        inheritanceChain.push('PRODUCT');
      } else {
        return {
          resolvedConfig: null,
          resolvedFrom: null,
          inheritanceChain,
          isLoading: false,
          error: new Error(
            `PRODUCT configuration not found for screen ${screenId} and product ${scope.productCode}`
          ),
        };
      }
    }

    const finalInheritanceChain: string[] = [];
    if (scope.partnerCode) {
      finalInheritanceChain.push(
        `PARTNER: ${scope.productCode} > ${scope.partnerCode}`
      );
    }
    finalInheritanceChain.push(`PRODUCT: ${scope.productCode}`);

    return {
      resolvedConfig: {
        config: resolvedConfig as T,
        resolvedFrom: resolvedFrom!,
        inheritanceChain: finalInheritanceChain,
      },
      resolvedFrom: resolvedFrom!,
      inheritanceChain: finalInheritanceChain,
      isLoading: false,
      error: null,
    };
  }, [screenId, scope, allConfigs]);
}

