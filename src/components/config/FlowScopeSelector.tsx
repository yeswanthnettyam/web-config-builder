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
import { useProducts, usePartners } from '@/hooks/use-master-data';
import { validateScope } from '@/utils/configValidation';

interface FlowScopeSelectorProps {
  /**
   * Whether the scope is read-only (for edit mode)
   */
  readOnly?: boolean;
  /**
   * Whether to show validation errors
   */
  showErrors?: boolean;
}

/**
 * Scope selector specifically for Flow configs
 * Only allows PRODUCT and PARTNER (BRANCH not allowed for flows)
 */
export function FlowScopeSelector({
  readOnly = false,
  showErrors = true,
}: FlowScopeSelectorProps) {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext();

  const scopeType = watch('scope.type') as 'PRODUCT' | 'PARTNER' | undefined;
  const productCode = watch('scope.productCode');
  const partnerCode = watch('scope.partnerCode');

  // Fetch master data
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: partners, isLoading: partnersLoading } = usePartners();

  // Build scope object for validation
  const currentScope = {
    type: scopeType || 'PRODUCT',
    productCode: productCode || '',
    partnerCode: partnerCode || undefined,
  };

  const scopeValidation = scopeType ? validateScope(currentScope) : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <FormControl component="fieldset" error={!!errors.scope?.type}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
          Flow Configuration Scope
        </FormLabel>
        {readOnly ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
            Scope cannot be changed after creation
          </Typography>
        ) : (
          <Box>
            <FormHelperText sx={{ mb: 1 }}>
              Select the scope level for this flow.
            </FormHelperText>
            <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
              <Typography variant="body2" component="div">
                <strong>Why BRANCH level is not allowed:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  <li>Flows define the overall customer journey and navigation structure</li>
                  <li>Branch-level customization should be handled at the <strong>Screen</strong> level (which supports BRANCH scope)</li>
                  <li>Maintaining flow consistency across branches ensures a unified customer experience</li>
                  <li>If a branch needs different behavior, customize individual screens rather than the entire flow</li>
                </ul>
              </Typography>
            </Alert>
          </Box>
        )}

        <Controller
          name="scope.type"
          control={control}
          rules={{
            required: 'Scope type is required',
            validate: (value) => {
              if (value === 'BRANCH') {
                return 'Flows cannot be configured at BRANCH level';
              }
              return true;
            },
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
                  <MenuItem key={product.code} value={product.code}>
                    {product.name} ({product.code})
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

      {/* Partner Selection - Shown for PARTNER */}
      {scopeType === 'PARTNER' && (
        <Controller
          name="scope.partnerCode"
          control={control}
          rules={{
            required: 'Partner is required for PARTNER scope',
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
                  <MenuItem key={partner.code} value={partner.code}>
                    {partner.name} ({partner.code})
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

