'use client';

import React, { useState, useCallback, useMemo, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  MenuItem,
  Typography,
  Paper,
  Chip,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { Save, Cancel, Add, CheckCircle, PlayArrow } from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { 
  Node, 
  Edge, 
  Connection, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  ReactFlowProvider 
} from 'reactflow';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import PageHeader from '@/components/shared/PageHeader';
import JsonViewer from '@/components/shared/JsonViewer';
import { usePartners, useProducts, useConfiguredScreensSimple } from '@/hooks/use-master-data';
import { FlowScopeSelector } from '@/components/config/FlowScopeSelector';
import { FormProvider } from 'react-hook-form';
import RightPanel from '@/components/flow-builder/RightPanel';
import NodeConfigPanel from '@/components/flow-builder/NodeConfigPanel';
import EdgeConfigPanel from '@/components/flow-builder/EdgeConfigPanel';
import ValidationBanner from '@/components/flow-builder/ValidationBanner';
import { FlowScreenConfig, NavigationCondition, FlowConfig, FlowValidationResult } from '@/types';
import { validateFlow } from '@/lib/flow-validation';
import { saveFlowConfig, getFlowConfigByFlowId, getFlowConfigById, type CachedFlowConfig } from '@/lib/cache-storage';
import toast from 'react-hot-toast';

// Dynamically import ReactFlow to avoid SSR issues
const ReactFlow = dynamic(
  () => import('reactflow').then((mod) => mod.default),
  { ssr: false }
);

// Import ReactFlow styles
import 'reactflow/dist/style.css';

// Flow Canvas Component - wraps ReactFlow with provider
function FlowCanvas({
  nodes: externalNodes,
  edges: externalEdges,
  onNodeClick,
  onEdgeClick,
  onConnect,
  onNodesChange,
  onEdgesChange,
}: {
  nodes: Node[];
  edges: Edge[];
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onEdgeClick: (event: React.MouseEvent, edge: Edge) => void;
  onConnect: (params: Connection) => void;
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
}) {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(externalNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(externalEdges);

  // Sync external changes
  useEffect(() => {
    setNodes(externalNodes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalNodes]);

  useEffect(() => {
    setEdges(externalEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalEdges]);

  return (
    <ReactFlowProvider>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeInternal}
        onEdgesChange={onEdgesChangeInternal}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        fitView
        attributionPosition="bottom-left"
      />
    </ReactFlowProvider>
  );
}

interface FlowFormData {
  flowId: string;
  scope: {
    type: 'PRODUCT' | 'PARTNER'; // BRANCH not allowed for flows
    productCode: string;
    partnerCode?: string;
  };
  startScreen: string;
}

type PanelContent = {
  type: 'node' | 'edge' | null;
  data: any;
};

function NewFlowPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const cloneId = searchParams.get('clone');
  const flowIdToLoad = editId || cloneId;
  
  const { data: partners } = usePartners();
  const { data: products } = useProducts();
  // For flow builder, we want ALL screens (not just ACTIVE) so users can build flows with draft screens
  const { data: configuredScreens, isLoading: screensLoading } = useConfiguredScreensSimple();
  
  // Debug: Log configured screens
  useEffect(() => {
    console.log('🔍 Configured Screens:', configuredScreens);
    console.log('🔍 Screens Loading:', screensLoading);
  }, [configuredScreens, screensLoading]);
  const [activeTab, setActiveTab] = useState(0);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [panelContent, setPanelContent] = useState<PanelContent>({ type: null, data: null });
  const [flowStatus, setFlowStatus] = useState<'DRAFT' | 'ACTIVE'>('DRAFT');
  const [validationResult, setValidationResult] = useState<FlowValidationResult | null>(null);
  const [isLoadingFlow, setIsLoadingFlow] = useState(false);

  // Screen configurations - map of screenId to FlowScreenConfig
  const [screenConfigs, setScreenConfigs] = useState<Map<string, FlowScreenConfig>>(new Map());
  // Edge conditions - map of edgeId to NavigationCondition
  const [edgeConditions, setEdgeConditions] = useState<Map<string, NavigationCondition>>(new Map());
  // Version counter to force re-renders when configs change
  const [configVersion, setConfigVersion] = useState(0);
  
  const methods = useForm<FlowFormData>({
    defaultValues: {
      flowId: '',
      scope: {
        type: 'PRODUCT',
        productCode: '',
        partnerCode: '',
      },
      startScreen: '',
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = methods;

  const formValues = watch();

  // Load existing flow data when editing or cloning
  useEffect(() => {
    if (flowIdToLoad && configuredScreens && configuredScreens.length > 0) {
      setIsLoadingFlow(true);
      const existingFlow = getFlowConfigById(flowIdToLoad);
      
      if (existingFlow) {
        console.log('📥 Loading existing flow:', existingFlow);
        
        // Populate form fields
        // Handle both old format (partnerCode/productCode) and new format (scope)
        const existingScope = existingFlow.config.scope || {
          type: existingFlow.config.partnerCode ? 'PARTNER' : 'PRODUCT',
          productCode: existingFlow.config.productCode || '',
          partnerCode: existingFlow.config.partnerCode || undefined,
        };

        reset({
          flowId: cloneId ? `${existingFlow.flowId}_clone` : existingFlow.flowId,
          scope: existingScope,
          startScreen: existingFlow.config.startScreen,
        });
        
        // Set flow status (only DRAFT or ACTIVE for editing)
        setFlowStatus(existingFlow.status === 'DEPRECATED' ? 'DRAFT' : existingFlow.status);
        
        // Populate screen configs from the flow
        const configMap = new Map<string, FlowScreenConfig>();
        if (existingFlow.config.screens) {
          existingFlow.config.screens.forEach((screenConfig: FlowScreenConfig) => {
            configMap.set(screenConfig.screenId, screenConfig);
          });
        }
        setScreenConfigs(configMap);
        
        console.log('✅ Loaded screen configs:', Array.from(configMap.entries()));
        
        // Edges will be rebuilt automatically by the useEffect that watches screenConfigs
      } else {
        toast.error('Flow not found');
        router.push('/flow-builder');
      }
      setIsLoadingFlow(false);
    }
  }, [flowIdToLoad, configuredScreens, reset, cloneId, router]);

  // Initialize screen configs when screens are loaded (only if not editing/cloning)
  useEffect(() => {
    if (configuredScreens && configuredScreens.length > 0 && !flowIdToLoad) {
      console.log('🔄 Initializing screen configs. Current screenConfigs size:', screenConfigs.size);
      setScreenConfigs((prev) => {
        const newMap = new Map(prev);
        let hasChanges = false;
        
        configuredScreens.forEach((screen, index) => {
          // Only initialize if screen doesn't exist
          // ALWAYS preserve existing conditions and other config if screen already exists
          if (!newMap.has(screen.screenId)) {
            console.log(`➕ Adding new screen config for: ${screen.screenId}`);
            newMap.set(screen.screenId, {
              screenId: screen.screenId,
              displayName: screen.screenName,
              defaultNext: configuredScreens[index + 1]?.screenId || '',
              conditions: [],
            });
            hasChanges = true;
          } else {
            // Screen already exists - preserve ALL existing data, only update displayName if it changed
            const existing = newMap.get(screen.screenId);
            if (existing) {
              console.log(`📋 Preserving existing config for: ${screen.screenId}`);
              console.log(`📋 Existing conditions count: ${existing.conditions?.length || 0}`);
              
              // Only update if displayName changed, preserve everything else including conditions
              if (existing.displayName !== screen.screenName) {
                newMap.set(screen.screenId, {
                  ...existing, // Preserve ALL existing data including conditions
                  displayName: screen.screenName, // Only update display name
                });
                hasChanges = true;
              }
              // If displayName is the same, don't update at all to preserve conditions
            }
          }
        });
        
        if (hasChanges) {
          console.log('✅ Screen configs initialized/updated');
          console.log('✅ Final screenConfigs:', Array.from(newMap.entries()).map(([id, cfg]) => ({
            id,
            conditionsCount: cfg.conditions?.length || 0,
          })));
        }
        
        return newMap;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configuredScreens, flowIdToLoad]); // Don't include screenConfigs.size in deps to avoid infinite loop

  // Initialize nodes from configured screens - only show screens from screen config builder
  const initialNodes: Node[] = useMemo(() => {
    console.log('📊 Computing initialNodes from configuredScreens:', configuredScreens);
    // Only show screens that are configured in the screen config builder module
    if (!configuredScreens || configuredScreens.length === 0) {
      console.log('⚠️ No configured screens found, returning empty nodes array');
      return []; // Return empty array instead of static screens
    }

    const nodes = configuredScreens.map((screen, index) => {
      const isStart = screen.screenId === formValues.startScreen;
      const isLast = index === configuredScreens.length - 1;

      return {
        id: screen.screenId,
        type: isStart ? 'input' : isLast ? 'output' : 'default',
        data: { label: screen.screenName, screenId: screen.screenId },
        position: {
          x: 250 + (index % 3) * 150,
          y: Math.floor(index / 3) * 150,
        },
        style: isStart
          ? { background: '#0B2F70', color: 'white', border: '2px solid #0B2F70' }
          : isLast
          ? { background: '#2E7D32', color: 'white', border: '2px solid #2E7D32' }
          : { background: '#00B2FF', color: 'white' },
      };
    });
    
    console.log('✅ Generated nodes:', nodes);
    return nodes;
  }, [configuredScreens, formValues.startScreen]);

  const initialEdges: Edge[] = useMemo(() => {
    // Only create edges for configured screens - no static fallback
    if (!configuredScreens || configuredScreens.length === 0) {
      return []; // Return empty array instead of static edges
    }

    // Initial sequential edges (will be replaced by buildEdgesFromConfigs when configs are set)
    const edges: Edge[] = [];
    for (let i = 0; i < configuredScreens.length - 1; i++) {
      const source = configuredScreens[i].screenId;
      const target = configuredScreens[i + 1].screenId;
      edges.push({
        id: `e-${source}-${target}`,
        source,
        target,
        label: 'Next',
        animated: true,
      });
    }
    return edges;
  }, [configuredScreens]);

  // State for nodes and edges (must be declared before callbacks that use them)
  // Update nodes and edges when initialNodes/initialEdges change
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  // Update nodes when initialNodes changes (e.g., when configuredScreens loads)
  useEffect(() => {
    console.log('🔄 Updating nodes from initialNodes:', initialNodes);
    setNodes(initialNodes);
  }, [initialNodes]);

  // Update edges when initialEdges changes
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges]);


  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const screenId = node.data.screenId || node.id;
    const config = screenConfigs.get(screenId) || {
      screenId,
      displayName: node.data.label || screenId,
      defaultNext: '',
      conditions: [],
    };

    setPanelContent({
      type: 'node',
      data: { node, config },
    });
    setRightPanelOpen(true);
  }, [screenConfigs]);

  // Handle edge click
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    const condition = edgeConditions.get(edge.id) || {
      id: edge.id,
      priority: 1,
      enabled: true,
      name: edge.label || 'Condition',
      condition: {
        source: 'FORM_DATA',
        operator: 'EQUALS',
        value: '',
      },
      action: {
        type: 'NAVIGATE' as const,
        targetScreen: edge.target,
      },
    };

    setPanelContent({
      type: 'edge',
      data: { edge, condition },
    });
    setRightPanelOpen(true);
  }, [edgeConditions]);

  // Handle edge updates
  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        setEdges((eds) =>
          addEdge(
            {
              ...params,
              id: `e-${params.source}-${params.target}`,
              animated: true,
            },
            eds
          )
        );
      }
    },
    [] // setEdges is stable, no need to include in deps
  );

  // Build edges from screen configs and conditions
  const buildEdgesFromConfigs = useCallback(() => {
    console.log('🔨 ========== buildEdgesFromConfigs START ==========');
    console.log('🔨 Screen configs Map size:', screenConfigs.size);
    console.log('🔨 Screen configs entries:', Array.from(screenConfigs.entries()));
    
    // Log each screen config in detail
    screenConfigs.forEach((config, screenId) => {
      console.log(`🔨 Screen ${screenId} config:`, JSON.stringify(config, null, 2));
      console.log(`🔨 Screen ${screenId} conditions:`, config.conditions);
      console.log(`🔨 Screen ${screenId} conditions length:`, config.conditions?.length || 0);
      console.log(`🔨 Screen ${screenId} conditions type:`, typeof config.conditions);
      console.log(`🔨 Screen ${screenId} conditions isArray:`, Array.isArray(config.conditions));
    });
    const newEdges: Edge[] = [];
    const newEdgeConditions = new Map<string, NavigationCondition>();

    // Create edges from screen configs
    screenConfigs.forEach((config, screenId) => {
      console.log(`📊 Processing screen ${screenId}:`, config);
      
      // Default next edge
      if (config.defaultNext && config.defaultNext !== '__FLOW_END__') {
        const edgeId = `e-default-${screenId}-${config.defaultNext}`;
        newEdges.push({
          id: edgeId,
          source: screenId,
          target: config.defaultNext,
          label: 'Default',
      animated: true,
          style: { stroke: '#00B2FF', strokeWidth: 1 },
        });
        console.log(`✅ Added default edge: ${edgeId}`);
      }

      // Condition-based edges
      if (config.conditions && config.conditions.length > 0) {
        console.log(`🔀 Found ${config.conditions.length} conditions for screen ${screenId}`);
        const sortedConditions = [...config.conditions]
          .filter((c) => c.enabled !== false) // Include if enabled is true or undefined
          .sort((a, b) => (b.priority || 0) - (a.priority || 0));

        console.log(`✅ ${sortedConditions.length} enabled conditions after filtering`);

        sortedConditions.forEach((condition, index) => {
          console.log(`🔍 Processing condition ${index}:`, condition);
          if (condition.action && condition.action.targetScreen && condition.action.targetScreen !== '__FLOW_END__') {
            const conditionId = condition.id || `cond_${screenId}_${index}_${Date.now()}`;
            const edgeId = `e-cond-${screenId}-${condition.action.targetScreen}-${conditionId}`;
            
            // Ensure condition has an ID
            const conditionWithId = { ...condition, id: conditionId };
            
            // Store condition in edgeConditions map
            newEdgeConditions.set(edgeId, conditionWithId);

            newEdges.push({
              id: edgeId,
              source: screenId,
              target: condition.action.targetScreen,
              label: condition.name || 'Condition',
              style: { stroke: '#ED6C02', strokeWidth: 2 },
            });
            console.log(`✅ Added condition edge: ${edgeId} with label "${condition.name || 'Condition'}"`);
          } else {
            console.log(`⚠️ Skipping condition ${index}: missing action or targetScreen or is FLOW_END`, {
              hasAction: !!condition.action,
              targetScreen: condition.action?.targetScreen,
            });
          }
        });
      } else {
        console.log(`⚠️ No conditions found for screen ${screenId}`);
      }
    });

    console.log(`🎯 Total edges created: ${newEdges.length}`);
    console.log(`🎯 Total condition edges: ${newEdgeConditions.size}`);
    console.log('🔨 ========== buildEdgesFromConfigs END ==========');

    // Update both edges and edgeConditions
    setEdges(newEdges);
    setEdgeConditions(newEdgeConditions);
  }, [screenConfigs]);

  // Update edges when screen configs change
  useEffect(() => {
    console.log('🔄 ========== Screen configs changed, rebuilding edges ==========');
    console.log('🔄 Screen configs size:', screenConfigs.size);
    console.log('🔄 Screen configs entries:', Array.from(screenConfigs.entries()));
    
    // Log each screen config's conditions
    screenConfigs.forEach((config, screenId) => {
      console.log(`🔄 Screen ${screenId}:`, {
        screenId: config.screenId,
        displayName: config.displayName,
        conditionsCount: config.conditions?.length || 0,
        conditions: config.conditions,
      });
    });
    
    if (screenConfigs.size > 0) {
      buildEdgesFromConfigs();
    } else {
      // Clear edges if no configs
      setEdges([]);
      setEdgeConditions(new Map());
    }
  }, [buildEdgesFromConfigs, screenConfigs]);

  // Handle screen config update
  const handleScreenConfigUpdate = useCallback((screenId: string, config: FlowScreenConfig) => {
    console.log('💾 ========== handleScreenConfigUpdate START ==========');
    console.log('💾 Screen ID:', screenId);
    console.log('💾 Full config received:', JSON.stringify(config, null, 2));
    console.log('💾 Config.conditions:', config.conditions);
    console.log('💾 Config.conditions type:', typeof config.conditions);
    console.log('💾 Config.conditions isArray:', Array.isArray(config.conditions));
    console.log('💾 Config conditions count:', config.conditions?.length || 0);
    
    if (!config.conditions || config.conditions.length === 0) {
      console.error('❌ ERROR: Config has NO conditions in handleScreenConfigUpdate!');
      console.error('❌ Config object keys:', Object.keys(config));
      console.error('❌ Config object:', config);
    } else {
      console.log('✅ Config HAS conditions:', config.conditions);
      config.conditions.forEach((cond, idx) => {
        console.log(`✅ Condition ${idx}:`, JSON.stringify(cond, null, 2));
      });
    }
    
    setScreenConfigs((prev) => {
      console.log('💾 Inside setScreenConfigs callback');
      console.log('💾 Previous screenConfigs size:', prev.size);
      console.log('💾 Previous config for this screen:', prev.get(screenId));
      
      const newMap = new Map(prev);
      
      // Ensure conditions array exists and is properly structured
      const conditions = Array.isArray(config.conditions) 
        ? config.conditions.filter(cond => {
            const isValid = cond && cond.id;
            if (!isValid) {
              console.warn('⚠️ Filtering out invalid condition:', cond);
            }
            return isValid;
          })
        : [];
      
      console.log('💾 Filtered conditions:', conditions);
      console.log('💾 Filtered conditions length:', conditions.length);
      
      const configWithConditions: FlowScreenConfig = {
        ...config,
        conditions: conditions,
      };
      
      console.log('💾 ConfigWithConditions before saving:', JSON.stringify(configWithConditions, null, 2));
      console.log('💾 ConfigWithConditions.conditions:', configWithConditions.conditions);
      console.log('💾 ConfigWithConditions.conditions.length:', configWithConditions.conditions.length);
      
      newMap.set(screenId, configWithConditions);
      
      // Immediately verify what was saved
      const savedConfig = newMap.get(screenId);
      console.log('✅ Saved config:', JSON.stringify(savedConfig, null, 2));
      console.log('✅ Saved config.conditions:', savedConfig?.conditions);
      console.log('✅ Saved config.conditions.length:', savedConfig?.conditions?.length || 0);
      console.log('✅ Saved config.conditions type:', typeof savedConfig?.conditions);
      console.log('✅ Saved config.conditions isArray:', Array.isArray(savedConfig?.conditions));
      
      if (!savedConfig || !savedConfig.conditions || savedConfig.conditions.length === 0) {
        console.error('❌ CRITICAL ERROR: Conditions were NOT saved to Map!');
        console.error('❌ savedConfig:', savedConfig);
        console.error('❌ Input config.conditions:', config.conditions);
        console.error('❌ Filtered conditions:', conditions);
      }
      
      // Verify all screenConfigs
      console.log('✅ All screenConfigs after update:');
      Array.from(newMap.entries()).forEach(([id, cfg]) => {
        console.log(`  - ${id}: ${cfg.conditions?.length || 0} conditions`);
        if (cfg.conditions && cfg.conditions.length > 0) {
          console.log(`    Conditions:`, cfg.conditions);
        }
      });
      
      console.log('💾 ========== handleScreenConfigUpdate END ==========');
      
      // CRITICAL: Verify the Map was actually updated before returning
      const verification = newMap.get(screenId);
      if (!verification || !verification.conditions || verification.conditions.length === 0) {
        console.error('❌ CRITICAL: Map update verification FAILED!');
        console.error('❌ Verification config:', verification);
        console.error('❌ Input config.conditions:', config.conditions);
        console.error('❌ Filtered conditions:', conditions);
      } else {
        console.log('✅ Map update verification PASSED');
        console.log('✅ Verified conditions count:', verification.conditions.length);
        console.log('✅ Verified conditions:', verification.conditions);
      }
      
      return newMap;
    });

    // Increment version to force re-render
    setConfigVersion((prev) => prev + 1);
    
    // CRITICAL: Rebuild edges AFTER state has updated
    // Use a longer delay to ensure React state update completes
    setTimeout(() => {
      console.log('🔄 Rebuilding edges after screen config update for:', screenId);
      buildEdgesFromConfigs();
    }, 300); // Increased delay to ensure state update completes

    // Update node label if display name changed
    setNodes((nds) =>
      nds.map((node) =>
        node.id === screenId
          ? { ...node, data: { ...node.data, label: config.displayName } }
          : node
      )
    );

    // Update panel content if it's currently open for this node
    setPanelContent((prev) => {
      if (prev.type === 'node' && prev.data) {
        const currentScreenId = prev.data.node.data.screenId || prev.data.node.id;
        if (currentScreenId === screenId) {
          return {
            ...prev,
            data: {
              ...prev.data,
              config,
            },
          };
        }
      }
      return prev;
    });

    // Rebuild edges after a short delay to ensure state is updated
    setTimeout(() => {
      buildEdgesFromConfigs();
    }, 100);
  }, [buildEdgesFromConfigs]); // Include buildEdgesFromConfigs in deps

  // Handle edge condition update
  const handleEdgeConditionUpdate = useCallback((edgeId: string, condition: NavigationCondition) => {
    console.log('Saving edge condition:', edgeId, condition);
    setEdgeConditions((prev) => {
      const newMap = new Map(prev);
      newMap.set(edgeId, condition);
      console.log('Updated edgeConditions:', Array.from(newMap.entries()));
      return newMap;
    });

    // Update edge label and style
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId
          ? {
              ...edge,
              label: condition.name,
              style: condition.enabled
                ? { stroke: '#ED6C02', strokeWidth: 2 }
                : { stroke: '#ccc', strokeWidth: 1 },
            }
          : edge
      )
    );

    // Update panel content if it's currently open for this edge
    setPanelContent((prev) => {
      if (prev.type === 'edge' && prev.data) {
        if (prev.data.edge.id === edgeId) {
          return {
            ...prev,
            data: {
              ...prev.data,
              condition,
            },
          };
        }
      }
      return prev;
    });

    // Rebuild edges from configs to ensure all conditions are visible
    setTimeout(() => {
      buildEdgesFromConfigs();
    }, 100);

    // Increment version to force re-render
    setConfigVersion((prev) => prev + 1);
  }, [buildEdgesFromConfigs]); // setEdges and setEdgeConditions are stable

  // Validate flow
  const handleValidate = useCallback(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate Start Screen (MANDATORY)
    if (!formValues.startScreen) {
      errors.push('Start screen is required');
    } else {
      const availableScreenIds = configuredScreens?.map((s) => s.screenId) || [];
      if (!availableScreenIds.includes(formValues.startScreen)) {
        errors.push(`Start screen "${formValues.startScreen}" not found in available screens`);
      }
      
      // Check if start screen is configured in screenConfigs
      const startScreenConfig = screenConfigs.get(formValues.startScreen);
      if (!startScreenConfig) {
        errors.push(`Start screen "${formValues.startScreen}" is not configured in flow`);
      }
    }

    // 2. Validate End Screen (MANDATORY) - At least one screen should have __FLOW_END__
    const hasEndScreen = Array.from(screenConfigs.values()).some(
      (config) => config.defaultNext === '__FLOW_END__'
    );
    if (!hasEndScreen) {
      errors.push('Flow must have at least one screen with "Flow End" as default next screen');
    }

    // 3. Validate Syntax (MANDATORY) - Check JSON structure and required fields
    try {
      // Check if flowId is valid
      if (!formValues.flowId || formValues.flowId.trim() === '') {
        errors.push('Flow ID is required');
      }

      // Check if scope is valid
      if (!formValues.scope?.productCode || formValues.scope.productCode.trim() === '') {
        errors.push('Product is required');
      }
      if (formValues.scope?.type === 'PARTNER' && (!formValues.scope?.partnerCode || formValues.scope.partnerCode.trim() === '')) {
        errors.push('Partner is required for PARTNER scope');
      }

      // Validate screen configs structure
      screenConfigs.forEach((config, screenId) => {
        // Check required fields
        if (!config.screenId) {
          errors.push(`Screen config missing screenId`);
        }
        if (!config.displayName) {
          warnings.push(`Screen "${screenId}" missing display name (optional)`);
        }
        if (!config.defaultNext) {
          warnings.push(`Screen "${screenId}" missing default next screen (optional)`);
        }

        // Validate conditions structure if they exist
        if (config.conditions && Array.isArray(config.conditions)) {
          config.conditions.forEach((cond, idx) => {
            if (!cond.id) {
              warnings.push(`Screen "${screenId}" condition ${idx + 1} missing id (optional)`);
            }
            if (!cond.condition) {
              warnings.push(`Screen "${screenId}" condition ${idx + 1} missing condition object (optional)`);
            }
            if (!cond.action) {
              warnings.push(`Screen "${screenId}" condition ${idx + 1} missing action object (optional)`);
            }
          });
        }
      });

      // Try to build flow config to check syntax
      try {
        const availableScreenIds = configuredScreens?.map((s) => s.screenId) || [];
        const screens = Array.from(screenConfigs.values()).map((config) => ({
          screenId: config.screenId,
          displayName: config.displayName,
          defaultNext: config.defaultNext,
          conditions: (config.conditions || []).map((cond) => ({
            if: {
              source: cond.condition?.source || 'FORM_DATA',
              field: cond.condition?.field,
              operator: cond.condition?.operator,
              value: cond.condition?.value,
            },
            then: {
              nextScreen: cond.action?.targetScreen || '',
            },
          })),
          services: config.services,
          allowBack: config.allowBack,
          allowSkip: config.allowSkip,
          maxRetries: config.maxRetries,
        }));

        const flowConfig: FlowConfig = {
          flowId: formValues.flowId,
          version: 1,
          status: flowStatus,
          scope: {
            type: formValues.scope.type,
            productCode: formValues.scope.productCode,
            partnerCode: formValues.scope.partnerCode,
          },
          startScreen: formValues.startScreen,
          screens,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'current_user',
          updatedBy: 'current_user',
        };

        // Validate JSON structure
        JSON.stringify(flowConfig); // This will throw if invalid
      } catch (error: any) {
        errors.push(`Syntax error in flow configuration: ${error.message || 'Invalid structure'}`);
      }
    } catch (error: any) {
      errors.push(`Syntax error: ${error.message || 'Invalid JSON structure'}`);
    }

    // All other validations are optional (warnings only)
    const availableScreenIds = configuredScreens?.map((s) => s.screenId) || [];
    
    // Note: Conditions are optional, so we don't warn about missing conditions

    // Optional: Check for invalid screen references (warning)
    screenConfigs.forEach((config) => {
      if (config.defaultNext && config.defaultNext !== '__FLOW_END__') {
        if (!availableScreenIds.includes(config.defaultNext)) {
          warnings.push(`Screen "${config.screenId}" has invalid defaultNext: "${config.defaultNext}" (optional)`);
        }
      }
    });

    const validation: FlowValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        screens: screenConfigs.size,
        conditionalRoutes: Array.from(screenConfigs.values()).reduce(
          (acc, s) => acc + (s.conditions?.length || 0),
          0
        ),
        services: 0, // Not validating services
        warnings: warnings.length,
      },
    };

    setValidationResult(validation);
    
    if (errors.length === 0) {
      toast.success('Flow validation passed!');
    } else {
      toast.error(`Flow validation failed: ${errors.length} error(s)`);
    }
  }, [formValues, configuredScreens, screenConfigs, flowStatus]);

  /**
   * Builds the complete FlowConfig from form values and screen configurations.
   * 
   * IMPORTANT: Journey Rules (allowBack, allowSkip, maxRetries)
   * - These settings are JOURNEY RULES, not UI controls
   * - Flow Builder is authoritative for journey correctness
   * - Backend enforces these rules at runtime:
   *   * On back request: backend checks allowBack, retry limits, flow history
   *   * Backend returns previous valid screen or rejects
   *   * Flow Builder defines WHERE back goes, not WHETHER UI shows it
   * - Frontend UI visibility is handled independently by runtime application
   */
  const buildFlowConfig = useCallback((): FlowConfig | null => {
    if (!formValues.flowId || !formValues.startScreen) {
      return null;
    }

    const availableScreenIds = configuredScreens?.map((s) => s.screenId) || [];
    console.log('🔨 buildFlowConfig - screenConfigs Map:', Array.from(screenConfigs.entries()));
    console.log('🔨 buildFlowConfig - screenConfigs size:', screenConfigs.size);
    
    const screens = Array.from(screenConfigs.values()).map((config) => {
      console.log('📦 Building screen config for:', config.screenId);
      console.log('📦 Config object:', JSON.stringify(config, null, 2));
      console.log('📦 Config.conditions:', config.conditions);
      console.log('📦 Config.conditions type:', typeof config.conditions);
      console.log('📦 Config.conditions isArray:', Array.isArray(config.conditions));
      console.log('📦 Config.conditions length:', config.conditions?.length || 0);
      
      const conditions = (config.conditions || []);
      console.log('📦 Processing conditions array:', conditions);
      
      const mappedConditions = conditions.map((cond, index) => {
        console.log(`📦 Mapping condition ${index}:`, JSON.stringify(cond, null, 2));
        return {
          if: {
            source: cond.condition?.source || 'FORM_DATA',
            field: cond.condition?.field,
            operator: cond.condition?.operator,
            value: cond.condition?.value,
          },
          then: {
            nextScreen: cond.action?.targetScreen || '',
          },
        };
      });
      
      console.log('📦 Mapped conditions:', mappedConditions);
      
      // Include journey rules (allowBack, allowSkip, maxRetries) in the flow config
      // These are backend-enforced rules, not UI control settings
      return {
        screenId: config.screenId,
        displayName: config.displayName,
        defaultNext: config.defaultNext,
        conditions: mappedConditions,
        services: config.services,
        allowBack: config.allowBack,
        allowSkip: config.allowSkip,
        maxRetries: config.maxRetries,
      };
    });
    
    console.log('🔨 buildFlowConfig - Final screens:', JSON.stringify(screens, null, 2));

    return {
      flowId: formValues.flowId,
      version: 1,
      status: flowStatus,
      scope: {
        type: formValues.scope.type,
        productCode: formValues.scope.productCode,
        partnerCode: formValues.scope.partnerCode,
      },
      startScreen: formValues.startScreen,
      screens,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current_user',
      updatedBy: 'current_user',
    };
  }, [formValues, configuredScreens, screenConfigs, flowStatus]);

  const onSubmit = (data: FlowFormData) => {
    console.log('🚀 onSubmit called. Current screenConfigs:', Array.from(screenConfigs.entries()));
    console.log('🚀 screenConfigs size:', screenConfigs.size);
    screenConfigs.forEach((config, screenId) => {
      console.log(`🚀 Screen ${screenId} conditions:`, config.conditions);
      console.log(`🚀 Screen ${screenId} conditions length:`, config.conditions?.length || 0);
    });
    
    const flowConfig = buildFlowConfig();
    if (!flowConfig) {
      toast.error('Please fill in all required fields');
      return;
    }

    console.log('🚀 Built flowConfig. Screens:', flowConfig.screens);
    flowConfig.screens.forEach((screen) => {
      console.log(`🚀 Flow screen ${screen.screenId} conditions:`, screen.conditions);
      console.log(`🚀 Flow screen ${screen.screenId} conditions length:`, screen.conditions?.length || 0);
    });

    // Validate before saving
    const availableScreenIds = configuredScreens?.map((s) => s.screenId) || [];
    const validation = validateFlow(flowConfig, availableScreenIds);
    
    if (!validation.isValid) {
      toast.error(`Flow has ${validation.errors.length} error(s). Please fix them before saving.`);
      setValidationResult(validation);
      return;
    }

    // Check if flow already exists
    const existing = getFlowConfigByFlowId(data.flowId);
    const configId = existing?.id || `flow_${Date.now()}`;

    // Get flow name from start screen
    const startScreenName = configuredScreens?.find(s => s.screenId === data.startScreen)?.screenName || data.flowId;

    const cachedConfig: Omit<CachedFlowConfig, 'createdAt' | 'updatedAt'> = {
      id: configId,
      flowId: data.flowId,
      flowName: startScreenName,
      version: existing ? String(parseInt(existing.version) + 1) : '1',
      status: flowStatus,
      config: flowConfig,
    };

    saveFlowConfig(cachedConfig);
    toast.success(`Flow "${data.flowId}" saved successfully!`);
    router.push('/flow-builder');
  };

  const handleCancel = () => {
    router.push('/flow-builder');
  };

  const handleSaveDraft = () => {
    const flowConfig = buildFlowConfig();
    if (!flowConfig) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Save as draft even if validation fails
    setFlowStatus('DRAFT');
    const existing = getFlowConfigByFlowId(formValues.flowId);
    const configId = existing?.id || `flow_${Date.now()}`;
    const startScreenName = configuredScreens?.find(s => s.screenId === formValues.startScreen)?.screenName || formValues.flowId;

    const cachedConfig: Omit<CachedFlowConfig, 'createdAt' | 'updatedAt'> = {
      id: configId,
      flowId: formValues.flowId,
      flowName: startScreenName,
      version: existing ? String(parseInt(existing.version) + 1) : '1',
      status: 'DRAFT',
      config: flowConfig,
    };

    saveFlowConfig(cachedConfig);
    toast.success('Draft saved successfully!');
  };

  const handleActivate = () => {
    if (!validationResult?.isValid) {
      toast.error('Please validate the flow before activating');
      return;
    }

    const flowConfig = buildFlowConfig();
    if (!flowConfig) {
      toast.error('Please fill in all required fields');
      return;
    }

    setFlowStatus('ACTIVE');
    const existing = getFlowConfigByFlowId(formValues.flowId);
    const configId = existing?.id || `flow_${Date.now()}`;
    const startScreenName = configuredScreens?.find(s => s.screenId === formValues.startScreen)?.screenName || formValues.flowId;

    const cachedConfig: Omit<CachedFlowConfig, 'createdAt' | 'updatedAt'> = {
      id: configId,
      flowId: formValues.flowId,
      flowName: startScreenName,
      version: existing ? String(parseInt(existing.version) + 1) : '1',
      status: 'ACTIVE',
      config: flowConfig,
    };

    saveFlowConfig(cachedConfig);
    toast.success('Flow activated successfully!');
    router.push('/flow-builder');
  };

  const availableScreens = configuredScreens?.map((s) => ({
    screenId: s.screenId,
    screenName: s.screenName,
  })) || [];

  const availableFields = [
    'personalDetails.panNumber',
    'personalDetails.name',
    'income.monthly',
    'income.employmentType',
    'creditScore',
    'loanAmount',
  ];

  const availableServices = ['bureau_check', 'fraud_check', 'income_verification'];

  return (
    <ProtectedRoute requiresEdit>
      <DashboardLayout>
        <PageHeader
          title="New Flow Configuration"
          description="Define cross-screen navigation and customer journey"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Flow Builder', href: '/flow-builder' },
            { label: 'New Flow' },
          ]}
          action={
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                label={`Status: ${flowStatus === 'DRAFT' ? '🟡 DRAFT' : '🟢 ACTIVE'}`}
                size="small"
                sx={{ marginRight: 1 }}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<Save />}
                onClick={handleSaveDraft}
              >
                Save Draft
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<CheckCircle />}
                onClick={handleValidate}
              >
                Validate Flow
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<PlayArrow />}
                onClick={handleActivate}
                disabled={!validationResult?.isValid}
              >
                Activate Flow
              </Button>
            </Box>
          }
        />

        {(!configuredScreens || configuredScreens.length === 0) && !screensLoading && (
          <Alert severity="warning" sx={{ marginBottom: 3 }}>
            No screen configurations found. Please create screens in Screen Builder first before creating flows.
          </Alert>
        )}

        {/* Tabs for Configuration and Preview */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Configuration" />
            <Tab label="JSON Preview" />
          </Tabs>
        </Box>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            {activeTab === 0 && (
            <Box>
            <Card sx={{ marginBottom: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>

                <Grid container spacing={3} sx={{ marginTop: 1 }}>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="flowId"
                      control={control}
                      rules={{ required: 'Flow ID is required' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Flow ID"
                          required
                          error={!!errors.flowId}
                          helperText={errors.flowId?.message}
                          placeholder="e.g., pl_flow_001"
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FlowScopeSelector />
                  </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="startScreen"
                    control={control}
                    rules={{ required: 'Start screen is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Start Screen"
                        select
                        required
                        error={!!errors.startScreen}
                        helperText={errors.startScreen?.message || 'Select from configured screens'}
                      >
                        {configuredScreens?.map((screen) => (
                          <MenuItem key={screen.screenId} value={screen.screenId}>
                            {screen.screenName}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Visual Flow Builder */}
          <Card sx={{ marginBottom: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Flow Diagram
              </Typography>

                  <ValidationBanner
                    validation={validationResult}
                    onViewAll={handleValidate}
                    onReviewWarnings={handleValidate}
                  />

              <Alert severity="info" sx={{ marginBottom: 2 }}>
                    Click on nodes or edges to configure them. Drag nodes to reposition.
              </Alert>

                  <Box sx={{ position: 'relative' }}>
              <Paper
                sx={{
                  height: 600,
                  border: '1px solid',
                  borderColor: 'divider',
                  position: 'relative',
                }}
              >
                {(!configuredScreens || configuredScreens.length === 0) ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: 'text.secondary',
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      No Screens Available
                    </Typography>
                    <Typography variant="body2">
                      Please create screens in Screen Builder first before building flows.
                    </Typography>
                  </Box>
                ) : (
                  <FlowCanvas
                  nodes={nodes}
                  edges={edges}
                    onNodeClick={onNodeClick}
                    onEdgeClick={onEdgeClick}
                    onConnect={onConnect}
                    onNodesChange={setNodes}
                    onEdgesChange={setEdges}
                  />
                )}
              </Paper>
                  </Box>

              <Box sx={{ marginTop: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Legend:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label="Start Screen"
                    size="small"
                    sx={{ bgcolor: '#0B2F70', color: 'white' }}
                  />
                  <Chip
                    label="Regular Screen"
                    size="small"
                    sx={{ bgcolor: '#00B2FF', color: 'white' }}
                  />
                  <Chip
                    label="End Screen"
                    size="small"
                    sx={{ bgcolor: '#2E7D32', color: 'white' }}
                  />
                  <Chip
                    label="Conditional Path"
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: '#ED6C02' }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" startIcon={<Cancel />} onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" startIcon={<Save />}>
              Save Flow
            </Button>
          </Box>
          </Box>
          )}
        </form>

        {activeTab === 1 && (
          <Card>
            <CardContent>
              <JsonViewer
                data={{
                  flowId: formValues.flowId,
                  scope: formValues.scope,
                  startScreen: formValues.startScreen,
                  screens: Array.from(screenConfigs.values()),
                  edges: Array.from(edgeConditions.entries()).map(([id, condition]) => ({
                    id,
                    condition,
                  })),
                }}
                title="Flow Configuration Preview"
                filename={`${formValues.flowId || 'flow'}_config.json`}
              />
            </CardContent>
          </Card>
          )}
        </FormProvider>

        {/* Right Panel */}
        <RightPanel open={rightPanelOpen} onClose={() => setRightPanelOpen(false)}>
          {panelContent.type === 'node' && panelContent.data && (() => {
            const screenId = panelContent.data.node.data.screenId || panelContent.data.node.id;
            // Get the latest config from screenConfigs, fallback to panelContent data
            const currentConfig = screenConfigs.get(screenId) || panelContent.data.config;
            console.log('📋 Rendering NodeConfigPanel for screen:', screenId);
            console.log('📋 Current config from screenConfigs:', JSON.stringify(currentConfig, null, 2));
            console.log('📋 Current config conditions:', currentConfig?.conditions);
            console.log('📋 Current config conditions length:', currentConfig?.conditions?.length || 0);
            return (
              <NodeConfigPanel
                key={`${screenId}-${configVersion}`} // Force re-render when config changes
                screen={currentConfig}
                availableScreens={availableScreens}
                availableFields={availableFields}
                availableServices={availableServices}
                onChange={(config) => {
                  console.log('📥 ========== NodeConfigPanel onChange START ==========');
                  console.log('📥 Screen ID:', screenId);
                  console.log('📥 Full config received:', JSON.stringify(config, null, 2));
                  console.log('📥 Config.conditions:', config.conditions);
                  console.log('📥 Config.conditions type:', typeof config.conditions);
                  console.log('📥 Config.conditions isArray:', Array.isArray(config.conditions));
                  console.log('📥 Config.conditions length:', config.conditions?.length || 0);
                  
                  if (!config.conditions || config.conditions.length === 0) {
                    console.error('❌ ERROR: Config has no conditions!');
                    console.error('❌ Config object:', config);
                  } else {
                    console.log('✅ Config HAS conditions:', config.conditions);
                  }
                  
                  console.log('📥 Calling handleScreenConfigUpdate...');
                  handleScreenConfigUpdate(screenId, config);
                  console.log('📥 ========== NodeConfigPanel onChange END ==========');
                }}
                onSave={() => setRightPanelOpen(false)}
              />
            );
          })()}

          {panelContent.type === 'edge' && panelContent.data && (() => {
            const edgeId = panelContent.data.edge.id;
            // Get the latest condition from edgeConditions, fallback to panelContent data
            const currentCondition = edgeConditions.get(edgeId) || panelContent.data.condition;
            return (
              <EdgeConfigPanel
                key={`${edgeId}-${configVersion}`} // Force re-render when condition changes
                condition={currentCondition}
                availableScreens={availableScreens}
                availableFields={availableFields}
                availableServices={availableServices}
                onChange={(condition) => {
                  console.log('EdgeConfigPanel onChange called:', edgeId, condition);
                  handleEdgeConditionUpdate(edgeId, condition);
                }}
                onSave={() => setRightPanelOpen(false)}
                onDelete={() => {
                  setEdgeConditions((prev) => {
                    const newMap = new Map(prev);
                    newMap.delete(edgeId);
                    return newMap;
                  });
                  setEdges((eds) => eds.filter((e) => e.id !== edgeId));
                  setRightPanelOpen(false);
                }}
              />
            );
          })()}
        </RightPanel>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default function NewFlowPage() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    }>
      <NewFlowPageContent />
    </Suspense>
  );
}
