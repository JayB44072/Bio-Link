import React, { useEffect, useMemo, useState } from 'react';
import { appOrigin } from '../../../lib/appOrigin';
import { Profile, AffiliateCommission } from '../../../lib/types';
import { useLang } from '../../../lib/LanguageContext';
import { useAppPrefs } from '../../../lib/AppPrefsContext';
import { supabase } from '../../../lib/supabase';
import { BRAND, GRADIENTS } from '../../../lib/theme';
import { dashPalette } from '../../../lib/dashPalette';
import { CenteredSpinner } from '../../ui/Spinner';
import {
  Users, Copy, Check, Share2, Sparkles, Gift, TrendingUp, Coins,
  ArrowDownCircle, Smartphone, AlertCircle, Loader2, Trophy,
  MessageCircle, Facebook, Twitter, Info,
} from 'lucide-react';

interface AffiliateProps {
  profile: Profile;
  onUpdate: (updates: Partial<Profile>) => void;
}

const COPY = {
  fr: {
    title: 'Parrainage & Affiliation',
    dealTitle: 'Gagne jusqu\'à 3 niveaux de commissions',
    dealSub: 'Tu touches 5% sur chaque abonnement de tes filleuls directs, 2% sur les filleuls de tes filleuls, et 1% sur le 3ème niveau. Pendant 12 mois, crédité directement sur ton solde retirable.',
    yourLink: 'Ton lien de parrainage unique',
    copyLink: 'Copier le lien',
    copied: 'Copié !',
    share: 'Partager',
    shareOn: 'Partager sur',
    stats: 'Tes statistiques',
    totalReferrals: 'Filleuls inscrits',
    paidReferrals: 'Filleuls abonnés',
    balance: 'Solde à retirer',
    lifetime: 'Gains à vie',
    commissions: 'Historique des commissions',
    noCommissions: 'Aucune commission pour le moment. Partage ton lien pour commencer à gagner !',
    withdraw: 'Demander un retrait',
    minWithdraw: 'Le montant minimum est de 1 000 FCFA.',
    insufficient: 'Solde insuffisant.',
    withdrawSuccess: 'Ta demande de retrait a été envoyée.',
    phone: 'Numéro de téléphone',
    amount: 'Montant (FCFA)',
    method: 'Opérateur',
    cancel: 'Annuler',
    validate: 'Envoyer la demande',
    close: 'Fermer',
    from: 'De',
    date: 'Date',
    plan: 'Forfait',
    amountCol: 'Abonnement',
    commissionCol: 'Ta commission',
    status: 'Statut',
    paid: 'Crédité',
    pending: 'Crédité',
    credited: 'Crédité au solde',
    level: 'Niveau',
    l1: 'Direct',
    l2: 'Niveau 2',
    l3: 'Niveau 3',
    shareMessage: (link: string) => `Découvre BioLinkWD, la boutique en ligne pour créateurs et vendeurs — crée ta page en 2 minutes : ${link}`,
    referralHelper: 'Toute personne qui s\'inscrit via ce lien devient ton filleul direct. Tu touches 5% de son abonnement, plus 2% et 1% sur ses propres filleuls.',
    tiersTitle: 'Structure des commissions multi-niveaux',
    tier1: '5% sur tes filleuls directs',
    tier1Sub: 'Toute personne inscrite via ton lien',
    tier2: '2% sur les filleuls de tes filleuls',
    tier2Sub: 'Ton réseau qui recrute pour toi',
    tier3: '1% sur le 3ème niveau',
    tier3Sub: 'Croissance passive du réseau',
    howItWorks: 'Comment ça marche',
    step1: 'Partage ton lien avec ta communauté',
    step2: 'Ton filleul s\'inscrit et choisit un forfait payant',
    step3: 'Commission créditée directement sur ton solde',
  },
  en: {
    title: 'Referrals & Affiliate',
    dealTitle: 'Earn commissions across 3 tiers',
    dealSub: 'You get 5% on your direct referrals, 2% on their referrals, and 1% on the 3rd tier. For 12 months, credited directly to your withdrawable balance.',
    yourLink: 'Your unique referral link',
    copyLink: 'Copy link',
    copied: 'Copied!',
    share: 'Share',
    shareOn: 'Share on',
    stats: 'Your stats',
    totalReferrals: 'Signed-up referrals',
    paidReferrals: 'Paid referrals',
    balance: 'Balance to withdraw',
    lifetime: 'Lifetime earnings',
    commissions: 'Commission history',
    noCommissions: 'No commissions yet. Share your link to start earning!',
    withdraw: 'Request withdrawal',
    minWithdraw: 'Minimum amount is 1,000 FCFA.',
    insufficient: 'Insufficient balance.',
    withdrawSuccess: 'Your withdrawal request has been sent.',
    phone: 'Phone number',
    amount: 'Amount (FCFA)',
    method: 'Operator',
    cancel: 'Cancel',
    validate: 'Send request',
    close: 'Close',
    from: 'From',
    date: 'Date',
    plan: 'Plan',
    amountCol: 'Subscription',
    commissionCol: 'Your commission',
    status: 'Status',
    paid: 'Credited',
    pending: 'Credited',
    credited: 'Credited to balance',
    level: 'Level',
    l1: 'Direct',
    l2: 'Level 2',
    l3: 'Level 3',
    shareMessage: (link: string) => `Check out BioLinkWD, the online shop for creators & sellers — build your page in 2 minutes: ${link}`,
    referralHelper: 'Anyone who signs up through this link becomes your direct referral. You earn 5% on their subscription, plus 2% and 1% on their own referrals.',
    tiersTitle: 'Multi-tier commission structure',
    tier1: '5% on direct referrals',
    tier1Sub: 'Anyone signing up through your link',
    tier2: '2% on your referrals\' referrals',
    tier2Sub: 'Your network recruiting for you',
    tier3: '1% on the 3rd tier',
    tier3Sub: 'Passive network growth',
    howItWorks: 'How it works',
    step1: 'Share your link with your community',
    step2: 'Your referral signs up and picks a paid plan',
    step3: 'Commission credited to your balance instantly',
  },
};

export default function Affiliate({ profile, onUpdate }: AffiliateProps) {
  const { lang } = useLang();
  const { isDark: dk } = useAppPrefs();
  const c = COPY[lang === 'en' ? 'en' : 'fr'];

  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [paidReferrals, setPaidReferrals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<'mtn' | 'orange'>('mtn');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [err, setErr] = useState('');

  /* ── Theme tokens ── */
  const { surface, surfaceAlt, border, txtPrim, txtLabel, txtSub, inputBg, inputBorder, cardShadow } = dashPalette(dk);

  const referralCode = profile.referral_code || '';
  const affiliateBalance = Number(profile.affiliate_balance ?? 0);
  const lifetimeEarned = Number(profile.lifetime_affiliate_earned ?? 0);

  const referralLink = useMemo(() => {
    const origin = typeof window !== 'undefined' ? appOrigin() : 'https://biolink-wd.onrender.com';
    return referralCode ? `${origin}?ref=${referralCode}` : origin;
  }, [referralCode]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [commRes, refCountRes, paidCountRes] = await Promise.all([
        supabase
          .from('affiliate_commissions')
          .select('*')
          .eq('referrer_id', profile.id)
          .order('earned_at', { ascending: false })
          .limit(50),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('referred_by', profile.id),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('referred_by', profile.id)
          .neq('plan_type', 'free'),
      ]);
      setCommissions((commRes.data || []) as AffiliateCommission[]);
      setTotalReferrals(refCountRes.count ?? 0);
      setPaidReferrals(paidCountRes.count ?? 0);
      setLoading(false);
    }
    load();
  }, [profile.id]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  }

  async function handleNativeShare() {
    const shareData = {
      title: 'BioLinkWD',
      text: c.shareMessage(referralLink),
      url: referralLink,
    };
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share(shareData);
        return;
      } catch { /* fall through to copy */ }
    }
    handleCopy();
  }

  function shareOnWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(c.shareMessage(referralLink))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  function shareOnFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  function shareOnTwitter() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(c.shareMessage(referralLink))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 1000) { setErr(c.minWithdraw); return; }
    if (amt > affiliateBalance) { setErr(c.insufficient); return; }
    setSubmitting(true);

    const { error } = await supabase.from('withdrawal_requests').insert({
      user_id: profile.user_id,
      amount: amt,
      payment_method: method,
      phone_number: phone,
      is_priority: profile.plan_type === 'premium',
    });

    if (!error) {
      const newBalance = affiliateBalance - amt;
      await supabase.from('profiles').update({ affiliate_balance: newBalance }).eq('id', profile.id);
      onUpdate({ affiliate_balance: newBalance });
      setSuccess(c.withdrawSuccess);
      setShowForm(false);
      setAmount('');
      setPhone('');
      setTimeout(() => setSuccess(''), 3500);
    } else {
      setErr(error.message);
    }
    setSubmitting(false);
  }

  const statCards = [
    { icon: Users,      label: c.totalReferrals, value: totalReferrals.toString(),                   accent: BRAND.violet },
    { icon: TrendingUp, label: c.paidReferrals,  value: paidReferrals.toString(),                    accent: '#22c55e' },
    { icon: Coins,      label: c.balance,        value: `${affiliateBalance.toLocaleString()} FCFA`, accent: BRAND.pink },
    { icon: Trophy,     label: c.lifetime,       value: `${lifetimeEarned.toLocaleString()} FCFA`,   accent: BRAND.cyan },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Users size={22} style={{ color: '#22c55e' }} />
        <h2 className="font-black text-xl" style={{ color: txtPrim }}>{c.title}</h2>
      </div>

      {/* Deal explainer — hero card */}
      <div className="rounded-3xl p-6 mb-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#22c55e 0%,#00C2FF 50%,#6C63FF 120%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="absolute -bottom-14 -left-8 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Gift size={16} color="rgba(255,255,255,0.9)" />
            <span className="text-sm font-bold text-white/90">{c.howItWorks}</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2">{c.dealTitle}</h3>
          <p className="text-white/85 text-sm leading-relaxed max-w-xl">{c.dealSub}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-5">
            {[c.step1, c.step2, c.step3].map((s, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-2xl px-3 py-2.5"
                style={{ background: 'rgba(255,255,255,0.14)' }}>
                <span className="w-6 h-6 rounded-full bg-white text-[12px] font-black flex items-center justify-center shrink-0"
                  style={{ color: '#22c55e' }}>{i + 1}</span>
                <p className="text-xs font-semibold text-white leading-snug">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Multi-tier commission structure card */}
      <div className="rounded-3xl p-5 mb-6" style={{ background: surface, border: `1px solid ${border}`, boxShadow: cardShadow }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} style={{ color: '#22c55e' }} />
          <p className="text-sm font-bold" style={{ color: txtPrim }}>{c.tiersTitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { pct: '5%', title: c.tier1, sub: c.tier1Sub, color: '#22c55e', bg: 'rgba(34,197,94,0.10)' },
            { pct: '2%', title: c.tier2, sub: c.tier2Sub, color: BRAND.cyan, bg: 'rgba(0,194,255,0.10)' },
            { pct: '1%', title: c.tier3, sub: c.tier3Sub, color: BRAND.violet, bg: 'rgba(108,99,255,0.10)' },
          ].map((t, i) => (
            <div key={i} className="rounded-2xl p-4 border" style={{ background: t.bg, borderColor: `${t.color}33` }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-black" style={{ color: t.color }}>{t.pct}</span>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: t.color }}>
                  {i === 0 ? 'L1' : i === 1 ? 'L2' : 'L3'}
                </span>
              </div>
              <p className="text-xs font-bold mb-0.5" style={{ color: txtPrim }}>{t.title}</p>
              <p className="text-[11px]" style={{ color: txtSub }}>{t.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral link card */}
      <div className="rounded-3xl p-5 mb-6" style={{ background: surface, border: `1px solid ${border}`, boxShadow: cardShadow }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} style={{ color: BRAND.violet }} />
          <p className="text-sm font-bold" style={{ color: txtPrim }}>{c.yourLink}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <div className="flex-1 rounded-xl px-4 py-3 font-mono text-xs md:text-sm break-all"
            style={{ background: surfaceAlt, border: `1px solid ${inputBorder}`, color: txtPrim }}>
            {referralLink}
          </div>
          <button onClick={handleCopy}
            className="flex items-center justify-center gap-2 text-white text-sm font-bold px-5 py-3 rounded-xl transition shrink-0"
            style={{ background: copied ? '#22c55e' : GRADIENTS.brand }}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? c.copied : c.copyLink}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold" style={{ color: txtSub }}>{c.shareOn} :</span>
          <button onClick={shareOnWhatsApp}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition"
            style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366' }}>
            <MessageCircle size={13} /> WhatsApp
          </button>
          <button onClick={shareOnFacebook}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition"
            style={{ background: 'rgba(24,119,242,0.12)', color: '#1877F2' }}>
            <Facebook size={13} /> Facebook
          </button>
          <button onClick={shareOnTwitter}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition"
            style={{ background: dk ? 'rgba(255,255,255,0.08)' : '#f3f4f6', color: dk ? '#f2f1ff' : BRAND.navy }}>
            <Twitter size={13} /> X / Twitter
          </button>
          <button onClick={handleNativeShare}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition"
            style={{ background: dk ? 'rgba(108,99,255,0.15)' : '#f5f3ff', color: BRAND.violet }}>
            <Share2 size={13} /> {c.share}
          </button>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl px-3 py-2.5"
          style={{ background: surfaceAlt }}>
          <Info size={13} style={{ color: txtSub }} className="mt-0.5 shrink-0" />
          <p className="text-xs leading-relaxed" style={{ color: txtSub }}>{c.referralHelper}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map(({ icon: Icon, label, value, accent }) => (
          <div key={label} className="rounded-2xl p-4"
            style={{ background: surface, border: `1px solid ${border}`, boxShadow: cardShadow }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${accent}1f` }}>
              <Icon size={16} color={accent} />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: txtSub }}>{label}</p>
            <p className="text-lg font-black" style={{ color: txtPrim }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Withdrawal */}
      {success && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <Check size={16} className="text-green-500" />
          <p className="text-green-500 text-sm font-medium">{success}</p>
        </div>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          disabled={affiliateBalance < 1000}
          className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-2xl transition shadow-lg mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg,#22c55e,#00C2FF)', boxShadow: '0 8px 24px rgba(34,197,94,0.3)' }}
        >
          <ArrowDownCircle size={18} />
          {c.withdraw}
        </button>
      ) : (
        <form onSubmit={handleWithdraw} className="rounded-3xl p-5 mb-6 space-y-4"
          style={{ background: surface, border: `1px solid ${border}`, boxShadow: cardShadow }}>
          <h3 className="font-bold" style={{ color: txtPrim }}>{c.withdraw}</h3>

          {err && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertCircle size={14} className="text-red-500" />
              <p className="text-red-500 text-sm font-medium">{err}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: txtLabel }}>{c.amount}</label>
            <input
              type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="1000"
              max={affiliateBalance}
              placeholder="Ex: 5000"
              className="w-full rounded-xl px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-violet/25"
              style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: txtLabel }}>{c.phone}</label>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
              placeholder="+225 07 00 00 00"
              className="w-full rounded-xl px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-violet/25"
              style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: txtLabel }}>{c.method}</label>
            <div className="flex gap-3">
              {(['mtn', 'orange'] as const).map(m => (
                <button
                  key={m} type="button" onClick={() => setMethod(m)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition"
                  style={method === m
                    ? { background: dk ? 'rgba(108,99,255,0.15)' : '#f5f3ff', border: '1px solid #6C63FF', color: BRAND.violet }
                    : { background: surfaceAlt, border: `1px solid ${inputBorder}`, color: txtSub }}
                >
                  <Smartphone size={16} />
                  {m === 'mtn' ? 'MTN Money' : 'Orange Money'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setShowForm(false); setErr(''); }}
              className="flex-1 text-sm font-semibold py-2.5 rounded-xl transition"
              style={{ background: surfaceAlt, color: txtSub }}>{c.cancel}</button>
            <button type="submit" disabled={submitting}
              className="flex-1 text-white text-sm font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#22c55e,#00C2FF)' }}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
              {c.validate}
            </button>
          </div>
        </form>
      )}

      {/* Commissions history */}
      <div className="rounded-2xl overflow-hidden" style={{ background: surface, border: `1px solid ${border}`, boxShadow: cardShadow }}>
        <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: border }}>
          <Coins size={16} style={{ color: txtSub }} />
          <h3 className="font-bold text-sm" style={{ color: txtPrim }}>{c.commissions}</h3>
        </div>
        {loading ? (
          <CenteredSpinner className="py-10" />
        ) : commissions.length === 0 ? (
          <div className="py-10 text-center px-6">
            <Gift size={28} className="mx-auto mb-2" style={{ color: txtSub }} />
            <p className="text-sm font-medium" style={{ color: txtSub }}>{c.noCommissions}</p>
          </div>
        ) : (
          <div>
            {commissions.map(comm => (
              <div key={comm.id}
                className="flex items-center justify-between px-5 py-3 border-b last:border-b-0 gap-3"
                style={{ borderColor: border }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(34,197,94,0.12)' }}>
                    <TrendingUp size={15} style={{ color: '#22c55e' }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-sm font-semibold truncate" style={{ color: txtPrim }}>
                        {(comm.plan_type || 'plan').toUpperCase()}
                      </p>
                      {(() => {
                        const lvl = comm.level ?? 1;
                        const bg = lvl === 1 ? 'rgba(34,197,94,0.15)' : lvl === 2 ? 'rgba(0,194,255,0.15)' : 'rgba(108,99,255,0.15)';
                        const color = lvl === 1 ? '#22c55e' : lvl === 2 ? BRAND.cyan : BRAND.violet;
                        const label = lvl === 1 ? c.l1 : lvl === 2 ? c.l2 : c.l3;
                        return (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider" style={{ background: bg, color }}>
                            {label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs" style={{ color: txtSub }}>
                      {new Date(comm.earned_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}
                      {c.amountCol}: {Number(comm.subscription_amount).toLocaleString()} {comm.currency || 'FCFA'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold" style={{ color: '#22c55e' }}>
                    +{Number(comm.commission_amount).toLocaleString()} {comm.currency || 'FCFA'}
                  </p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold inline-block mt-0.5"
                    style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                    <Check size={9} className="inline mr-0.5" />{c.credited}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
