# Architecture Documentation

## Overview

The LOS Configuration Platform is a modern web application built with Next.js, React, and TypeScript. It follows a component-based architecture with clear separation of concerns.

## Technology Stack

### Core
- **Framework:** Next.js 14.2.18 (App Router)
- **Language:** TypeScript 5.6.3
- **UI Library:** React 18.3.1
- **Component Library:** Material-UI 5.16.7

### State Management
- **Server State:** React Query 5.59.20
- **Authentication:** React Context
- **Form State:** React Hook Form 7.53.2

### Validation & Schema
- **Form Validation:** Zod 3.23.8
- **JSON Schema:** AJV 8.17.1

### Visualization
- **Flow Diagrams:** React Flow 11.11.4

### HTTP Client
- **API Client:** Axios 1.7.8

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Dashboard
│   ├── login/                 # Login page
│   ├── screen-builder/        # Module 1: Screen Builder
│   ├── validation-builder/    # Module 2: Validation Builder
│   ├── field-mapping/         # Module 3: Field Mapping
│   └── flow-builder/          # Module 4: Flow Builder
│
├── components/                 # React components
│   ├── layout/                # Layout components
│   │   ├── DashboardLayout.tsx
│   │   └── ProtectedRoute.tsx
│   └── shared/                # Shared/reusable components
│       ├── PageHeader.tsx
│       ├── StatusChip.tsx
│       ├── EmptyState.tsx
│       ├── LoadingState.tsx
│       ├── ErrorState.tsx
│       ├── ConfirmDialog.tsx
│       ├── FilterPanel.tsx
│       ├── AuditTrail.tsx
│       └── JsonViewer.tsx
│
├── contexts/                   # React contexts
│   └── AuthContext.tsx        # Authentication state
│
├── hooks/                      # Custom React hooks
│   ├── use-master-data.ts     # Master data queries
│   └── use-screen-configs.ts  # Screen config queries
│
├── lib/                        # Utilities and configurations
│   ├── theme.ts               # MUI theme
│   ├── constants.ts           # App constants
│   ├── utils.ts               # Utility functions
│   ├── api-client.ts          # Axios instance
│   ├── api-endpoints.ts       # API endpoint definitions
│   └── mock-api.ts            # Mock API responses
│
├── types/                      # TypeScript types
│   └── index.ts               # All type definitions
│
└── styles/                     # Global styles
    └── globals.css            # Global CSS
```

## Key Architectural Patterns

### 1. Component-Based Architecture

Components are organized by feature and reusability:

- **Page Components:** Route-level components in `app/` directory
- **Layout Components:** Shared layouts in `components/layout/`
- **Shared Components:** Reusable UI components in `components/shared/`

### 2. State Management Strategy

#### Server State (React Query)
- All API calls use React Query
- Automatic caching and refetching
- Optimistic updates for mutations
- Loading and error states handled automatically

```typescript
const { data, isLoading, error } = useScreenConfigs(filters);
```

#### Client State (React Context)
- Authentication state only
- User profile information
- Minimal use to avoid prop drilling

#### Local State (useState/useReducer)
- Form inputs
- UI state (modals, dropdowns)
- Component-specific temporary data

### 3. Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
React Query Mutation/Query
    ↓
API Client (Axios)
    ↓
Backend API
    ↓
Response
    ↓
React Query Cache Update
    ↓
Component Re-render
```

### 4. Authentication Flow

```
Login Page
    ↓
Submit Credentials
    ↓
API: POST /auth/login
    ↓
Store Token in localStorage
    ↓
Update Auth Context
    ↓
Redirect to Dashboard
    ↓
All API calls include token
```

### 5. Module Workflow

The platform enforces a strict workflow:

1. **Screen Builder** → Define UI structure
2. **Validation Builder** → Add business rules (requires Screen Builder)
3. **Field Mapping** → Map to database (requires Screen Builder)
4. **Flow Builder** → Connect screens (requires all above)

## Design Patterns

### 1. Container/Presentational Pattern

- **Container Components:** Handle data fetching and business logic
- **Presentational Components:** Pure UI components with props

### 2. Custom Hooks Pattern

Encapsulate reusable logic:

```typescript
// Custom hook for data fetching
export const useScreenConfigs = (filters) => {
  return useQuery({
    queryKey: ['screen-configs', filters],
    queryFn: () => fetchScreenConfigs(filters),
  });
};
```

### 3. Compound Components Pattern

Related components work together:

```typescript
<FilterPanel
  filters={filterConfig}
  onFilterChange={handleFilterChange}
  onClearFilters={handleClearFilters}
/>
```

### 4. Protected Routes Pattern

Authentication guards:

```typescript
<ProtectedRoute requiresEdit>
  <ModuleContent />
</ProtectedRoute>
```

## API Integration

### API Client Setup

```typescript
// Axios instance with interceptors
const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});

// Request interceptor - add auth token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
    }
    return Promise.reject(error);
  }
);
```

### React Query Integration

```typescript
// Query for data fetching
const { data, isLoading, error } = useQuery({
  queryKey: ['configs'],
  queryFn: fetchConfigs,
  staleTime: 60000, // 1 minute
});

// Mutation for data modification
const createConfig = useMutation({
  mutationFn: createScreenConfig,
  onSuccess: () => {
    queryClient.invalidateQueries(['configs']);
    toast.success('Config created');
  },
});
```

## Security Measures

### 1. Authentication
- JWT-based authentication
- Token stored in localStorage
- Auto-redirect on 401 responses
- Protected routes for authenticated users

### 2. Authorization
- Role-based access control (RBAC)
- Admin, Config Editor, Viewer roles
- Route-level and component-level checks

### 3. Input Validation
- Zod schemas for form validation
- Client-side validation before submission
- Backend validation (assumed)

### 4. XSS Prevention
- React's built-in XSS protection
- No `dangerouslySetInnerHTML` usage
- Sanitized user inputs

## Performance Optimizations

### 1. Code Splitting
- Next.js automatic code splitting
- Dynamic imports for heavy components (ReactFlow)

### 2. Caching
- React Query caching strategy
- API response caching
- Static asset caching

### 3. Lazy Loading
- Images with Next.js Image component
- Components with dynamic imports

### 4. Memoization
- React.memo for expensive renders
- useMemo for computed values
- useCallback for function references

## Accessibility (WCAG 2.1 AA)

### 1. Keyboard Navigation
- All interactive elements keyboard accessible
- Logical tab order
- Escape closes modals

### 2. Screen Readers
- Semantic HTML
- ARIA labels on icon buttons
- ARIA live regions for notifications

### 3. Color Contrast
- 4.5:1 contrast ratio for text
- 3:1 for interactive elements
- Not relying on color alone

### 4. Forms
- Labels for all inputs
- Error messages linked via aria-describedby
- Required fields marked

## Responsive Design

### Breakpoints (MUI)
- xs: 0px (mobile)
- sm: 600px (tablet)
- md: 900px (small laptop)
- lg: 1200px (desktop)
- xl: 1536px (large desktop)

### Mobile-First Approach
- Base styles for mobile
- Progressive enhancement for larger screens
- Touch-friendly targets (44x44px minimum)

## Testing Strategy (Recommended)

### Unit Tests
- Test utility functions
- Test custom hooks
- Test pure components

### Integration Tests
- Test component interactions
- Test form submissions
- Test API integration

### E2E Tests
- Test critical user flows
- Test authentication
- Test module workflows

### Tools
- Jest for unit tests
- React Testing Library
- Playwright/Cypress for E2E

## Deployment

### Build Process
1. TypeScript compilation
2. Next.js build
3. Asset optimization
4. Static generation where possible

### Environment Variables
- Separate configs for dev/staging/prod
- Secrets not in version control
- Environment-specific API URLs

### CI/CD Pipeline (Recommended)
1. Run linter
2. Run type check
3. Run tests
4. Build application
5. Deploy to environment
6. Run smoke tests

## Monitoring & Observability

### Metrics to Track
- Page load times
- API response times
- Error rates
- User sessions
- Feature usage

### Logging
- Client-side errors
- API errors
- User actions (audit trail)

## Future Enhancements

### Phase 2
- Advanced field builder with drag-and-drop
- Visual rule builder for validations
- Real-time collaboration
- Version comparison and diff viewer
- Config templates and presets

### Phase 3
- Multi-language support (i18n)
- Dark mode
- Advanced analytics dashboard
- Bulk operations
- Config approval workflow

### Phase 4
- AI-powered config suggestions
- Integration with external systems
- Mobile app (React Native)
- Webhook support
- Custom plugin system

## Contributing Guidelines

### Code Style
- Follow TypeScript best practices
- Use ESLint configuration
- Format with Prettier
- Write meaningful commit messages

### Pull Request Process
1. Create feature branch
2. Implement changes
3. Write/update tests
4. Update documentation
5. Submit PR with description
6. Address review comments
7. Merge after approval

### Documentation
- Update README for new features
- Document complex logic
- Add JSDoc comments for public APIs
- Update architecture docs

## Support & Maintenance

### Regular Tasks
- Update dependencies monthly
- Review security advisories
- Monitor error logs
- Optimize performance
- Backup configurations

### Technical Debt
- Refactor when needed
- Remove unused code
- Update outdated patterns
- Improve test coverage

---

**Last Updated:** December 2025
**Version:** 1.0.0
**Maintained By:** Development Team

