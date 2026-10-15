import { describe, it, expect, beforeEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { useRef } from 'react';
import { focusValue, useScrollFocus } from '../../lib/useScrollFocus';

describe('focusValue', () => {
  it('vaut 0 au centre de la zone visible', () => expect(focusValue(400, 0, 800)).toBe(0));
  it('est négatif au-dessus du centre et positif en dessous', () => {
    expect(focusValue(100, 0, 800)).toBeLessThan(0);
    expect(focusValue(700, 0, 800)).toBeGreaterThan(0);
  });
  it('est symétrique', () => expect(focusValue(300, 0, 800)).toBeCloseTo(-focusValue(500, 0, 800), 10));
  it('reste entre -1 et 1', () => {
    expect(focusValue(-5000, 0, 800)).toBe(-1);
    expect(focusValue(9000, 0, 800)).toBe(1);
  });
  it('tient compte du haut de la zone visible (aperçu dans un cadre)', () => {
    expect(focusValue(650, 300, 700)).toBe(0);
  });
  it('ne plante pas sans hauteur', () => expect(focusValue(10, 0, 0)).toBe(0));
});

function Harness({ tops }: { tops: number[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollFocus(ref);
  return (
    <div ref={ref}>
      {tops.map((t, i) => (
        <div key={i} data-focus-item data-testid={`item-${i}`} data-top={t}
          ref={el => { if (el) el.getBoundingClientRect = () => ({ top: Number(el.dataset.top), height: 100, bottom: 0, left: 0, right: 0, width: 0, x: 0, y: 0, toJSON() { return {}; } }); }} />
      ))}
    </div>
  );
}

describe('useScrollFocus', () => {
  beforeEach(() => {
    window.matchMedia = (() => ({ matches: false, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
  });

  it('pose --f et --a sur chaque élément selon sa position à l\'écran', async () => {
    const { getByTestId } = render(<Harness tops={[350, 0, 700]} />);
    await waitFor(() => expect(getByTestId('item-0').style.getPropertyValue('--f')).not.toBe(''));
    expect(Number(getByTestId('item-0').style.getPropertyValue('--f'))).toBeCloseTo(0, 2); // centre de l'écran
    expect(Number(getByTestId('item-1').style.getPropertyValue('--f'))).toBeLessThan(0);   // en haut
    expect(Number(getByTestId('item-2').style.getPropertyValue('--f'))).toBeGreaterThan(0); // en bas
    expect(Number(getByTestId('item-0').style.getPropertyValue('--a'))).toBeCloseTo(0, 2);
    expect(Number(getByTestId('item-1').style.getPropertyValue('--a'))).toBeGreaterThan(0.5);
  });

  it('se met à jour quand la page défile', async () => {
    const { getByTestId } = render(<Harness tops={[350]} />);
    await waitFor(() => expect(getByTestId('item-0').style.getPropertyValue('--f')).not.toBe(''));
    const el = getByTestId('item-0');
    el.dataset.top = '0';
    act(() => { window.dispatchEvent(new Event('scroll')); });
    await waitFor(() => expect(Number(el.style.getPropertyValue('--f'))).toBeLessThan(-0.5));
  });
});
