import React from 'react';
import type { LucideIcon } from 'lucide-react';
import type { DashPalette } from '../../lib/dashPalette';

interface EmptyStateProps {
  icon: LucideIcon;
  message: React.ReactNode;
  palette: Pick<DashPalette, 'surfaceAlt' | 'border' | 'txtSub'>;
  iconSize?: number;
  iconOpacity?: number;
  /** Action facultative sous le message (lien, bouton). */
  children?: React.ReactNode;
}

/** Zone vide en pointillés : icône, message et action éventuelle. */
export default function EmptyState({ icon: Icon, message, palette, iconSize = 38, iconOpacity = 0.4, children }: EmptyStateProps) {
  return (
    <div className="text-center py-16 rounded-3xl"
      style={{ background: palette.surfaceAlt, border: `1px dashed ${palette.border}` }}>
      <Icon size={iconSize} aria-hidden className="mx-auto mb-3" style={{ color: palette.txtSub, opacity: iconOpacity }} />
      <p className="text-sm font-medium" style={{ color: palette.txtSub }}>{message}</p>
      {children}
    </div>
  );
}
