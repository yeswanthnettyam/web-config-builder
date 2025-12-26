import { FlowConfig, FlowValidationResult, ScreenFlowNode } from '@/types';

export function validateFlow(flow: FlowConfig, availableScreens: string[]): FlowValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if start screen exists
  if (!availableScreens.includes(flow.startScreen)) {
    errors.push(`Start screen "${flow.startScreen}" not found in screens list`);
  }

  // Check if start screen is in screens array
  const startScreenNode = flow.screens.find((s) => s.screenId === flow.startScreen);
  if (!startScreenNode) {
    errors.push(`Start screen "${flow.startScreen}" not configured in flow screens`);
  }

  // Validate each screen
  flow.screens.forEach((screen, index) => {
    // Check if screen exists in available screens
    if (!availableScreens.includes(screen.screenId)) {
      errors.push(`Screen "${screen.screenId}" not found in available screens`);
    }

    // Check default next
    if (!screen.defaultNext) {
      errors.push(`Screen "${screen.screenId}" missing defaultNext`);
    } else if (screen.defaultNext !== '__FLOW_END__' && !availableScreens.includes(screen.defaultNext)) {
      errors.push(`Screen "${screen.screenId}" has invalid defaultNext: "${screen.defaultNext}"`);
    }

    // Check conditions
    if (screen.conditions) {
      screen.conditions.forEach((condition, condIndex) => {
        if (condition.then?.nextScreen && !availableScreens.includes(condition.then.nextScreen)) {
          errors.push(
            `Screen "${screen.screenId}" condition ${condIndex + 1} has invalid nextScreen: "${condition.then.nextScreen}"`
          );
        }
      });
    }

    // Check services
    if (screen.services) {
      ['preLoad', 'onSubmit', 'background'].forEach((serviceType) => {
        const services = screen.services?.[serviceType as keyof typeof screen.services] || [];
        services.forEach((service, serviceIndex) => {
          if (!service.endpoint) {
            warnings.push(
              `Screen "${screen.screenId}" ${serviceType} service ${serviceIndex + 1} has no endpoint`
            );
          }
          if (!service.onError) {
            warnings.push(
              `Screen "${screen.screenId}" ${serviceType} service "${service.serviceId}" has no error handling configured`
            );
          }
        });
      });
    }

    // Note: Conditions are optional, so we don't warn about missing conditions
  });

  // Check for circular dependencies
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function detectCycle(screenId: string): boolean {
    if (recursionStack.has(screenId)) {
      return true; // Cycle detected
    }
    if (visited.has(screenId)) {
      return false;
    }

    visited.add(screenId);
    recursionStack.add(screenId);

    const screen = flow.screens.find((s) => s.screenId === screenId);
    if (screen) {
      // Check default next
      if (screen.defaultNext && detectCycle(screen.defaultNext)) {
        return true;
      }

      // Check conditions
      if (screen.conditions) {
        for (const condition of screen.conditions) {
          if (condition.then?.nextScreen && detectCycle(condition.then.nextScreen)) {
            return true;
          }
        }
      }
    }

    recursionStack.delete(screenId);
    return false;
  }

  if (flow.startScreen && detectCycle(flow.startScreen)) {
    errors.push('Circular dependency detected in flow');
  }

  // Calculate summary
  const summary = {
    screens: flow.screens.length,
    conditionalRoutes: flow.screens.reduce(
      (acc, s) => acc + (s.conditions?.length || 0),
      0
    ),
    services: flow.screens.reduce((acc, s) => {
      const preLoad = s.services?.preLoad?.length || 0;
      const onSubmit = s.services?.onSubmit?.length || 0;
      const background = s.services?.background?.length || 0;
      return acc + preLoad + onSubmit + background;
    }, 0),
    warnings: warnings.length,
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary,
  };
}

