'use client';

import React from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  InputLabel,
  Typography,
} from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { ScopeType } from '@/types';
import { useProducts, usePartners, useBranches } from '@/hooks/use-master-data';
import { validateScope } from '@/utils/configValidation';

interface ConfigScopeSelectorProps {
  /**
   * Whether the scope is read-only (for edit mode)
   */
  readOnly?: boolean;
  /**
   * Whether to show validation errors
   */
  showErrors?: boolean;
}

export function ConfigScopeSelector({
  readOnly = false,
  showErrors = true,
}: ConfigScopeSelectorProps) {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext();

  const scopeType = watch('scope.type') as ScopeType | undefined;
  const productCode = watch('scope.productCode');
  const partnerCode = watch('scope.partnerCode');

  // Fetch master data
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: partners, isLoading: partnersLoading } = usePartners();
  const { data: branches, isLoading: branchesLoading } = useBranches(
    partnerCode || undefined
  );

  // Build scope object for validation
  const currentScope = {
    type: scopeType || 'PRODUCT',
    productCode: productCode || '',
    partnerCode: partnerCode || undefined,
    branchCode: watch('scope.branchCode') || undefined,
  };

  const scopeValidation = scopeType ? validateScope(currentScope) : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <FormControl component="fieldset" error={!!errors.scope?.type}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
          Configuration Scope
        </FormLabel>
        {readOnly ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
            Scope cannot be changed after creation
          </Typography>
        ) : (
          <FormHelperText sx={{ mb: 1 }}>
            Select the scope level for this configuration. Scope cannot be changed after creation.
          </FormHelperText>
        )}

        <Controller
          name="scope.type"
          control={control}
          rules={{
            required: 'Scope type is required',
          }}
          render={({ field }) => (
            <RadioGroup
              {...field}
              row
              aria-label="scope type"
            >
              <FormControlLabel
                value="PRODUCT"
                control={<Radio />}
                label="Product"
              />
              <FormControlLabel
                value="PARTNER"
                control={<Radio />}
                label="Partner"
              />
              <FormControlLabel
                value="BRANCH"
                control={<Radio />}
                label="Branch"
              />
            </RadioGroup>
          )}
        />
        {errors.scope?.type && showErrors && (
          <FormHelperText>
            {typeof errors.scope.type === 'object' && errors.scope.type !== null && 'message' in errors.scope.type
              ? String(errors.scope.type.message)
              : String(errors.scope.type)}
          </FormHelperText>
        )}
      </FormControl>

      {/* Product Selection - Always shown */}
      {scopeType && (
        <Controller
          name="scope.productCode"
          control={control}
          rules={{
            required: 'Product is required',
          }}
          render={({ field }) => (
            <FormControl
              fullWidth
              error={!!(errors.scope as any)?.productCode}
              disabled={readOnly || productsLoading}
            >
              <InputLabel>Product</InputLabel>
              <Select {...field} label="Product" disabled={readOnly || productsLoading}>
                {products?.map((product) => (
                  <MenuItem key={product.productCode} value={product.productCode}>
                    {product.productName} ({product.productCode})
                  </MenuItem>
                ))}
              </Select>
              {(errors.scope as any)?.productCode && showErrors && (
                <FormHelperText>
                  {typeof (errors.scope as any).productCode === 'object' && (errors.scope as any).productCode !== null && 'message' in (errors.scope as any).productCode
                    ? String((errors.scope as any).productCode.message)
                    : String((errors.scope as any).productCode)}
                </FormHelperText>
              )}
            </FormControl>
          )}
        />
      )}

      {/* Partner Selection - Shown for PARTNER and BRANCH */}
      {scopeType && (scopeType === 'PARTNER' || scopeType === 'BRANCH') && (
        <Controller
          name="scope.partnerCode"
          control={control}
          rules={{
            required: 'Partner is required',
          }}
          render={({ field }) => (
            <FormControl
              fullWidth
              error={!!(errors.scope as any)?.partnerCode}
              disabled={readOnly || partnersLoading}
            >
              <InputLabel>Partner</InputLabel>
              <Select {...field} label="Partner" disabled={readOnly || partnersLoading}>
                {partners?.map((partner) => (
                  <MenuItem key={partner.partnerCode} value={partner.partnerCode}>
                    {partner.partnerName} ({partner.partnerCode})
                  </MenuItem>
                ))}
              </Select>
              {(errors.scope as any)?.partnerCode && showErrors && (
                <FormHelperText>
                  {typeof (errors.scope as any).partnerCode === 'object' && (errors.scope as any).partnerCode !== null && 'message' in (errors.scope as any).partnerCode
                    ? String((errors.scope as any).partnerCode.message)
                    : String((errors.scope as any).partnerCode)}
                </FormHelperText>
              )}
            </FormControl>
          )}
        />
      )}

      {/* Branch Selection - Only shown for BRANCH */}
      {scopeType === 'BRANCH' && (
        <Controller
          name="scope.branchCode"
          control={control}
          rules={{
            required: 'Branch is required',
          }}
          render={({ field }) => (
            <FormControl
              fullWidth
              error={!!(errors.scope as any)?.branchCode}
              disabled={readOnly || branchesLoading}
            >
              <InputLabel>Branch</InputLabel>
              <Select
                {...field}
                label="Branch"
                disabled={readOnly || branchesLoading || !partnerCode}
              >
                {branches?.map((branch) => (
                  <MenuItem key={branch.branchCode} value={branch.branchCode}>
                    {branch.branchName} ({branch.branchCode})
                  </MenuItem>
                ))}
              </Select>
              {(errors.scope as any)?.branchCode && showErrors && (
                <FormHelperText>
                  {typeof (errors.scope as any).branchCode === 'object' && (errors.scope as any).branchCode !== null && 'message' in (errors.scope as any).branchCode
                    ? String((errors.scope as any).branchCode.message)
                    : String((errors.scope as any).branchCode)}
                </FormHelperText>
              )}
              {!partnerCode && (
                <FormHelperText>
                  Please select a partner first to see branches
                </FormHelperText>
              )}
            </FormControl>
          )}
        />
      )}

      {/* Validation Errors */}
      {scopeValidation && !scopeValidation.isValid && showErrors && (
        <Alert severity="error">
          <Typography variant="body2" component="div">
            Scope validation errors:
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              {scopeValidation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Typography>
        </Alert>
      )}
    </Box>
  );
}

