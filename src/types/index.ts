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

export interface Condition {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'LESS_THAN' | 'GREATER_THAN' | 'IN';
  value: string | number | string[];
}

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
  maxLength?: number;
  dataSource?: DataSource;
  allowedFileTypes?: string[];
  maxFileSizeMB?: number;
  maxFiles?: number;
  otpConfig?: OTPConfig;
  apiVerificationConfig?: ApiVerificationConfig;
  verifiedInputConfig?: VerifiedInputConfig;
  visibleWhen?: Condition;
  enabledWhen?: Condition;
  requiredWhen?: Condition;
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

export interface ScreenUIConfig {
  layout: LayoutType;
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
  type: 'MIN' | 'MAX' | 'REGEX' | 'CUSTOM' | 'DEPENDENT';
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
  allowBack?: boolean;
  allowSkip?: boolean;
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
  allowBack?: boolean;
  allowSkip?: boolean;
  maxRetries?: number;
}

export interface FlowConfig {
  flowId: string;
  version: number;
  status: ConfigStatus;
  scope: ConfigScope; // PRODUCT or PARTNER only (BRANCH not allowed for flows)
  startScreen: string;
  screens: ScreenFlowNode[];
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
  partnerCode: string;
  partnerName: string;
  active: boolean;
}

export interface Branch {
  branchCode: string;
  branchName: string;
  partnerCode: string;
  active: boolean;
}

export interface Product {
  productCode: string;
  productName: string;
  active: boolean;
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

