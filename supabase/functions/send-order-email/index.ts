import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'BioLinkWD <onboarding@resend.dev>';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { seller_id, buyer_name, product_name, amount, currency, payment_method, order_id } = await req.json();

    // Récupérer l'email du vendeur via auth.users (service role requis)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(seller_id);
    if (userErr || !user?.email) {
      return new Response(JSON.stringify({ error: 'Seller email not found' }), { status: 404 });
    }

    // Récupérer le nom de la boutique
    const { data: profile } = await supabase
      .from('profiles')
      .select('shop_name, display_name, username')
      .eq('user_id', seller_id)
      .maybeSingle();

    const shopName = profile?.shop_name || profile?.display_name || profile?.username || 'Votre boutique';

    const html = `
<!doctype html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f4f3ff;">
  <div style="max-width:520px;margin:30px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(108,99,255,0.12);">
    <div style="background:linear-gradient(135deg,#6C63FF,#8B5FBF,#FF6B9D);padding:32px 28px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:900;">🎉 Nouvelle commande !</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${shopName}</p>
    </div>
    <div style="padding:28px;">
      <p style="color:#16162e;font-size:14px;margin:0 0 18px;">
        Bonjour,<br><br>
        <strong>${buyer_name}</strong> vient de passer une commande sur votre boutique BioLinkWD.
      </p>
      <div style="background:#f5f3ff;border-radius:14px;padding:18px;margin-bottom:18px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:6px 0;color:#8a87a3;font-weight:600;">Produit</td>
            <td style="padding:6px 0;color:#16162e;font-weight:700;text-align:right;">${product_name}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#8a87a3;font-weight:600;">Montant</td>
            <td style="padding:6px 0;color:#6C63FF;font-weight:900;text-align:right;">${Number(amount).toLocaleString()} ${currency}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#8a87a3;font-weight:600;">Paiement</td>
            <td style="padding:6px 0;color:#16162e;font-weight:700;text-align:right;">${payment_method.toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#8a87a3;font-weight:600;">Client</td>
            <td style="padding:6px 0;color:#16162e;font-weight:700;text-align:right;">${buyer_name}</td>
          </tr>
        </table>
      </div>
      <p style="color:#8a87a3;font-size:12px;margin:0 0 18px;line-height:1.6;">
        Connectez-vous à votre tableau de bord pour voir les détails et expédier la commande.
        L'argent sera crédité sur votre solde après confirmation de réception par l'acheteur.
      </p>
      <div style="text-align:center;">
        <a href="${SUPABASE_URL.replace('.supabase.co', '.vercel.app') || 'https://biolinkwd.com'}"
          style="display:inline-block;background:linear-gradient(135deg,#6C63FF,#00C2FF);color:#fff;font-weight:800;font-size:13px;padding:12px 28px;border-radius:14px;text-decoration:none;">
          Voir la commande
        </a>
      </div>
    </div>
    <div style="text-align:center;padding:18px;color:#8a87a3;font-size:11px;">
      BioLinkWD · propulsé par WhiteDuckSaaS
    </div>
  </div>
</body>
</html>`;

    // Envoyer l'email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [user.email],
        subject: `🛒 Nouvelle commande de ${buyer_name} — ${Number(amount).toLocaleString()} ${currency}`,
        html,
      }),
    });

    const emailData = await emailRes.json();

    return new Response(JSON.stringify({ success: true, email: emailData }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
