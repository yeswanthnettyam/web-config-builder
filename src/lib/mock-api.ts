// Mock API responses for development
// This will be replaced with actual API calls once backend is ready

import {
  LoginResponse,
  User,
  Partner,
  Branch,
  Product,
  Screen,
  ScreenConfig,
  FlowConfig,
  MappingConfig,
  AuditLogEntry,
} from '@/types';

// Mock delay to simulate network requests
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock Users
export const mockUsers: User[] = [
  {
    userId: '1',
    email: 'admin@kaleidofin.com',
    name: 'Admin User',
    role: 'ADMIN',
    partners: ['PARTNER_001', 'PARTNER_002'],
    branches: ['BRANCH_001', 'BRANCH_002'],
  },
  {
    userId: '2',
    email: 'editor@kaleidofin.com',
    name: 'Config Editor',
    role: 'CONFIG_EDITOR',
    partners: ['PARTNER_001'],
    branches: ['BRANCH_001'],
  },
  {
    userId: '3',
    email: 'viewer@kaleidofin.com',
    name: 'Viewer User',
    role: 'VIEWER',
    partners: ['PARTNER_001'],
    branches: [],
  },
];

// Mock Partners
export const mockPartners: Partner[] = [
  { partnerCode: 'PARTNER_001', partnerName: 'Partner One', active: true },
  { partnerCode: 'PARTNER_002', partnerName: 'Partner Two', active: true },
  { partnerCode: 'PARTNER_003', partnerName: 'Partner Three', active: false },
];

// Mock Branches
export const mockBranches: Branch[] = [
  {
    branchCode: 'BRANCH_001',
    branchName: 'Main Branch',
    partnerCode: 'PARTNER_001',
    active: true,
  },
  {
    branchCode: 'BRANCH_002',
    branchName: 'Secondary Branch',
    partnerCode: 'PARTNER_001',
    active: true,
  },
  {
    branchCode: 'BRANCH_003',
    branchName: 'Partner Two Branch',
    partnerCode: 'PARTNER_002',
    active: true,
  },
];

// Mock Products
export const mockProducts: Product[] = [
  { productCode: 'PL', productName: 'Personal Loan', active: true },
  { productCode: 'BL', productName: 'Business Loan', active: true },
  { productCode: 'HL', productName: 'Home Loan', active: true },
];

// Mock Screens - This will be dynamically populated from screen configs
export let mockScreens: Screen[] = [
  {
    screenId: 'personal_details',
    screenName: 'Personal Details',
    description: 'Capture customer personal information',
  },
  {
    screenId: 'income_details',
    screenName: 'Income Details',
    description: 'Capture customer income information',
  },
  {
    screenId: 'document_upload',
    screenName: 'Document Upload',
    description: 'Upload required documents',
  },
  {
    screenId: 'bank_details',
    screenName: 'Bank Details',
    description: 'Capture bank account information',
  },
  {
    screenId: 'review_submit',
    screenName: 'Review & Submit',
    description: 'Review application before submission',
  },
];

// Function to add new screen from config
export const addScreenToMockData = (screenId: string, screenName: string) => {
  const existingScreen = mockScreens.find(s => s.screenId === screenId);
  if (!existingScreen) {
    mockScreens.push({
      screenId,
      screenName,
      description: `Screen: ${screenName}`,
    });
  }
};

// Mock Login
export const mockLogin = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  await delay(1000);

  const user = mockUsers.find((u) => u.email === email);

  if (!user || password !== 'admin123') {
    throw new Error('Invalid credentials');
  }

  return {
    user,
    token: 'mock-jwt-token-' + user.userId,
    refreshToken: 'mock-refresh-token-' + user.userId,
  };
};

// Mock Get Current User
export const mockGetCurrentUser = async (): Promise<User> => {
  await delay(500);
  return mockUsers[0];
};

// Mock Screen Configs
export const mockScreenConfigs: ScreenConfig[] = [
  {
    configId: 'config_001',
    screenId: 'personal_details',
    title: 'Personal Details',
    version: 1,
    status: 'ACTIVE',
    scope: {
      type: 'PARTNER',
      partnerCode: 'PARTNER_001',
    },
    ui: {
      layout: 'FORM',
      sections: [
        {
          id: 'section_1',
          title: 'Basic Information',
          fields: [
            {
              id: 'full_name',
              type: 'TEXT',
              label: 'Full Name',
              required: true,
              placeholder: 'Enter your full name',
            },
            {
              id: 'email',
              type: 'TEXT',
              label: 'Email Address',
              required: true,
              keyboard: 'email',
              placeholder: 'your@email.com',
            },
            {
              id: 'mobile',
              type: 'TEXT',
              label: 'Mobile Number',
              required: true,
              keyboard: 'phone',
              placeholder: '10-digit mobile number',
              maxLength: 10,
            },
          ],
        },
      ],
      actions: [
        {
          id: 'save',
          label: 'Save & Continue',
          api: '/application/save',
          method: 'POST',
          successMessage: 'Details saved successfully',
          failureMessage: 'Failed to save details',
        },
      ],
    },
    metadata: {
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      createdBy: 'admin@kaleidofin.com',
      updatedBy: 'admin@kaleidofin.com',
    },
  },
];

// Mock Flow Configs
export const mockFlowConfigs: FlowConfig[] = [
  {
    flowId: 'flow_pl_001',
    version: 1,
    status: 'ACTIVE',
    partnerCode: 'PARTNER_001',
    productCode: 'PL',
    startScreen: 'personal_details',
    screens: [
      {
        screenId: 'personal_details',
        defaultNext: 'income_details',
        conditions: [],
      },
      {
        screenId: 'income_details',
        defaultNext: 'document_upload',
        conditions: [
          {
            if: {
              source: 'FORM_DATA',
              field: 'income_type',
              operator: 'EQUALS',
              value: 'salaried',
            },
            then: {
              nextScreen: 'bank_details',
            },
          },
        ],
      },
      {
        screenId: 'document_upload',
        defaultNext: 'review_submit',
        conditions: [],
      },
      {
        screenId: 'bank_details',
        defaultNext: 'review_submit',
        conditions: [],
      },
      {
        screenId: 'review_submit',
        defaultNext: '',
        conditions: [],
      },
    ],
    metadata: {
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      createdBy: 'admin@kaleidofin.com',
      updatedBy: 'admin@kaleidofin.com',
    },
  },
];

// Mock Mapping Configs
export const mockMappingConfigs: MappingConfig[] = [];

// Mock Audit Logs
export const mockAuditLogs: AuditLogEntry[] = [
  {
    auditId: 'audit_001',
    configType: 'SCREEN',
    configId: 'config_001',
    action: 'CREATE',
    userId: '1',
    userName: 'Admin User',
    timestamp: '2025-01-01T00:00:00Z',
    changes: {},
    changeReason: 'Initial configuration',
  },
];

// Export mock data for master data
export const mockMasterData = {
  partners: mockPartners,
  branches: mockBranches,
  products: mockProducts,
  screens: mockScreens,
};
