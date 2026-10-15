// Fonction Edge Supabase : envoie un e-mail aux abonnés actifs de la page publique du vendeur connecté.
//
// Déploiement (voir aussi supabase/functions/notify-subscribers/README.md) :
//   supabase functions deploy notify-subscribers
//   supabase secrets set BREVO_API_KEY=... NOTIFY_FROM="Ma Boutique <notifications@mondomaine.com>" SITE_URL=https://biolinkwd.duckdns.org
//
// Sécurité :
//  * l'appelant doit être un vendeur connecté (jeton JWT vérifié) ; il ne peut écrire qu'à SES abonnés ;
//  * limite de 10 envois par 24 h et par vendeur ;
//  * chaque e-mail contient un lien de désabonnement propre au destinataire ;
//  * tout le texte venant du vendeur est échappé avant d'entrer dans le HTML.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { emailProvider, sendMails } from '../_shared/email.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const KINDS = ['product', 'service', 'announcement', 'custom'];
const DAILY_LIMIT = 10;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function renderEmail(opts: { shop: string; title: string; body: string; link: string; unsubscribe: string; deliveries: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f6f5ff;font-family:system-ui,-apple-system,Segoe UI,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px;">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:20px;overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#6C63FF,#00C2FF);padding:22px 26px;color:#ffffff;font-weight:800;font-size:15px;">${escapeHtml(opts.shop)}</td></tr>
      <tr><td style="padding:26px;">
        <h1 style="margin:0 0 10px;font-size:20px;color:#16162e;">${escapeHtml(opts.title)}</h1>
        ${opts.body ? `<p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#4b4b63;white-space:pre-line;">${escapeHtml(opts.body)}</p>` : ''}
        <a href="${opts.link}" style="display:inline-block;background:#6C63FF;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:999px;">Voir la page</a>
        <p style="margin:16px 0 0;font-size:13px;"><a href="${opts.deliveries}" style="color:#6C63FF;">Voir mes livraisons sur la carte</a></p>
      </td></tr>
      <tr><td style="padding:16px 26px 24px;font-size:12px;color:#8a87a3;border-top:1px solid #eeebfb;">
        Vous recevez ce message car vous suivez ${escapeHtml(opts.shop)}.
        <a href="${opts.unsubscribe}" style="color:#6C63FF;">Se désabonner</a>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const from = Deno.env.get('NOTIFY_FROM');
  const site = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '');
  if (!url || !anon || !service || !emailProvider() || !from || !site) return json({ error: 'failed', detail: 'not_configured' }, 500);

  // 1) Qui appelle ?
  const userClient = createClient(url, anon, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'unauthorized' }, 401);

  // 2) Données reçues
  let payload: { kind?: string; title?: string; body?: string; path?: string };
  try { payload = await req.json(); } catch { return json({ error: 'failed', detail: 'bad_json' }, 400); }
  const kind = payload.kind ?? '';
  const title = (payload.title ?? '').trim();
  const body = (payload.body ?? '').trim();
  if (!KINDS.includes(kind) || title.length < 1 || title.length > 140 || body.length > 1000) return json({ error: 'failed', detail: 'invalid_payload' }, 400);

  const admin = createClient(url, service);

  // 3) Limite quotidienne
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await admin.from('page_notifications').select('id', { count: 'exact', head: true })
    .eq('seller_id', user.id).gte('created_at', since);
  if ((count ?? 0) >= DAILY_LIMIT) return json({ error: 'rate_limited' });

  // 4) Boutique et abonnés actifs (uniquement ceux de l'appelant)
  const { data: profile } = await admin.from('profiles').select('username, shop_name, display_name').eq('user_id', user.id).maybeSingle();
  if (!profile) return json({ error: 'failed', detail: 'no_profile' }, 400);
  const shop = profile.shop_name || profile.display_name || profile.username;
  const { data: subs } = await admin.from('page_subscribers').select('email, token')
    .eq('seller_id', user.id).is('unsubscribed_at', null);
  if (!subs || subs.length === 0) return json({ error: 'no_subscribers' });

  // 5) Envoi par lots de 100 (un e-mail par destinataire, avec son lien de désabonnement)
  const safePath = payload.path && payload.path.startsWith('/') && !payload.path.startsWith('//') ? payload.path : `/u/${profile.username}`;
  const link = `${site}${safePath}`;
  let sent = 0;
  for (let i = 0; i < subs.length; i += 100) {
    const batch = subs.slice(i, i + 100).map(s => ({
      from,
      to: [s.email],
      subject: `${shop} — ${title}`,
      html: renderEmail({ shop, title, body, link, unsubscribe: `${site}/desabonnement/${s.token}`, deliveries: `${site}/u/${profile.username}?abo=${s.token}` }),
    }));
    sent += await sendMails(batch);
  }
  if (sent === 0) return json({ error: 'failed', detail: 'provider_error' }, 502);

  await admin.from('page_notifications').insert({ seller_id: user.id, kind, title, body, recipients: sent });
  return json({ sent });
});
