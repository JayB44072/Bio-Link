import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LanguageProvider } from '../../lib/LanguageContext';
import { AppPrefsProvider } from '../../lib/AppPrefsContext';
import ServiceDetailModal from '../../components/public/ServiceDetailModal';
import type { Service } from '../../lib/types';

const wrap = (ui: React.ReactNode) => render(<AppPrefsProvider><LanguageProvider>{ui}</LanguageProvider></AppPrefsProvider>);

const service = {
  id: 's1', user_id: 'u1', name: 'Coiffure à domicile', description: 'Tresses et soins', price: 15000, currency: 'XAF',
  image_url: '', images: [], duration: '2h', is_active: true, created_at: '', updated_at: '',
} as unknown as Service;

const profile = { shop_name: 'Atelier Kora', username: 'kora', whatsapp_number: '+237 600 000 000', contact_phone: '+237 611 111 111' };
const theme = {
  dark: true, pageBg: '#000', text: '#fff', subtext: '#aaa', cardBg: '#111', cardBorder: '#333',
  accent: '#C9A96E', priceColor: '#C9A96E', buttonGradient: 'linear-gradient(135deg,#C9A96E,#a8894e)', cardRadius: 'rounded-3xl',
};

afterEach(() => { vi.useRealTimers(); });

describe('fiche d\'un service (page publique)', () => {
  it('est une boîte de dialogue accessible avec le nom, le prix et le prestataire', () => {
    wrap(<ServiceDetailModal service={service} profile={profile} onClose={vi.fn()} theme={theme} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { level: 1, name: 'Coiffure à domicile' })).toBeInTheDocument();
    expect(screen.getAllByText('Atelier Kora').length).toBeGreaterThan(0);
    expect(screen.getAllByText(content => content.replace(/\D/g, '') === '15000').length).toBeGreaterThan(0);
  });

  it('permet de contacter le prestataire sur WhatsApp avec un message prérempli contenant le service', () => {
    wrap(<ServiceDetailModal service={service} profile={profile} onClose={vi.fn()} theme={theme} />);
    const href = screen.getAllByRole('link', { name: /Contacter sur WhatsApp/ })[0].getAttribute('href') ?? '';
    expect(href).toContain('https://wa.me/237600000000');
    expect(decodeURIComponent(href)).toContain('Coiffure à domicile');
  });

  it('propose des messages rapides, chacun avec sa propre intention', () => {
    wrap(<ServiceDetailModal service={service} profile={profile} onClose={vi.fn()} theme={theme} />);
    const section = screen.getByRole('region', { name: /Discuter avec Atelier Kora sur WhatsApp/ });
    const book = section.querySelector('[data-quick="book"]') as HTMLAnchorElement;
    const question = section.querySelector('[data-quick="question"]') as HTMLAnchorElement;
    const availability = section.querySelector('[data-quick="availability"]') as HTMLAnchorElement;
    expect(decodeURIComponent(book.href)).toMatch(/réserver/);
    expect(decodeURIComponent(question.href)).toMatch(/question/);
    expect(decodeURIComponent(availability.href)).toMatch(/disponibilités/);
    for (const a of [book, question, availability]) expect(a.href).toContain('https://wa.me/237600000000');
    expect(screen.getByRole('link', { name: 'Ouvrir WhatsApp' })).toBeInTheDocument();
  });

  it('demande un devis quand le service n\'a pas de prix', () => {
    wrap(<ServiceDetailModal service={{ ...service, price: 0 }} profile={profile} onClose={vi.fn()} theme={theme} />);
    expect(screen.getByRole('link', { name: 'Demander un devis' })).toBeInTheDocument();
    expect(decodeURIComponent((screen.getByRole('link', { name: 'Demander un devis' }) as HTMLAnchorElement).href)).toMatch(/devis/);
  });

  it('sans WhatsApp : pas de messages rapides, mais l\'appel reste proposé', () => {
    wrap(<ServiceDetailModal service={service} profile={{ ...profile, whatsapp_number: '' }} onClose={vi.fn()} theme={theme} />);
    expect(screen.queryByRole('link', { name: 'Ouvrir WhatsApp' })).toBeNull();
    expect(screen.getAllByRole('link', { name: /Appeler/ }).length).toBeGreaterThan(0);
  });

  it('retombe sur le téléphone sans WhatsApp', () => {
    wrap(<ServiceDetailModal service={service} profile={{ ...profile, whatsapp_number: '' }} onClose={vi.fn()} theme={theme} />);
    expect(screen.getAllByRole('link', { name: /Appeler le prestataire/ })[0].getAttribute('href')).toBe('tel:+237611111111');
  });

  it('le dit clairement quand le prestataire n\'a aucun moyen de contact', () => {
    wrap(<ServiceDetailModal service={service} profile={{ ...profile, whatsapp_number: '', contact_phone: '' }} onClose={vi.fn()} theme={theme} />);
    expect(screen.queryByRole('link', { name: /WhatsApp|Appeler/ })).toBeNull();
    expect(screen.getAllByText(/pas encore renseigné/).length).toBeGreaterThan(0);
  });

  it('affiche « sur devis » quand le service n\'a pas de prix', () => {
    wrap(<ServiceDetailModal service={{ ...service, price: 0 }} profile={profile} onClose={vi.fn()} theme={theme} />);
    expect(screen.getAllByText('Sur devis').length).toBeGreaterThan(0);
  });

  it('se ferme avec le bouton Retour et avec Échap', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    wrap(<ServiceDetailModal service={service} profile={profile} onClose={onClose} theme={theme} />);
    fireEvent.click(screen.getByRole('button', { name: /Retour/ }));
    act(() => { vi.advanceTimersByTime(300); });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document, { key: 'Escape' });
    act(() => { vi.advanceTimersByTime(300); });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('permet de parcourir la galerie', () => {
    const multi = { ...service, image_url: 'https://x/a.jpg', images: ['https://x/b.jpg', 'https://x/c.jpg'] } as Service;
    wrap(<ServiceDetailModal service={multi} profile={profile} onClose={vi.fn()} theme={theme} />);
    expect(screen.getAllByRole('button', { name: /Afficher le média/ })).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'Média suivant' }));
    expect(screen.getByAltText('Coiffure à domicile')).toHaveAttribute('src', 'https://x/b.jpg');
  });

  it('n\'invente aucune garantie : pas de promesse de remboursement', () => {
    wrap(<ServiceDetailModal service={service} profile={profile} onClose={vi.fn()} theme={theme} />);
    expect(screen.queryByText(/rembours|garanti/i)).toBeNull();
  });
});
