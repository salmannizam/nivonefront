import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import { FeatureProvider } from '@/lib/feature-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hostel Management System',
  description: 'Multi-tenant Hostel/PG Management Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <FeatureProvider>{children}</FeatureProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
