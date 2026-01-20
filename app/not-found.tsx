'use client';

// Force dynamic rendering for the not-found page so it doesn't run outside AuthProvider
export const dynamic = 'force-dynamic';

export default function CustomNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">Page not found.</p>
      </div>
    </div>
  );
}
