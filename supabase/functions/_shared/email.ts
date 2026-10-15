// Envoi d'e-mails commun aux fonctions Edge. Deux fournisseurs possibles, choisis par les secrets définis :
//
//  * Brevo  (BREVO_API_KEY)  : gratuit (300 e-mails/jour) et n'exige PAS de nom de domaine : on peut envoyer depuis
//                              une simple adresse vérifiée (ex. une adresse Gmail). Choisi s'il est configuré.
//  * Resend (RESEND_API_KEY) : gratuit aussi, mais n'envoie à d'autres personnes qu'une fois un nom de domaine vérifié.
//
// L'expéditeur est le secret NOTIFY_FROM, au format « Nom <adresse@exemple.com> ».

export interface Mail {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

export type Provider = 'brevo' | 'resend';

export function emailProvider(): Provider | null {
  if (Deno.env.get('BREVO_API_KEY')) return 'brevo';
  if (Deno.env.get('RESEND_API_KEY')) return 'resend';
  return null;
}

/** « Nom <a@b.com> » → { name, email }. */
export function parseSender(from: string): { name: string; email: string } {
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return m ? { name: m[1].replace(/^"|"$/g, ''), email: m[2] } : { name: '', email: from.trim() };
}

async function sendBrevo(mail: Mail): Promise<boolean> {
  const sender = parseSender(mail.from);
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': Deno.env.get('BREVO_API_KEY') ?? '', 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        sender: sender.name ? sender : { email: sender.email },
        to: mail.to.map(email => ({ email })),
        subject: mail.subject,
        htmlContent: mail.html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Envoie les messages et renvoie le nombre réellement envoyés. */
export async function sendMails(mails: Mail[]): Promise<number> {
  const provider = emailProvider();
  if (!provider || mails.length === 0) return 0;

  if (provider === 'resend') {
    let sent = 0;
    for (let i = 0; i < mails.length; i += 100) {
      const batch = mails.slice(i, i + 100);
      try {
        const res = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(batch),
        });
        if (res.ok) sent += batch.length;
      } catch { /* lot suivant */ }
    }
    return sent;
  }

  // Brevo : un appel par message, 5 à la fois
  let sent = 0;
  for (let i = 0; i < mails.length; i += 5) {
    const results = await Promise.all(mails.slice(i, i + 5).map(sendBrevo));
    sent += results.filter(Boolean).length;
  }
  return sent;
}
