'use client';

interface SkeletonListItemProps {
  primaryWidth?: string;
  secondaryWidths?: string[];
  footerWidths?: string[];
  className?: string;
  showBadge?: boolean;
}

export default function SkeletonListItem({
  primaryWidth = 'w-1/2',
  secondaryWidths,
  footerWidths,
  className = '',
  showBadge = false,
}: SkeletonListItemProps) {
  const secondary = secondaryWidths ?? ['w-full', 'w-3/4'];
  const footer = footerWidths ?? ['w-1/3', 'w-1/4'];

  return (
    <div
      className={`animate-pulse rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/50 shadow-inner p-4 flex flex-col gap-3 ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between gap-3">
        <div className={`h-3 rounded-full bg-gray-200 dark:bg-gray-700 ${primaryWidth}`} />
        {showBadge && (
          <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-700 w-20" />
        )}
      </div>
      <div className="space-y-2">
        {secondary.map((width, index) => (
          <div
            key={`secondary-${index}`}
            className={`h-3 rounded-full bg-gray-200 dark:bg-gray-700 ${width}`}
          />
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        {footer.map((width, index) => (
          <div
            key={`footer-${index}`}
            className={`h-3 rounded-full bg-gray-200 dark:bg-gray-700 ${width}`}
          />
        ))}
      </div>
    </div>
  );
}
