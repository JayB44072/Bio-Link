/** Liens WhatsApp et messages préremplis pour contacter le prestataire d'un service. */

type Lang = 'fr' | 'en' | 'pt' | 'de';
export type ServiceMessageKind = 'interest' | 'book' | 'question' | 'availability';

/** Chiffres seuls, sans le préfixe international « 00 » (format attendu par wa.me). */
export function whatsappDigits(number: string | null | undefined): string {
  let digits = (number ?? '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  return digits;
}

/** Adresse WhatsApp avec le message déjà rédigé ; `null` si le numéro est inutilisable. */
export function whatsappUrl(number: string | null | undefined, message: string): string | null {
  const digits = whatsappDigits(number);
  return digits.length >= 8 ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null;
}

interface ServiceInfo {
  name: string;
  price: number;
  currency: string;
}

const asLang = (l: string): Lang => (l === 'fr' || l === 'pt' || l === 'de' ? l : 'en');

/** Message prérempli selon l'intention du visiteur (intérêt, réservation, question, disponibilités ou devis). */
export function serviceMessage(kind: ServiceMessageKind, s: ServiceInfo, lang: string): string {
  const l = asLang(lang);
  const priced = s.price > 0;
  const price = priced ? ` (${s.price.toLocaleString()} ${s.currency})` : '';
  const t: Record<ServiceMessageKind, Record<Lang, string>> = {
    interest: {
      fr: `Bonjour 👋, votre service *${s.name}*${price} m'intéresse.`,
      en: `Hello 👋, I'm interested in your service *${s.name}*${price}.`,
      pt: `Olá 👋, tenho interesse no seu serviço *${s.name}*${price}.`,
      de: `Hallo 👋, ich interessiere mich für Ihren Service *${s.name}*${price}.`,
    },
    book: {
      fr: `Bonjour 👋, je souhaite réserver votre service : *${s.name}*${price}.`,
      en: `Hello 👋, I'd like to book your service: *${s.name}*${price}.`,
      pt: `Olá 👋, gostaria de reservar o seu serviço: *${s.name}*${price}.`,
      de: `Hallo 👋, ich möchte Ihren Service buchen: *${s.name}*${price}.`,
    },
    question: {
      fr: `Bonjour 👋, j'ai une question au sujet de votre service : *${s.name}*.`,
      en: `Hello 👋, I have a question about your service: *${s.name}*.`,
      pt: `Olá 👋, tenho uma dúvida sobre o seu serviço: *${s.name}*.`,
      de: `Hallo 👋, ich habe eine Frage zu Ihrem Service: *${s.name}*.`,
    },
    availability: priced
      ? {
        fr: `Bonjour 👋, quelles sont vos disponibilités pour : *${s.name}* ?`,
        en: `Hello 👋, what is your availability for: *${s.name}*?`,
        pt: `Olá 👋, quais são as suas disponibilidades para: *${s.name}*?`,
        de: `Hallo 👋, wann sind Sie verfügbar für: *${s.name}*?`,
      }
      : {
        fr: `Bonjour 👋, pouvez-vous me faire un devis pour : *${s.name}* ?`,
        en: `Hello 👋, could you send me a quote for: *${s.name}*?`,
        pt: `Olá 👋, pode enviar-me um orçamento para: *${s.name}*?`,
        de: `Hallo 👋, können Sie mir ein Angebot für *${s.name}* senden?`,
      },
  };
  return t[kind][l];
}
