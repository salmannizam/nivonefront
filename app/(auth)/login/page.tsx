'use client';

// Force dynamic rendering so login isn’t prerendered without AuthProvider
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call auth service directly to have better control over error handling
      const { getTenantSlug } = await import('@/lib/auth');
      const api = (await import('@/lib/api')).default;
      const tenantSlug = getTenantSlug();
      
      const response = await api.post('/auth/login', {
        email,
        password,
        tenantSlug: tenantSlug || undefined,
      });

      // Check if redirect is needed (correct credentials but wrong/missing tenant slug)
      if (response.data.redirect && response.data.tenantSlug) {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port ? `:${window.location.port}` : '';
        
        // For localhost/IP, use query parameter
        if (hostname === 'localhost' || hostname.includes('127.0.0.1') || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
          // Already on correct tenant, just reload with tenant in query
          if (tenantSlug === response.data.tenantSlug) {
            // Same tenant, proceed with login
            await login(email, password);
            router.push('/dashboard');
          } else {
            // Different tenant, redirect
            window.location.href = `${protocol}//${hostname}${port}/login?tenant=${encodeURIComponent(response.data.tenantSlug)}`;
            return;
          }
        } else {
          // For production, redirect to subdomain (slug.domain.com/login)
          const parts = hostname.split('.');
          if (parts.length >= 2) {
            const rootDomain = parts.slice(-2).join('.');
            // Check if we're already on the correct subdomain
            if (hostname.startsWith(`${response.data.tenantSlug}.`)) {
              // Already on correct subdomain, proceed with login
              await login(email, password);
              router.push('/dashboard');
            } else {
              // Redirect to correct subdomain
              window.location.href = `${protocol}//${response.data.tenantSlug}.${rootDomain}${port}/login`;
              return;
            }
          } else {
            // Fallback to query parameter
            window.location.href = `${protocol}//${hostname}${port}/login?tenant=${encodeURIComponent(response.data.tenantSlug)}`;
            return;
          }
        }
      }

      // Normal login success - set user and redirect to dashboard
      if (response.data.user) {
        await login(email, password);
        router.push('/dashboard');
      } else {
        setError('Login failed. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      // Show error message without page refresh
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8 p-6 sm:p-8 md:p-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg mb-4">
            <span className="text-3xl sm:text-4xl">🔐</span>
          </div>
          <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Access your tenant dashboard
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base transition-all"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base transition-all"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm sm:text-base font-semibold rounded-lg text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 dark:from-indigo-500 dark:to-blue-500 dark:hover:from-indigo-600 dark:hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
