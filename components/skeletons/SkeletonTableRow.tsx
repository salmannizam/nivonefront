'use client';

import BaseSkeleton from './BaseSkeleton';

export default function SkeletonTableRow({
  columns = 5,
  className = '',
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <tr className={`animate-pulse ${className}`}>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-3 sm:px-6 py-4">
          <BaseSkeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
