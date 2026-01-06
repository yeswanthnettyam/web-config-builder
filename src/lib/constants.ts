// Branding
export const BRAND_NAME = 'Kaleidofin';
export const BRAND_PRIMARY_COLOR = '#0B2F70';
export const BRAND_ACCENT_COLOR = '#00B2FF';

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
export const API_TIMEOUT = 30000; // 30 seconds

// Authentication
export const TOKEN_KEY = 'los_auth_token';
export const REFRESH_TOKEN_KEY = 'los_refresh_token';
export const USER_KEY = 'los_user';

// Roles
export const ROLES = {
  ADMIN: 'ADMIN',
  CONFIG_EDITOR: 'CONFIG_EDITOR',
  VIEWER: 'VIEWER',
} as const;

// Config Statuses
export const CONFIG_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  DEPRECATED: 'DEPRECATED',
} as const;

// Scope Types
export const SCOPE_TYPES = {
  PRODUCT: 'PRODUCT',
  PARTNER: 'PARTNER',
  BRANCH: 'BRANCH',
} as const;

// Field Types
export const FIELD_TYPES = [
  { value: 'TEXT', label: 'Text Input' },
  { value: 'NUMBER', label: 'Number Input' },
  { value: 'DROPDOWN', label: 'Dropdown' },
  { value: 'DATE', label: 'Date Picker' },
  { value: 'TEXTAREA', label: 'Text Area' },
  { value: 'FILE_UPLOAD', label: 'File Upload' },
  { value: 'VERIFIED_INPUT', label: 'Verified Input' },
  { value: 'OTP_VERIFICATION', label: 'OTP Verification' },
  { value: 'API_VERIFICATION', label: 'API Verification' },
  { value: 'CHECKBOX', label: 'Checkbox' },
  { value: 'RADIO', label: 'Radio Button' },
] as const;

// Layout Types
export const LAYOUT_TYPES = [
  { value: 'FORM', label: 'Form' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'UPLOAD', label: 'Upload' },
  { value: 'DASHBOARD', label: 'Dashboard' },
  { value: 'MESSAGE', label: 'Message' },
] as const;

// Data Source Types
export const DATA_SOURCE_TYPES = [
  { value: 'STATIC_JSON', label: 'Static JSON' },
  { value: 'MASTER_DATA', label: 'Master Data' },
  { value: 'API', label: 'API Endpoint' },
] as const;

// Operators
export const OPERATORS = [
  { value: 'EQUALS', label: 'Equals' },
  { value: 'NOT_EQUALS', label: 'Not Equals' },
  { value: 'LESS_THAN', label: 'Less Than' },
  { value: 'GREATER_THAN', label: 'Greater Than' },
  { value: 'IN', label: 'In' },
  { value: 'EXISTS', label: 'Exists' },
  { value: 'NOT_EXISTS', label: 'Not Exists' },
] as const;

// Validation Types
export const VALIDATION_TYPES = [
  { value: 'MIN_LENGTH', label: 'Minimum Length' },
  { value: 'MAX_LENGTH', label: 'Maximum Length' },
  { value: 'LENGTH_RANGE', label: 'Length Range' },
  { value: 'MIN_VALUE', label: 'Minimum Value' },
  { value: 'MAX_VALUE', label: 'Maximum Value' },
  { value: 'VALUE_RANGE', label: 'Value Range' },
  { value: 'REGEX', label: 'Regex Pattern' },
  { value: 'EMAIL', label: 'Email Format' },
  { value: 'PHONE', label: 'Phone Number' },
  { value: 'CUSTOM', label: 'Custom Code' },
] as const;

// Mapping Types
export const MAPPING_TYPES = [
  { value: 'DIRECT', label: 'Direct (1:1)' },
  { value: 'ONE_TO_MANY', label: 'One to Many (1:N)' },
  { value: 'MANY_TO_ONE', label: 'Many to One (N:1)' },
] as const;

// Transformer Types
export const TRANSFORMER_TYPES = [
  { value: 'SPLIT_NAME', label: 'Split Name' },
  { value: 'COMBINE_ADDRESS', label: 'Combine Address' },
  { value: 'SPLIT_ADDRESS', label: 'Split Address' },
  { value: 'DATE_FORMAT', label: 'Date Format' },
  { value: 'CURRENCY_FORMAT', label: 'Currency Format' },
  { value: 'PHONE_FORMAT', label: 'Phone Format' },
  { value: 'CUSTOM', label: 'Custom Code' },
] as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Keyboard Types
export const KEYBOARD_TYPES = [
  { value: 'default', label: 'Default' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'url', label: 'URL' },
] as const;

// OTP Channels
export const OTP_CHANNELS = [
  { value: 'MOBILE', label: 'Mobile' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'BOTH', label: 'Both' },
] as const;

// Verification Modes
export const VERIFICATION_MODES = [
  { value: 'OTP', label: 'OTP Verification' },
  { value: 'API', label: 'API Verification' },
] as const;

// Input Data Types
export const INPUT_DATA_TYPES = [
  { value: 'TEXT', label: 'Text' },
  { value: 'NUMBER', label: 'Number' },
] as const;

// Input Keyboard Types
export const INPUT_KEYBOARD_TYPES = [
  { value: 'TEXT', label: 'Text' },
  { value: 'NUMBER', label: 'Number' },
] as const;

// Execution Targets
export const EXECUTION_TARGETS = [
  { value: 'FRONTEND', label: 'Frontend' },
  { value: 'BACKEND', label: 'Backend' },
  { value: 'BOTH', label: 'Both' },
] as const;

// Code Languages
export const CODE_LANGUAGES = [
  { value: 'JAVASCRIPT', label: 'JavaScript' },
  { value: 'TYPESCRIPT', label: 'TypeScript' },
  { value: 'PYTHON', label: 'Python' },
  { value: 'JAVA', label: 'Java' },
  { value: 'GROOVY', label: 'Groovy' },
] as const;

// Condition Sources
export const CONDITION_SOURCES = [
  { value: 'FORM_DATA', label: 'Form Data' },
  { value: 'VALIDATION_RESULT', label: 'Validation Result' },
  { value: 'SERVICE_RESPONSE', label: 'Service Response' },
  { value: 'APPLICATION_STATE', label: 'Application State' },
  { value: 'USER_PROFILE', label: 'User Profile' },
  { value: 'CUSTOM_CODE', label: 'Custom Code' },
] as const;

// HTTP Methods
export const HTTP_METHODS = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
] as const;

// Validation Messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  MIN_LENGTH: (min: number) => `Minimum ${min} characters required`,
  MAX_LENGTH: (max: number) => `Maximum ${max} characters allowed`,
  MIN_VALUE: (min: number) => `Minimum value is ${min}`,
  MAX_VALUE: (max: number) => `Maximum value is ${max}`,
  PATTERN_MISMATCH: 'Invalid format',
} as const;

// Accessibility
export const A11Y_MESSAGES = {
  SKIP_TO_CONTENT: 'Skip to main content',
  LOADING: 'Loading content',
  ERROR: 'Error occurred',
  SUCCESS: 'Action successful',
} as const;

// Feature Flags (for future use)
export const FEATURES = {
  ENABLE_FLOW_BUILDER: true,
  ENABLE_CUSTOM_CODE: true,
  ENABLE_AUDIT_TRAIL: true,
  ENABLE_IMPORT_EXPORT: true,
} as const;

