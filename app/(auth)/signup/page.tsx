'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    tenantName: '',
    ownerName: '',
    ownerEmail: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tenantSlug, setTenantSlug] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/signup', {
        tenantName: formData.tenantName,
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        password: formData.password,
      });

      setSuccess(true);
      setTenantSlug(response.data.tenantSlug);
      
      // Redirect to tenant login after 3 seconds
      setTimeout(() => {
        // SECURITY: Sanitize tenantSlug to prevent XSS/open redirect
        const sanitizedSlug = (response.data.tenantSlug || '').replace(/[^a-z0-9-]/gi, '').substring(0, 63);
        if (!sanitizedSlug) {
          setError('Invalid tenant slug. Please contact support.');
          setSuccess(false);
          return;
        }

        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : '';
        
        // Construct tenant subdomain URL
        // For localhost, use query parameter; for production, use subdomain
        if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
          // SECURITY: Use encodeURIComponent for query parameter
          window.location.href = `${protocol}//${hostname}${port}/login?tenant=${encodeURIComponent(sanitizedSlug)}`;
        } else {
          // Extract root domain (e.g., nivaasone.com from app.nivaasone.com)
          const parts = hostname.split('.');
          if (parts.length < 2) {
            setError('Invalid hostname. Please contact support.');
            setSuccess(false);
            return;
          }
          const rootDomain = parts.slice(-2).join('.'); // Get last 2 parts
          // SECURITY: Validate root domain format
          if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(rootDomain)) {
            setError('Invalid domain. Please contact support.');
            setSuccess(false);
            return;
          }
          window.location.href = `${protocol}//${sanitizedSlug}.${rootDomain}${port}/login`;
        }
      }, 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Signup failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8">
        <div className="max-w-md w-full space-y-6 p-8 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Account Created Successfully!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your tenant <strong>{formData.tenantName.replace(/[<>]/g, '')}</strong> has been created.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8 p-6 sm:p-8 md:p-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg mb-4">
            <span className="text-3xl sm:text-4xl">🏠</span>
          </div>
          <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
            Create Your Account
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Start managing your PG/Hostel today
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="tenantName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                PG/Hostel Name *
              </label>
              <input
                id="tenantName"
                name="tenantName"
                type="text"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base transition-all"
                placeholder="e.g., Sunshine PG"
                value={formData.tenantName}
                onChange={(e) => {
                  // Sanitize input: remove potentially dangerous characters
                  const sanitized = e.target.value.replace(/[<>\"']/g, '').substring(0, 100);
                  setFormData({ ...formData, tenantName: sanitized });
                }}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Your subdomain will be auto-generated from this name
              </p>
            </div>
            <div>
              <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Owner Name *
              </label>
              <input
                id="ownerName"
                name="ownerName"
                type="text"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base transition-all"
                placeholder="Your full name"
                value={formData.ownerName}
                onChange={(e) => {
                  // Sanitize input: remove potentially dangerous characters
                  const sanitized = e.target.value.replace(/[<>\"']/g, '').substring(0, 100);
                  setFormData({ ...formData, ownerName: sanitized });
                }}
              />
            </div>
            <div>
              <label htmlFor="ownerEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address *
              </label>
              <input
                id="ownerEmail"
                name="ownerEmail"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base transition-all"
                placeholder="your@email.com"
                value={formData.ownerEmail}
                onChange={(e) => {
                  // Sanitize email: lowercase and trim
                  const sanitized = e.target.value.toLowerCase().trim().substring(0, 255);
                  setFormData({ ...formData, ownerEmail: sanitized });
                }}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base transition-all"
                placeholder="Min 8 chars: uppercase, lowercase, number"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base transition-all"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
