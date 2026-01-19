// ============================================
// AUTHENTICATION & USER TYPES
// ============================================

export type UserRole = 'ADMIN' | 'CONFIG_EDITOR' | 'VIEWER';

export interface User {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  partners: string[];
  branches: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

// ============================================
// CONFIG COMMON TYPES
// ============================================

export type ConfigStatus = 'DRAFT' | 'ACTIVE' | 'DEPRECATED';
export type ScopeType = 'PRODUCT' | 'PARTNER' | 'BRANCH';

export interface ConfigScope {
  type: ScopeType;
  productCode: string;
  partnerCode?: string;
  branchCode?: string;
}

export interface ResolvedConfig<T = any> {
  config: T;
  resolvedFrom: ScopeType;
  inheritanceChain: string[];
}

export interface ConfigMetadata {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  changeReason?: string;
}

// ============================================
// SCREEN CONFIG TYPES (MODULE 1)
// ============================================

export type LayoutType = 'FORM' | 'REVIEW' | 'UPLOAD' | 'DASHBOARD' | 'MESSAGE';

export type FieldType = 
  | 'TEXT' 
  | 'NUMBER' 
  | 'DROPDOWN' 
  | 'DATE' 
  | 'TEXTAREA' 
  | 'FILE_UPLOAD' 
  | 'OTP_VERIFICATION'
  | 'API_VERIFICATION'
  | 'VERIFIED_INPUT'
  | 'CHECKBOX'
  | 'RADIO';

export type KeyboardType = 'default' | 'numeric' | 'email' | 'phone' | 'url';

export type DataSourceType = 'STATIC_JSON' | 'MASTER_DATA' | 'API';

export interface DataSource {
  type: DataSourceType;
  staticData?: Array<{ label: string; value: string }>;
  masterDataKey?: string;
  apiEndpoint?: string;
}

/**
 * Simple condition for field dependency evaluation.
 * Used for single field comparisons.
 */
export interface Condition {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'LESS_THAN' | 'GREATER_THAN' | 'IN' | 'NOT_IN' | 'EXISTS' | 'NOT_EXISTS';
  // value is REQUIRED for: EQUALS, NOT_EQUALS, IN, NOT_IN, GREATER_THAN, LESS_THAN
  // value MUST NOT be present for: EXISTS, NOT_EXISTS
  value?: string | number | string[];
}

/**
 * Condition Group DSL for complex dependency logic.
 * Supports AND/OR logic and nested conditions.
 * 
 * Backward Compatibility:
 * - Single conditions are internally treated as: { operator: "AND", conditions: [singleCondition] }
 * - No migration required for existing configs
 */
export interface ConditionGroup {
  operator: 'AND' | 'OR';
  conditions: Array<Condition | ConditionGroup>;
}

/**
 * Field dependency condition type.
 * Supports both legacy single conditions and new condition groups for backward compatibility.
 */
export type FieldCondition = Condition | ConditionGroup;

export interface ConsentConfig {
  title: string;
  subTitle: string;
  message?: string;
  positiveButtonText?: string;
  negativeButtonText?: string;
}

export interface OTPConfig {
  channel: 'MOBILE' | 'EMAIL' | 'BOTH';
  linkedField: string;
  otpLength: number;
  resendIntervalSeconds: number;
  consent?: ConsentConfig;
  sendOtpApi?: string;
  verifyOtpApi?: string;
  api?: {
    sendOtp: {
      endpoint: string;
      method: 'GET' | 'POST' | 'PUT';
    };
    verifyOtp: {
      endpoint: string;
      method: 'GET' | 'POST' | 'PUT';
    };
  };
}

export interface ApiVerificationConfig {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT';
  linkedFieldId?: string;
  requestMapping?: Record<string, string>;
  successCondition?: {
    field: string;
    equals: string | number | boolean;
  };
  messages?: {
    success?: string;
    failure?: string;
  };
  showDialog?: boolean;
}

export interface VerifiedInputConfig {
  input: {
    dataType: 'TEXT' | 'NUMBER';
    keyboard?: 'NUMBER' | 'TEXT';
    maxLength?: number;
    min?: number;
    max?: number;
  };
  verification: {
    mode: 'OTP' | 'API';
    otp?: {
      channel: 'MOBILE' | 'EMAIL' | 'BOTH';
      otpLength: number;
      resendIntervalSeconds: number;
      consent?: ConsentConfig;
      api?: {
        sendOtp: {
          endpoint: string;
          method: 'GET' | 'POST' | 'PUT';
        };
        verifyOtp: {
          endpoint: string;
          method: 'GET' | 'POST' | 'PUT';
        };
      };
    };
    api?: {
      endpoint: string;
      method: 'GET' | 'POST' | 'PUT';
      requestMapping?: Record<string, string>;
      successCondition?: {
        field: string;
        equals: string | number | boolean;
      };
    };
    messages?: {
      success?: string;
      failure?: string;
    };
    showDialog?: boolean;
  };
}

export interface DateConfig {
  validationType: 'ANY' | 'FUTURE' | 'PAST' | 'AGE_RANGE' | 'DATE_RANGE' | 'OFFSET';
  minAge?: number | null;
  maxAge?: number | null;
  minDate?: string | null; // YYYY-MM-DD format
  maxDate?: string | null; // YYYY-MM-DD format
  offset?: number | null;
  unit?: 'DAY' | 'MONTH' | 'YEAR' | null;
  dateFormat?: string; // Default: "YYYY-MM-DD"
}

export interface Field {
  id: string;
  type: FieldType;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  keyboard?: KeyboardType;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  value?: any; // Optional default/initial value
  dataSource?: DataSource;
  /**
   * Dropdown selection mode.
   * - SINGLE: Single selection (default, backward compatible)
   * - MULTIPLE: Multiple selection (stores value as array)
   * 
   * minSelections and maxSelections are only valid when selectionMode = MULTIPLE
   */
  selectionMode?: 'SINGLE' | 'MULTIPLE';
  /**
   * Minimum number of selections required (only for MULTIPLE mode)
   */
  minSelections?: number;
  /**
   * Maximum number of selections allowed (only for MULTIPLE mode)
   */
  maxSelections?: number;
  allowedFileTypes?: string[];
  maxFileSizeMB?: number;
  maxFiles?: number;
  otpConfig?: OTPConfig;
  apiVerificationConfig?: ApiVerificationConfig;
  verifiedInputConfig?: VerifiedInputConfig;
  dateConfig?: DateConfig;
  /**
   * Visibility dependency condition.
   * Supports both legacy single conditions and new condition groups.
   * Backward compatible: single conditions are automatically wrapped in AND groups.
   */
  visibleWhen?: FieldCondition;
  /**
   * Enabled state dependency condition.
   * Supports both legacy single conditions and new condition groups.
   * Backward compatible: single conditions are automatically wrapped in AND groups.
   */
  enabledWhen?: FieldCondition;
  /**
   * Required state dependency condition.
   * Supports both legacy single conditions and new condition groups.
   * Backward compatible: single conditions are automatically wrapped in AND groups.
   */
  requiredWhen?: FieldCondition;
  order?: number;
  parentId?: string;
  parentType?: 'SECTION' | 'SUBSECTION';
}

export interface SubSection {
  id: string;
  title: string;
  repeatable?: boolean;
  minInstances?: number;
  maxInstances?: number;
  instanceLabel?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  fields: Field[];
  order?: number;
  parentSectionId?: string;
}

export interface Section {
  id: string;
  title: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  fields?: Field[];
  subSections?: SubSection[];
  order?: number;
  contentType?: 'FIELDS' | 'SUBSECTIONS';
}

export interface Action {
  id: string;
  label: string;
  api: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  successMessage?: string;
  failureMessage?: string;
  mapErrorsToFields?: boolean;
}

/**
 * Layout configuration that supports both legacy string format and new object format
 * for backward compatibility.
 * 
 * Legacy format: layout: "FORM"
 * New format: layout: { type: "FORM", allowBackNavigation: true }
 */
export type LayoutConfig = LayoutType | {
  type: LayoutType;
  allowBackNavigation?: boolean;
};

export interface ScreenUIConfig {
  /**
   * Layout configuration. Can be a string (LayoutType) for backward compatibility,
   * or an object with type and optional allowBackNavigation flag.
   * 
   * UI-level back navigation control:
   * - Controls UI visibility ONLY (not navigation logic)
   * - Defaults to true if missing
   * - Final back navigation is enabled only if BOTH:
   *   * screen.ui.layout.allowBackNavigation == true (UI level)
   *   * flow.allowBackNavigation == true (Journey rule)
   */
  layout: LayoutConfig;
  sections: Section[];
  actions: Action[];
}

export interface ScreenConfig {
  configId: string;
  screenId: string;
  title: string;
  version: number;
  status: ConfigStatus;
  scope: ConfigScope;
  ui: ScreenUIConfig;
  validation?: ValidationConfig;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  changeReason?: string;
}

// ============================================
// VALIDATION CONFIG TYPES (MODULE 2)
// ============================================

export type ExecutionTarget = 'FRONTEND' | 'BACKEND' | 'BOTH';

export interface ValidationRule {
  id: string;
  fieldId: string;
  type: 'MIN' | 'MAX' | 'REGEX' | 'CUSTOM' | 'DEPENDENT' | 'REQUIRES_VERIFICATION';
  min?: number;
  max?: number;
  pattern?: string;
  message: string;
  dependsOn?: string;
  customCode?: string;
  executionTarget?: ExecutionTarget;
}

export interface ValidationConfig {
  configId: string;
  screenId: string;
  version: number;
  status: ConfigStatus;
  scope: ConfigScope;
  rules: ValidationRule[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  changeReason?: string;
}

// ============================================
// FIELD MAPPING TYPES (MODULE 3)
// ============================================

export type MappingType = 'DIRECT' | 'ONE_TO_MANY' | 'MANY_TO_ONE';
export type TransformerType = 
  | 'SPLIT_NAME' 
  | 'COMBINE_ADDRESS' 
  | 'SPLIT_ADDRESS' 
  | 'DATE_FORMAT' 
  | 'CURRENCY_FORMAT' 
  | 'PHONE_FORMAT' 
  | 'CUSTOM';

export interface MappingTarget {
  dbColumn: string;
  table: string;
  dataType: string;
}

export interface FieldMapping {
  fieldId?: string;
  fieldIds?: string[];
  mappingType: MappingType;
  transformer?: TransformerType;
  transformerCode?: string;
  target?: MappingTarget;
  targets?: MappingTarget[];
}

export interface MappingConfig {
  mappingId: string;
  screenId: string;
  version: number;
  status: ConfigStatus;
  scope: ConfigScope;
  mappings: FieldMapping[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  changeReason?: string;
}

// ============================================
// FLOW CONFIG TYPES (MODULE 4)
// ============================================

export type ConditionSource = 
  | 'FORM_DATA' 
  | 'VALIDATION_RESULT' 
  | 'SERVICE_RESPONSE' 
  | 'APPLICATION_STATE' 
  | 'USER_PROFILE' 
  | 'CUSTOM_CODE';

export type FlowOperator = 
  | 'EQUALS' 
  | 'NOT_EQUALS' 
  | 'LESS_THAN' 
  | 'GREATER_THAN' 
  | 'GREATER_THAN_OR_EQUALS'
  | 'LESS_THAN_OR_EQUALS'
  | 'IN' 
  | 'NOT_IN'
  | 'EXISTS' 
  | 'NOT_EXISTS'
  | 'CONTAINS'
  | 'STARTS_WITH'
  | 'ENDS_WITH';

export type ConditionOperator = FlowOperator;

export type NavigationActionType = 
  | 'NAVIGATE' 
  | 'CALL_SERVICE' 
  | 'SKIP' 
  | 'END_FLOW' 
  | 'LOOP_BACK';

export interface ServiceCall {
  serviceId: string;
  serviceName: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT';
  requestMapping?: Array<{ sourceField: string; targetField: string }>;
  responseMapping?: Array<{ sourceField: string; targetField: string }>;
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    retryDelayMs: number;
  };
  onError?: 'FAIL_FLOW' | 'CONTINUE' | 'ROUTE_TO_SCREEN';
  errorScreen?: string;
  cachePolicy?: {
    enabled: boolean;
    ttlSeconds: number;
    cacheKey?: string;
  };
}

export interface NavigationAction {
  type: NavigationActionType;
  targetScreen?: string;
  service?: ServiceCall;
  onSuccess?: NavigationAction;
  onFailure?: NavigationAction;
  metadata?: Record<string, any>;
}

export interface FlowConditionExpression {
  id?: string;
  logicOperator?: 'AND' | 'OR';
  conditions?: FlowConditionExpression[]; // For nested conditions
  source?: ConditionSource;
  field?: string;
  operator?: ConditionOperator;
  value?: any;
  customCode?: {
    language: 'JAVASCRIPT';
    code: string;
    timeout?: number;
  };
}

export interface NavigationCondition {
  id: string;
  priority: number;
  enabled: boolean;
  name: string;
  condition: FlowConditionExpression;
  action: NavigationAction;
}

export interface FlowScreenConfig {
  screenId: string;
  displayName: string;
  defaultNext: string;
  services?: {
    preLoad?: ServiceCall[];
    onSubmit?: ServiceCall[];
    background?: ServiceCall[];
  };
  conditions: NavigationCondition[];
  /**
   * Execution order in the flow sequence.
   * Lower number = earlier execution (1 is first).
   * Used for runtime execution priority.
   */
  order?: number;
  /**
   * Whether this screen is REQUIRED in the flow.
   * - true: User must complete this screen (cannot be skipped)
   * - false: Screen may be skipped via conditions
   * Default: false (except first screen which defaults to true)
   */
  required?: boolean;
  /**
   * JOURNEY RULE: Allow Back Navigation
   * 
   * This setting defines a journey-level rule that determines whether the backend
   * permits moving backward from this screen node in the flow.
   * 
   * IMPORTANT: This is NOT a UI control setting.
   * - Flow Builder defines WHERE back navigation goes, not WHETHER UI shows it
   * - Backend enforces this rule by checking allowBack along with retry limits
   *   and flow history when processing back navigation requests
   * - Frontend UI visibility is handled independently by the runtime application
   * 
   * Runtime Behavior:
   * - On back request, backend checks: flow.allowBack, retry limits, flow history
   * - Backend returns previous valid screen or rejects the request
   * - Flow Builder is authoritative for journey correctness
   */
  allowBack?: boolean;
  /**
   * JOURNEY RULE: Allow Skip
   * 
   * This setting defines a journey-level rule that determines whether the backend
   * permits skipping this screen in the journey flow.
   * 
   * IMPORTANT: This is NOT a UI control setting.
   * - Backend validates this rule when processing skip requests
   * - Frontend UI visibility is handled independently by the runtime application
   */
  allowSkip?: boolean;
  /**
   * JOURNEY RULE: Max Retries
   * 
   * This setting defines the maximum number of retry attempts allowed for this
   * screen node in the journey flow.
   * 
   * IMPORTANT: This is enforced by the backend.
   * - Backend tracks retry attempts and enforces this limit
   * - Used in conjunction with allowBack to determine valid navigation paths
   */
  maxRetries?: number;
}

export interface FlowCondition {
  if: {
    source: ConditionSource;
    field?: string;
    service?: string;
    operator?: FlowOperator;
    value?: string | number | string[];
    executionTarget?: ExecutionTarget;
    language?: 'JAVA' | 'KOTLIN' | 'JAVASCRIPT';
    code?: string;
    inputs?: {
      formData?: boolean;
      validationResult?: boolean;
      serviceResponses?: boolean;
      applicationContext?: boolean;
    };
  };
  then: {
    nextScreen: string;
  };
}

export interface ScreenFlowNode {
  screenId: string;
  displayName?: string;
  defaultNext: string;
  conditions?: FlowCondition[];
  services?: {
    preLoad?: ServiceCall[];
    onSubmit?: ServiceCall[];
    background?: ServiceCall[];
  };
  /**
   * Execution order in the flow sequence.
   * Lower number = earlier execution (1 is first).
   */
  order?: number;
  /**
   * Whether this screen is REQUIRED in the flow.
   * - true: User must complete this screen (cannot be skipped)
   * - false: Screen may be skipped via conditions
   */
  required?: boolean;
  /**
   * JOURNEY RULE: Allow Back Navigation
   * Backend-enforced rule determining if backward navigation is permitted from this node.
   * Flow Builder defines WHERE back goes, not WHETHER UI shows it.
   */
  allowBack?: boolean;
  /**
   * JOURNEY RULE: Allow Skip
   * Backend-enforced rule determining if this screen can be skipped in the journey.
   */
  allowSkip?: boolean;
  /**
   * JOURNEY RULE: Max Retries
   * Backend-enforced maximum retry attempts for this screen node.
   */
  maxRetries?: number;
}

/**
 * Dashboard appearance metadata for Flow tiles in Home screen.
 * This metadata is ONLY used for Dashboard/Home UI rendering.
 * It does NOT affect flow navigation logic or runtime decisioning.
 */
export interface DashboardMeta {
  title: string;
  description: string;
  icon: string; // Icon key (e.g., 'APPLICANT_ONBOARDING', 'CREDIT_CHECK')
  ui: {
    backgroundColor: string; // HEX color (e.g., '#0B2F70')
    textColor: string;       // HEX color (e.g., '#FFFFFF')
    iconColor: string;       // HEX color (e.g., '#00B2FF')
  };
}

export interface FlowConfig {
  flowId: string;
  version: number;
  status: ConfigStatus;
  scope: ConfigScope; // PRODUCT or PARTNER only (BRANCH not allowed for flows)
  startScreen: string;
  screens: ScreenFlowNode[];
  /**
   * OPTIONAL: Dashboard appearance metadata for Home screen tiles.
   * Used ONLY for UI rendering, not for flow logic.
   * Backward compatible: flows without dashboardMeta continue to work.
   */
  dashboardMeta?: DashboardMeta;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  changeReason?: string;
}

export interface FlowValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary?: {
    screens: number;
    conditionalRoutes: number;
    services: number;
    warnings: number;
  };
}

// ============================================
// MASTER DATA TYPES
// ============================================

export interface Partner {
  code: string;
  name: string;
  active?: boolean;
}

export interface Branch {
  code: string;
  name: string;
  partnerCode: string;
  active?: boolean;
}

export interface Product {
  code: string;
  name: string;
  active?: boolean;
}

export interface Screen {
  screenId: string;
  screenName: string;
  description: string;
}

// ============================================
// AUDIT TRAIL TYPES
// ============================================

export interface AuditLogEntry {
  auditId: string;
  configType: 'SCREEN' | 'VALIDATION' | 'MAPPING' | 'FLOW';
  configId: string;
  action: 'CREATE' | 'UPDATE' | 'ACTIVATE' | 'DEPRECATE' | 'DELETE';
  userId: string;
  userName: string;
  timestamp: string;
  changes: Record<string, unknown>;
  changeReason?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface NextScreenResponse {
  nextScreenId: string;
  screenConfig: ScreenConfig;
}

// ============================================
// FILTER & SEARCH TYPES
// ============================================

export interface ConfigFilters {
  partnerCode?: string;
  branchCode?: string;
  screenId?: string;
  status?: ConfigStatus;
  search?: string;
}

export interface FlowFilters {
  partnerCode?: string;
  productCode?: string;
  status?: ConfigStatus;
}

// ============================================
// BACKEND API TYPES (FROM SWAGGER)
// ============================================

/**
 * Backend ScreenConfig entity - represents the API response/request format
 */
export interface BackendScreenConfig {
  configId?: number;
  screenId: string;
  productCode?: string;
  partnerCode?: string;
  branchCode?: string;
  version?: number;
  status: 'DRAFT' | 'ACTIVE' | 'DEPRECATED';
  uiConfig: Record<string, any>;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  lockVersion?: number;
}

/**
 * Backend FlowConfig entity
 */
export interface BackendFlowConfig {
  configId?: number;
  flowId: string;
  productCode?: string;
  partnerCode?: string;
  branchCode?: string;
  version?: number;
  status: 'DRAFT' | 'ACTIVE' | 'DEPRECATED';
  flowDefinition: Record<string, any>;
  /**
   * OPTIONAL: Dashboard metadata for Home screen rendering.
   * Backend persists this as part of FlowConfig JSON.
   */
  dashboardMeta?: DashboardMeta;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  lockVersion?: number;
}

/**
 * Backend ValidationConfig entity
 */
export interface BackendValidationConfig {
  configId?: number;
  screenId: string;
  productCode?: string;
  partnerCode?: string;
  branchCode?: string;
  version?: number;
  status: 'DRAFT' | 'ACTIVE' | 'DEPRECATED';
  validationRules: Record<string, any>;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  lockVersion?: number;
}

/**
 * Backend FieldMappingConfig entity
 */
export interface BackendFieldMappingConfig {
  configId?: number;
  screenId: string;
  productCode?: string;
  partnerCode?: string;
  branchCode?: string;
  version?: number;
  status: 'DRAFT' | 'ACTIVE' | 'DEPRECATED';
  mappings: Record<string, any>;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  lockVersion?: number;
}

/**
 * Runtime API Request - Next Screen
 */
export interface NextScreenRequest {
  applicationId?: number;
  currentScreenId: string;
  formData: Record<string, any>;
  productCode: string;
  partnerCode: string;
  branchCode?: string;
}

/**
 * Runtime API Response - Next Screen
 */
export interface BackendNextScreenResponse {
  applicationId?: number;
  nextScreenId: string;
  screenConfig: Record<string, any>;
  status: string;
}

/**
 * Standard Backend Error Response
 */
export interface BackendErrorResponse {
  errorCode?: string;
  message: string;
  fieldErrors?: Array<{
    fieldId: string;
    message: string;
  }>;
  timestamp?: string;
  path?: string;
}
