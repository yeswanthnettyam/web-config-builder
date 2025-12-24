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
export type ScopeType = 'PARTNER' | 'BRANCH';

export interface ConfigScope {
  type: ScopeType;
  partnerCode: string;
  branchCode?: string;
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

export interface OTPConfig {
  channel: 'MOBILE' | 'EMAIL' | 'BOTH';
  linkedField: string;
  otpLength: number;
  resendIntervalSeconds: number;
  consent: {
    title: string;
    subTitle: string;
  };
  sendOtpApi: string;
  verifyOtpApi: string;
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
  visibleWhen?: Condition;
  enabledWhen?: Condition;
  requiredWhen?: Condition;
}

export interface SubSection {
  id: string;
  title: string;
  repeatable?: boolean;
  minInstances?: number;
  maxInstances?: number;
  instanceLabel?: string;
  fields: Field[];
}

export interface Section {
  id: string;
  title: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  fields?: Field[];
  subSections?: SubSection[];
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
  metadata: ConfigMetadata;
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
  rules: ValidationRule[];
  metadata: ConfigMetadata;
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
  mappings: FieldMapping[];
  metadata: ConfigMetadata;
}

// ============================================
// FLOW CONFIG TYPES (MODULE 4)
// ============================================

export type ConditionSource = 'FORM' | 'VALIDATION' | 'SERVICE_RESPONSE' | 'CUSTOM_CODE';
export type FlowOperator = 'EQUALS' | 'NOT_EQUALS' | 'LESS_THAN' | 'GREATER_THAN' | 'IN' | 'EXISTS' | 'NOT_EXISTS';

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
  defaultNext: string;
  conditions?: FlowCondition[];
}

export interface FlowConfig {
  flowId: string;
  version: number;
  status: ConfigStatus;
  partnerCode: string;
  productCode: string;
  startScreen: string;
  screens: ScreenFlowNode[];
  metadata: ConfigMetadata;
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

