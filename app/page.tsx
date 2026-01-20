'use client';

// Force dynamic rendering to prevent SSR issues with AuthProvider
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getTenantSlug } from '@/lib/auth';
import api from '@/lib/api';
import Link from 'next/link';

export default function Home() {
  const { user, loading: authLoading, login } = useAuth();
  const router = useRouter();
  const [showSignup, setShowSignup] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Signup form state
  const [signupData, setSignupData] = useState({
    tenantName: '',
    tenantSlug: '',
    ownerName: '',
    ownerEmail: '',
    password: '',
    confirmPassword: '',
  });
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  // Auto-redirect to last tenant slug on PWA open
  useEffect(() => {
    if (typeof window === 'undefined' || authLoading || user) return;

    // Only in standalone mode (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (!isStandalone) return;

    // Check if we're already on a tenant subdomain
    const currentTenantSlug = getTenantSlug();
    if (currentTenantSlug) return;

    // Try to get last tenant slug
    import('@/lib/tenant-slug-persistence').then(({ getLastTenantSlug, redirectToTenantSlug }) => {
      const lastTenantSlug = getLastTenantSlug();
      if (lastTenantSlug) {
        redirectToTenantSlug(lastTenantSlug);
      }
    });
  }, [authLoading, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      // Call auth service directly to have better control over error handling
      const { getTenantSlug } = await import('@/lib/auth');
      const tenantSlug = getTenantSlug();
      
      const response = await api.post('/auth/login', {
        email: loginEmail,
        password: loginPassword,
        tenantSlug: tenantSlug || undefined,
      }).catch((err) => {
        // Re-throw to be caught by outer catch block
        throw err;
      });

      // Check if redirect is needed (correct credentials but wrong/missing tenant slug)
      if (response.data.redirect && response.data.tenantSlug) {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port ? `:${window.location.port}` : '';
        
        // For localhost/IP, use query parameter
        if (hostname === 'localhost' || hostname.includes('127.0.0.1') || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
          // Redirect to login page with tenant slug - user will login again there
          window.location.href = `${protocol}//${hostname}${port}/login?tenant=${encodeURIComponent(response.data.tenantSlug)}`;
          return; // Exit early, redirect will happen
        } else {
          // For production, redirect to subdomain login page (slug.domain.com/login)
          const parts = hostname.split('.');
          if (parts.length >= 2) {
            const rootDomain = parts.slice(-2).join('.');
            // Redirect to slug.domain.com/login - user will login again there
            window.location.href = `${protocol}//${response.data.tenantSlug}.${rootDomain}${port}/login`;
            return; // Exit early, redirect will happen
          } else {
            // Fallback to query parameter
            window.location.href = `${protocol}//${hostname}${port}/login?tenant=${encodeURIComponent(response.data.tenantSlug)}`;
            return;
          }
        }
      }

      // Normal login success - set user and redirect to dashboard
      if (response.data.user) {
        // Use the login function to set user state properly
        await login(loginEmail, loginPassword);
        router.push('/dashboard');
      } else {
        setLoginError('Login failed. Please try again.');
        setLoginLoading(false);
      }
    } catch (err: any) {
      // Show error message without page refresh
      // Extract error message from response
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setLoginError(errorMessage);
      setLoginLoading(false);
      // Don't redirect or refresh - just show the error
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    // Validation
    if (signupData.password !== signupData.confirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }

    if (signupData.password.length < 8) {
      setSignupError('Password must be at least 8 characters');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(signupData.password)) {
      setSignupError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    const slugRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!slugRegex.test(signupData.tenantSlug)) {
      setSignupError('Tenant slug can only contain lowercase letters, numbers, and hyphens. It must start and end with alphanumeric characters.');
      return;
    }

    setSignupLoading(true);

    try {
      const response = await api.post('/auth/signup', {
        tenantName: signupData.tenantName,
        tenantSlug: signupData.tenantSlug,
        ownerName: signupData.ownerName,
        ownerEmail: signupData.ownerEmail,
        password: signupData.password,
      });

      setSignupSuccess(true);
      
      setTimeout(() => {
        const sanitizedSlug = (response.data.tenantSlug || '').replace(/[^a-z0-9-]/gi, '').substring(0, 63);
        if (!sanitizedSlug) {
          setSignupError('Invalid tenant slug. Please contact support.');
          setSignupSuccess(false);
          return;
        }

        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : '';
        
        if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
          window.location.href = `${protocol}//${hostname}${port}/login?tenant=${encodeURIComponent(sanitizedSlug)}`;
        } else {
          const parts = hostname.split('.');
          if (parts.length < 2) {
            setSignupError('Invalid hostname. Please contact support.');
            setSignupSuccess(false);
            return;
          }
          const rootDomain = parts.slice(-2).join('.');
          if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(rootDomain)) {
            setSignupError('Invalid domain. Please contact support.');
            setSignupSuccess(false);
            return;
          }
          window.location.href = `${protocol}//${sanitizedSlug}.${rootDomain}${port}/login`;
        }
      }, 3000);
    } catch (err: any) {
      let errorMessage = err.response?.data?.message || 'Signup failed. Please try again.';
      
      if (errorMessage.includes('No default plan available') || errorMessage.includes('default plan')) {
        errorMessage = 'Registration is currently unavailable. Please contact support to set up the system.';
      } else if (errorMessage.includes('already taken') || errorMessage.includes('duplicate')) {
        errorMessage = 'This tenant name or slug is already taken. Please choose a different one.';
      } else if (errorMessage.includes('reserved')) {
        errorMessage = 'This slug is reserved. Please choose a different tenant slug.';
      } else if (errorMessage.includes('Unable to create account')) {
        errorMessage = 'An account with this email already exists. Please use a different email or contact support.';
      }
      
      setSignupError(errorMessage);
    } finally {
      setSignupLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (signupSuccess) {
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
            Your tenant <strong>{signupData.tenantName.replace(/[<>]/g, '')}</strong> has been created.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-300/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-300/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-5xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-2xl mb-4 transform hover:scale-110 transition-transform">
            <span className="text-4xl">🏠</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-2">
            Hostel Management
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300">
            Manage your PG/Hostel with ease
          </p>
        </div>

        {/* Card Container */}
        <div className="relative">
          <div className={`transition-all duration-500 ease-in-out ${showSignup ? 'opacity-0 scale-95 absolute inset-0 pointer-events-none' : 'opacity-100 scale-100 relative'}`}>
            {/* Login Card */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 md:p-10">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg mb-4">
                  <span className="text-3xl">🔐</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                  Welcome Back
                </h2>
                <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Sign in to your account
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleLogin}>
                {loginError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                    {loginError}
                  </div>
                )}

                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 dark:from-indigo-500 dark:to-blue-500 dark:hover:from-indigo-600 dark:hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  {loginLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowSignup(true)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                  >
                    Don't have an account? <span className="font-bold">Sign up</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className={`transition-all duration-500 ease-in-out ${showSignup ? 'opacity-100 scale-100 relative' : 'opacity-0 scale-95 absolute inset-0 pointer-events-none'}`}>
            {/* Signup Card */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 md:p-10">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg mb-4">
                  <span className="text-3xl">✨</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                  Create Your Account
                </h2>
                <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Start managing your PG/Hostel today
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSignup}>
                {signupError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                    <span className="text-lg">⚠️</span>
                    <span className="flex-1">{signupError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="tenantName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      PG/Hostel Name *
                    </label>
                    <input
                      id="tenantName"
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                      placeholder="e.g., Sunshine PG"
                      value={signupData.tenantName}
                      onChange={(e) => {
                        const sanitized = e.target.value.replace(/[<>\"']/g, '').substring(0, 100);
                        setSignupData({ ...signupData, tenantName: sanitized });
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="tenantSlug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tenant Slug *
                    </label>
                    <input
                      id="tenantSlug"
                      type="text"
                      required
                      pattern="[a-z0-9]([a-z0-9-]*[a-z0-9])?"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                      placeholder="e.g., sunshine-pg"
                      value={signupData.tenantSlug}
                      onChange={(e) => {
                        const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 63);
                        setSignupData({ ...signupData, tenantSlug: sanitized });
                      }}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Subdomain: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{signupData.tenantSlug || 'your-slug'}</span>.yourdomain.com
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Owner Name *
                    </label>
                    <input
                      id="ownerName"
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                      placeholder="Your full name"
                      value={signupData.ownerName}
                      onChange={(e) => {
                        const sanitized = e.target.value.replace(/[<>\"']/g, '').substring(0, 100);
                        setSignupData({ ...signupData, ownerName: sanitized });
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="ownerEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      id="ownerEmail"
                      type="email"
                      autoComplete="email"
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                      placeholder="your@email.com"
                      value={signupData.ownerEmail}
                      onChange={(e) => {
                        const sanitized = e.target.value.toLowerCase().trim().substring(0, 255);
                        setSignupData({ ...signupData, ownerEmail: sanitized });
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password *
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                    placeholder="Min 8 chars: uppercase, lowercase, number"
                    value={signupData.password}
                    onChange={(e) => {
                      const password = e.target.value;
                      setSignupData({ ...signupData, password });
                      
                      let score = 0;
                      let feedback = '';
                      if (password.length >= 8) score++;
                      if (/[a-z]/.test(password)) score++;
                      if (/[A-Z]/.test(password)) score++;
                      if (/\d/.test(password)) score++;
                      if (/[^a-zA-Z\d]/.test(password)) score++;
                      
                      if (score < 2) feedback = 'Weak';
                      else if (score < 4) feedback = 'Medium';
                      else feedback = 'Strong';
                      
                      setPasswordStrength({ score, feedback });
                    }}
                  />
                  {signupData.password && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              passwordStrength.score < 2
                                ? 'bg-red-500 w-1/3'
                                : passwordStrength.score < 4
                                ? 'bg-yellow-500 w-2/3'
                                : 'bg-green-500 w-full'
                            }`}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          passwordStrength.score < 2
                            ? 'text-red-600 dark:text-red-400'
                            : passwordStrength.score < 4
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {passwordStrength.feedback}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                    placeholder="Confirm your password"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={signupLoading}
                  className="w-full py-3 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 dark:from-indigo-500 dark:to-blue-500 dark:hover:from-indigo-600 dark:hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  {signupLoading ? (
                    <span className="flex items-center justify-center gap-2">
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

                <div className="text-center space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowSignup(false)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                  >
                    Already have an account? <span className="font-bold">Sign in</span>
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    By creating an account, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
