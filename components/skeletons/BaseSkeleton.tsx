'use client';

import type { CSSProperties } from 'react';

export default function BaseSkeleton({
  className = 'bg-gray-200/70 dark:bg-gray-700 animate-pulse',
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return <div className={`rounded-md ${className}`} style={style} />;
}
