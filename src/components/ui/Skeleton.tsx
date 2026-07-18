import React from 'react';
import { useAppPrefs } from '../../lib/AppPrefsContext';

/**
 * Skeleton loader — shimmer pulse animation for content placeholders.
 * Renders in dark/light mode automatically.
 */
export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  const { isDark: dk } = useAppPrefs();
  return (
    <div
      className={`animate-pulse rounded-md ${className}`}
      style={{
        background: dk
          ? 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 100%)'
          : 'linear-gradient(90deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.09) 50%, rgba(0,0,0,0.05) 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.4s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

/** Skeleton card mimicking a product card layout. */
export function SkeletonProductCard() {
  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
      <Skeleton className="w-full aspect-square rounded-none" />
      <div className="p-3.5 space-y-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-2 w-2/3" />
        <div className="pt-2 flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Skeleton row mimicking a list item. */
export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl border" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-2 w-1/3" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

/** Skeleton stat tile (for dashboards). */
export function SkeletonStatCard() {
  return (
    <div className="rounded-2xl p-4 border" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
      <Skeleton className="w-8 h-8 rounded-xl mb-3" />
      <Skeleton className="h-6 w-20 mb-2" />
      <Skeleton className="h-2 w-24" />
    </div>
  );
}
