import React from 'react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

interface AnimSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none';
}

/** Apparition au défilement (fondu + glissement), déclenchée une seule fois. */
export default function AnimSection({ children, className = '', delay = 0, direction = 'up' }: AnimSectionProps) {
  const { ref, visible } = useScrollAnimation(0.1);
  const base = 'transition-all duration-700 ease-out motion-reduce:transition-none';
  const hidden = direction === 'up'    ? 'opacity-0 translate-y-10'
               : direction === 'left'  ? 'opacity-0 -translate-x-10'
               : direction === 'right' ? 'opacity-0 translate-x-10'
               : 'opacity-0';
  const show = 'opacity-100 translate-y-0 translate-x-0';
  return (
    <div ref={ref} className={`${base} ${visible ? show : hidden} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}>
      {children}
    </div>
  );
}
