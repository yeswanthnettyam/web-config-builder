# LOS Configuration Platform

A comprehensive web-based configuration platform for Loan Origination System (LOS).

## Features

- **Screen Builder**: Define UI structure and behavior
- **Validation Builder**: Configure business rules and validation logic
- **Field Mapping Manager**: Map UI fields to database columns
- **Flow Builder**: Design cross-screen navigation and customer journeys

## Tech Stack

- React 18.3.1 + TypeScript 5.6.3
- Next.js 14.2.18
- Material-UI 5.16.7
- React Query 5.59.20
- React Hook Form 7.53.2
- Zod 3.23.8
- React Flow 11.11.4

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app directory
├── components/             # Reusable components
├── contexts/               # React contexts (auth, etc.)
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and configurations
├── types/                  # TypeScript type definitions
└── styles/                 # Global styles
```

## Authentication

Default credentials for testing:
- Email: admin@kaleidofin.com
- Password: admin123

## Accessibility

This platform is built with WCAG 2.1 AA compliance in mind:
- Keyboard navigation support
- Screen reader compatible
- Color contrast compliant
- Responsive design for mobile and desktop

## License

Proprietary - Kaleidofin

