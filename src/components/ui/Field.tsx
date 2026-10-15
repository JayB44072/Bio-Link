import React, { useId } from 'react';

interface FieldProps {
  label: React.ReactNode;
  /** Reçoit l'id à poser sur le champ (input, select, textarea…) pour le relier à son libellé. */
  children: (control: { id: string }) => React.ReactNode;
  className?: string;
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  /** Contenu aligné à droite du libellé (compteur de caractères, aide…). */
  aside?: React.ReactNode;
}

/**
 * Libellé + champ reliés entre eux (`htmlFor` / `id`), sans imposer l'apparence du champ :
 * chaque écran garde ses propres classes de champ.
 */
export default function Field({
  label, children, className, labelClassName = 'block text-sm font-semibold mb-1.5', labelStyle, aside,
}: FieldProps) {
  const id = useId();
  return (
    <div className={className}>
      {aside ? (
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={id} className={labelClassName.replace(/\bmb-[\d.]+\b/, '')} style={labelStyle}>{label}</label>
          {aside}
        </div>
      ) : (
        <label htmlFor={id} className={labelClassName} style={labelStyle}>{label}</label>
      )}
      {children({ id })}
    </div>
  );
}
