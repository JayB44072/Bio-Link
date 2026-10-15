import type { ServiceWaveTheme } from './PublicServiceWave';
import { BRAND, GRADIENTS } from '../../lib/theme';

/** Palette claire de la page de suivi autonome (/commande/…, /suivi) : mêmes champs que le thème d'une boutique. */
export const LIGHT_ORDER_THEME: ServiceWaveTheme = {
  dark: false,
  pageBg: '#f9fafb',
  text: '#111827',
  subtext: '#6b7280',
  cardBg: '#ffffff',
  cardBorder: '#eceaf7',
  accent: BRAND.violet,
  priceColor: BRAND.violet,
  buttonGradient: GRADIENTS.brand,
  cardRadius: 'rounded-3xl',
};
