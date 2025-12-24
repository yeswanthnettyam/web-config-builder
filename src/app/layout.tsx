import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import ThemeRegistry from '@/components/providers/ThemeRegistry';
import QueryProvider from '@/components/providers/QueryProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'LOS Configuration Platform - Kaleidofin',
  description: 'Loan Origination System Configuration Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#fff',
                    color: '#1A1A1A',
                    border: '1px solid #E0E0E0',
                  },
                  success: {
                    iconTheme: {
                      primary: '#2E7D32',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#D32F2F',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </AuthProvider>
          </QueryProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
