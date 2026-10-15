// Fonction Edge Supabase : e-mail de bienvenue envoyé à un visiteur qui vient de s'abonner à une page publique.
// Il contient le lien privé « Voir mes livraisons » (jeton de l'abonné) : seul le propriétaire de la boîte mail le reçoit,
// ce qui prouve que l'adresse est bien la sienne.
//
// Déploiement : supabase functions deploy welcome-subscriber
// (mêmes secrets que notify-subscribers : BREVO_API_KEY ou RESEND_API_KEY, NOTIFY_FROM, SITE_URL)
//
// Sécurité :
//  * appelable sans compte, mais un abonné ne reçoit qu'UN SEUL message de bienvenue (colonne `welcomed_at`,
//    réservée de façon atomique avant l'envoi) : impossible d'inonder une boîte mail ;
//  * la réponse est identique que l'adresse soit abonnée ou non (ne révèle pas qui est abonné) ;
//  * le nom de boutique est échappé avant d'entrer dans le HTML.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { emailProvider, sendMails } from '../_shared/email.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function renderEmail(opts: { shop: string; page: string; deliveries: string; unsubscribe: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f6f5ff;font-family:system-ui,-apple-system,Segoe UI,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px;">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:20px;overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#6C63FF,#00C2FF);padding:22px 26px;color:#ffffff;font-weight:800;font-size:15px;">${escapeHtml(opts.shop)}</td></tr>
      <tr><td style="padding:26px;">
        <h1 style="margin:0 0 10px;font-size:20px;color:#16162e;">Bienvenue !</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#4b4b63;">Vous suivez maintenant ${escapeHtml(opts.shop)} : vous serez prévenu(e) de chaque nouveau produit, service ou annonce.</p>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#4b4b63;">Ce lien vous est personnel : il affiche toutes vos livraisons en cours sur la carte de la boutique, sans rien saisir. Ne le partagez pas.</p>
        <a href="${opts.deliveries}" style="display:inline-block;background:#6C63FF;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:999px;">Voir mes livraisons</a>
        <p style="margin:16px 0 0;font-size:13px;"><a href="${opts.page}" style="color:#6C63FF;">Visiter la boutique</a></p>
      </td></tr>
      <tr><td style="padding:16px 26px 24px;font-size:12px;color:#8a87a3;border-top:1px solid #eeebfb;">
        Si vous n'êtes pas à l'origine de cet abonnement, ignorez ce message ou
        <a href="${opts.unsubscribe}" style="color:#6C63FF;">désabonnez-vous</a>.
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const from = Deno.env.get('NOTIFY_FROM');
  const site = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '');
  if (!url || !service || !emailProvider() || !from || !site) return json({ error: 'failed', detail: 'not_configured' }, 500);

  let payload: { username?: string; email?: string };
  try { payload = await req.json(); } catch { return json({ error: 'failed', detail: 'bad_json' }, 400); }
  const username = (payload.username ?? '').trim();
  const email = (payload.email ?? '').trim().toLowerCase();
  if (!username || email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'failed', detail: 'invalid_payload' }, 400);

  const admin = createClient(url, service);
  const { data: profile } = await admin.from('profiles').select('user_id, username, shop_name, display_name').eq('username', username).maybeSingle();
  // Même réponse dans tous les cas où rien n'est envoyé
  if (!profile) return json({ ok: true });

  // Réservation atomique : un seul message de bienvenue par abonné
  const { data: claimed } = await admin.from('page_subscribers')
    .update({ welcomed_at: new Date().toISOString() })
    .eq('seller_id', profile.user_id).eq('email', email).is('unsubscribed_at', null).is('welcomed_at', null)
    .select('token');
  const sub = claimed?.[0];
  if (!sub) return json({ ok: true });

  const shop = profile.shop_name || profile.display_name || profile.username;
  const sentCount = await sendMails([{
    from,
    to: [email],
    subject: `Bienvenue chez ${shop}`,
    html: renderEmail({
      shop,
      page: `${site}/u/${profile.username}`,
      deliveries: `${site}/u/${profile.username}?abo=${sub.token}`,
      unsubscribe: `${site}/desabonnement/${sub.token}`,
    }),
  }]);
  if (sentCount === 0) {
    // Échec d'envoi : on libère la réservation pour permettre un nouvel essai
    await admin.from('page_subscribers').update({ welcomed_at: null }).eq('seller_id', profile.user_id).eq('email', email);
    return json({ error: 'failed', detail: 'provider_error' }, 502);
  }
  return json({ ok: true });
});
