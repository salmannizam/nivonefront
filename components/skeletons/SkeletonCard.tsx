'use client';

import BaseSkeleton from './BaseSkeleton';

export default function SkeletonCard({
  className = '',
  lines = 3,
}: {
  className?: string;
  lines?: number;
}) {
  const detailLines = Math.max(1, Math.min(lines, 4));

  return (
    <div
      className={`rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900/60 p-4 shadow-sm space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <BaseSkeleton className="h-4 w-1/2" />
        <BaseSkeleton className="h-4 w-1/6" />
      </div>
      <BaseSkeleton className="h-10 w-3/4" />
      <div className="space-y-2">
        {Array.from({ length: detailLines }).map((_, index) => (
          <BaseSkeleton key={`detail-${index}`} className="h-3 w-full" />
        ))}
      </div>
    </div>
  );
}
