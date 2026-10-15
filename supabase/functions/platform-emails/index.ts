// Fonction Edge Supabase : e-mails de la plateforme BioLinkWD aux vendeurs inscrits.
//
//  mode "announce"  (administrateur connecté) : annonce d'une nouveauté à tous les vendeurs (ou test à soi-même) ;
//  mode "history"   (administrateur connecté) : dernières annonces envoyées ;
//  mode "weekly"    (planificateur, en-tête x-cron-secret) : rappel hebdomadaire aux vendeurs qui ne se connectent plus,
//                    avec un rappel du programme de parrainage.
//
// Déploiement : voir supabase/functions/platform-emails/README.md
//   supabase functions deploy platform-emails --no-verify-jwt
//   supabase secrets set BREVO_API_KEY=... NOTIFY_FROM="BioLinkWD <notifications@mondomaine.com>" SITE_URL=https://biolinkwd.duckdns.org \
//     ADMIN_EMAILS=vous@exemple.com CRON_SECRET=<longue chaîne aléatoire>
//
// Sécurité :
//  * l'administrateur est reconnu par la liste ADMIN_EMAILS (secret serveur) et non par `profiles.is_admin`,
//    colonne que chaque utilisateur peut modifier lui-même ;
//  * le rappel hebdomadaire exige le secret CRON_SECRET ;
//  * chaque e-mail porte un lien « Ne plus recevoir ces e-mails » propre au destinataire (respecté ensuite) ;
//  * un vendeur reçoit au plus un rappel par semaine, et 8 rappels en tout s'il ne revient jamais ;
//  * tout texte saisi est échappé avant d'entrer dans le HTML.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { emailProvider, sendMails, type Mail } from '../_shared/email.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

const ANNOUNCE_DAILY_LIMIT = 3;
const INACTIVE_DAYS = 7;
const MAX_REMINDERS = 8;
const WEEKLY_BATCH_CAP = 200;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();

interface Layout {
  preheader: string;
  heading: string;
  paragraphs: string[];
  cta?: { label: string; url: string };
  extra?: string;
  unsubscribe: string;
}

function layout(o: Layout): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f6f5ff;font-family:system-ui,-apple-system,Segoe UI,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(o.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px;">
    <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#6C63FF,#00C2FF);padding:22px 28px;color:#ffffff;font-weight:800;font-size:16px;">BioLinkWD</td></tr>
      <tr><td style="padding:28px;">
        <h1 style="margin:0 0 14px;font-size:21px;line-height:1.3;color:#16162e;">${esc(o.heading)}</h1>
        ${o.paragraphs.map(p => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#4b4b63;white-space:pre-line;">${esc(p)}</p>`).join('\n        ')}
        ${o.cta ? `<p style="margin:22px 0 4px;"><a href="${esc(o.cta.url)}" style="display:inline-block;background:#6C63FF;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 24px;border-radius:999px;">${esc(o.cta.label)}</a></p>` : ''}
        ${o.extra ?? ''}
      </td></tr>
      <tr><td style="padding:16px 28px 24px;font-size:12px;line-height:1.6;color:#8a87a3;border-top:1px solid #eeebfb;">
        Vous recevez ce message car vous avez un compte vendeur BioLinkWD.
        <a href="${esc(o.unsubscribe)}" style="color:#6C63FF;">Ne plus recevoir ces e-mails</a>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

/** Bloc « parrainage » : les conditions réelles du programme (5 % / 2 % / 1 % pendant 12 mois). */
function referralBlock(link: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;background:#f7f6ff;border-radius:16px;"><tr><td style="padding:18px 20px;">
      <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#16162e;">Parrainez d'autres vendeurs, générez un revenu en plus</p>
      <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#4b4b63;">Pour chaque abonnement payant souscrit par une personne que vous avez parrainée, vous percevez <strong>5&nbsp;%</strong> (2&nbsp;% sur les filleuls de vos filleuls, 1&nbsp;% au troisième niveau), pendant 12 mois, crédités sur votre solde retirable.</p>
      <p style="margin:0;font-size:13px;color:#4b4b63;">Votre lien personnel : <a href="${esc(link)}" style="color:#6C63FF;word-break:break-all;">${esc(link)}</a></p>
    </td></tr></table>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const from = Deno.env.get('NOTIFY_FROM');
  const site = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '');
  const admins = (Deno.env.get('ADMIN_EMAILS') ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const cronSecret = Deno.env.get('CRON_SECRET') ?? '';
  if (!url || !anon || !service || !emailProvider() || !from || !site) return json({ error: 'failed', detail: 'not_configured' }, 500);

  let payload: { mode?: string; title?: string; body?: string; cta_label?: string; cta_path?: string; test?: boolean };
  try { payload = await req.json(); } catch { return json({ error: 'failed', detail: 'bad_json' }, 400); }
  const admin = createClient(url, service);

  /** Tous les comptes, page par page. */
  async function allUsers() {
    const out: Array<{ id: string; email: string; created_at: string; last_sign_in_at: string | null }> = [];
    for (let page = 1; page <= 30; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error || !data?.users?.length) break;
      for (const u of data.users) if (u.email) out.push({ id: u.id, email: u.email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at ?? null });
      if (data.users.length < 1000) break;
    }
    return out;
  }

  /** Préférences de chaque compte (créées au besoin) : jeton de désinscription, refus, historique des rappels. */
  async function prefsFor(ids: string[]) {
    const map = new Map<string, { token: string; opted_out: boolean; last_reminder_at: string | null; reminders_sent: number }>();
    for (let i = 0; i < ids.length; i += 400) {
      const chunk = ids.slice(i, i + 400);
      await admin.from('platform_email_prefs').upsert(chunk.map(user_id => ({ user_id })), { onConflict: 'user_id', ignoreDuplicates: true });
      const { data } = await admin.from('platform_email_prefs').select('user_id, token, opted_out, last_reminder_at, reminders_sent').in('user_id', chunk);
      (data ?? []).forEach(r => map.set(r.user_id, r));
    }
    return map;
  }

  /* ───────── Rappel hebdomadaire (planificateur) ───────── */
  if (payload.mode === 'weekly') {
    if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) return json({ error: 'unauthorized' }, 401);

    const now = Date.now();
    const cutoff = now - INACTIVE_DAYS * 86400000;
    const inactive = (await allUsers()).filter(u => new Date(u.created_at).getTime() < cutoff && new Date(u.last_sign_in_at ?? u.created_at).getTime() < cutoff);
    if (inactive.length === 0) return json({ sent: 0 });

    const prefs = await prefsFor(inactive.map(u => u.id));
    const due = inactive.filter(u => {
      const p = prefs.get(u.id);
      return p && !p.opted_out && p.reminders_sent < MAX_REMINDERS
        && (!p.last_reminder_at || new Date(p.last_reminder_at).getTime() < now - 6 * 86400000);
    }).slice(0, WEEKLY_BATCH_CAP);
    if (due.length === 0) return json({ sent: 0 });

    const ids = due.map(u => u.id);
    const [{ data: profiles }, { data: prods }, { data: svcs }] = await Promise.all([
      admin.from('profiles').select('user_id, username, shop_name, display_name, referral_code').in('user_id', ids),
      admin.from('products').select('user_id').in('user_id', ids).eq('is_active', true),
      admin.from('services').select('user_id').in('user_id', ids).eq('is_active', true),
    ]);
    const profileBy = new Map((profiles ?? []).map(p => [p.user_id, p]));
    const hasContent = new Set([...(prods ?? []), ...(svcs ?? [])].map(r => r.user_id));

    let sent = 0;
    for (let i = 0; i < due.length; i += 100) {
      const group = due.slice(i, i + 100);
      const messages = group.map(u => {
        const p = profileBy.get(u.id);
        const name = p?.shop_name || p?.display_name || p?.username || '';
        const refLink = p?.referral_code ? `${site}/?ref=${encodeURIComponent(p.referral_code)}` : `${site}/`;
        const populated = hasContent.has(u.id);
        const paragraphs = populated
          ? [
              `Bonjour${name ? ` ${name}` : ''},`,
              "Cela fait quelques jours que vous ne vous êtes pas connecté(e). Votre boutique reste en ligne : c'est le bon moment de vérifier vos commandes, de mettre à jour vos prix et vos stocks, et de partager votre lien à vos contacts.",
            ]
          : [
              `Bonjour${name ? ` ${name}` : ''},`,
              "Votre compte est créé, mais votre boutique n'a pas encore de produit ni de service. Quelques minutes suffisent pour en ajouter un et recevoir vos premières commandes par Mobile Money, carte bancaire ou WhatsApp.",
            ];
        return {
          from, to: [u.email],
          subject: populated ? 'Votre boutique BioLinkWD vous attend' : 'Ajoutez votre premier produit en 2 minutes',
          html: layout({
            preheader: populated ? 'Vérifiez vos commandes et votre boutique.' : 'Votre boutique est prête à accueillir ses premiers articles.',
            heading: populated ? 'Un point sur votre boutique ?' : 'Votre boutique est prête',
            paragraphs,
            cta: { label: populated ? 'Ouvrir mon tableau de bord' : 'Ajouter mon premier produit', url: `${site}/` },
            extra: referralBlock(refLink),
            unsubscribe: `${site}/preferences-email/${prefs.get(u.id)!.token}`,
          }),
        };
      });
      const done = await sendMails(messages as Mail[]);
      if (done > 0) {
        sent += done;
        const stamp = new Date().toISOString();
        await Promise.all(group.map(u => admin.from('platform_email_prefs')
          .update({ last_reminder_at: stamp, reminders_sent: (prefs.get(u.id)!.reminders_sent ?? 0) + 1 }).eq('user_id', u.id)));
      }
    }
    return json({ sent });
  }

  /* ───────── Modes réservés à l'administrateur ───────── */
  const userClient = createClient(url, anon, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'unauthorized' }, 401);
  if (!user.email || !admins.includes(user.email.toLowerCase())) return json({ error: 'forbidden' }, 403);

  if (payload.mode === 'history') {
    const { data } = await admin.from('platform_announcements').select('id, title, recipients, created_at').order('created_at', { ascending: false }).limit(10);
    return json({ announcements: data ?? [] });
  }

  if (payload.mode !== 'announce') return json({ error: 'failed', detail: 'bad_mode' }, 400);

  const title = oneLine(payload.title ?? '');
  const body = (payload.body ?? '').trim();
  const ctaLabel = oneLine(payload.cta_label ?? '');
  const ctaPath = (payload.cta_path ?? '').trim();
  if (title.length < 1 || title.length > 140 || body.length > 2000 || ctaLabel.length > 60) return json({ error: 'failed', detail: 'invalid_payload' }, 400);
  if (ctaPath && (!ctaPath.startsWith('/') || ctaPath.startsWith('//'))) return json({ error: 'failed', detail: 'invalid_path' }, 400);

  if (!payload.test) {
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await admin.from('platform_announcements').select('id', { count: 'exact', head: true }).gte('created_at', since);
    if ((count ?? 0) >= ANNOUNCE_DAILY_LIMIT) return json({ error: 'rate_limited' });
  }

  const everyone = payload.test ? (await allUsers()).filter(u => u.id === user.id) : await allUsers();
  const prefs = await prefsFor(everyone.map(u => u.id));
  const targets = everyone.filter(u => payload.test || !prefs.get(u.id)?.opted_out);
  if (targets.length === 0) return json({ error: 'no_recipients' });

  const paragraphs = body ? body.split(/\n{2,}/).map(s => s.trim()).filter(Boolean) : [];
  let sent = 0;
  for (let i = 0; i < targets.length; i += 100) {
    const messages = targets.slice(i, i + 100).map(u => ({
      from, to: [u.email],
      subject: payload.test ? `[Test] ${title}` : title,
      html: layout({
        preheader: paragraphs[0] ?? title,
        heading: title,
        paragraphs,
        cta: ctaLabel && ctaPath ? { label: ctaLabel, url: `${site}${ctaPath}` } : undefined,
        unsubscribe: `${site}/preferences-email/${prefs.get(u.id)!.token}`,
      }),
    }));
    sent += await sendMails(messages as Mail[]);
  }
  if (sent === 0) return json({ error: 'failed', detail: 'provider_error' }, 502);

  if (!payload.test) {
    await admin.from('platform_announcements').insert({ sent_by: user.id, title, body, cta_label: ctaLabel, cta_path: ctaPath, recipients: sent });
  }
  return json({ sent });
});
