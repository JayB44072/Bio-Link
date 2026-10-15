import { describe, it, expect } from 'vitest';
import { serviceMessage, whatsappDigits, whatsappUrl } from '../../lib/whatsapp';

const info = { name: 'Coiffure', price: 15000, currency: 'XAF' };

describe('whatsappDigits', () => {
  it('ne garde que les chiffres', () => expect(whatsappDigits('+237 6 00-00 00 00')).toBe('237600000000'));
  it('retire le préfixe international 00', () => expect(whatsappDigits('00237600000000')).toBe('237600000000'));
  it('gère les valeurs vides', () => {
    expect(whatsappDigits('')).toBe('');
    expect(whatsappDigits(null)).toBe('');
    expect(whatsappDigits(undefined)).toBe('');
  });
});

describe('whatsappUrl', () => {
  it('construit un lien wa.me avec le message encodé', () => {
    const url = whatsappUrl('+237600000000', 'Bonjour 👋 *Coiffure*')!;
    expect(url.startsWith('https://wa.me/237600000000?text=')).toBe(true);
    expect(decodeURIComponent(url.split('text=')[1])).toBe('Bonjour 👋 *Coiffure*');
  });
  it('renvoie null pour un numéro inutilisable', () => {
    expect(whatsappUrl('', 'x')).toBeNull();
    expect(whatsappUrl('12', 'x')).toBeNull();
  });
});

describe('serviceMessage', () => {
  it('mentionne le service et le prix', () => {
    const m = serviceMessage('book', info, 'fr');
    expect(m).toContain('*Coiffure*');
    expect(m.replace(/\D/g, '')).toBe('15000');
  });
  it('change de texte selon l\'intention', () => {
    const kinds = (['interest', 'book', 'question', 'availability'] as const).map(k => serviceMessage(k, info, 'fr'));
    expect(new Set(kinds).size).toBe(4);
  });
  it('propose un devis plutôt que des disponibilités sans prix', () => {
    expect(serviceMessage('availability', { ...info, price: 0 }, 'fr')).toMatch(/devis/);
    expect(serviceMessage('availability', info, 'fr')).toMatch(/disponibilités/);
  });
  it('existe dans les quatre langues de l\'application, avec repli sur l\'anglais', () => {
    for (const lang of ['fr', 'en', 'pt', 'de']) expect(serviceMessage('question', info, lang)).toContain('*Coiffure*');
    expect(serviceMessage('question', info, 'xx')).toBe(serviceMessage('question', info, 'en'));
  });
});
