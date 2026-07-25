import React, { useState } from 'react';
import { Profile, PlanType } from '../../../lib/types';
import { PLAN_CONFIGS } from '../../../lib/planLimits';
import { useLang } from '../../../lib/LanguageContext';
import { useAppPrefs } from '../../../lib/AppPrefsContext';
import { supabase } from '../../../lib/supabase';
import {
  Check, Zap, Crown, Star, Briefcase, Gift, Lock, Unlock,
  Smartphone, ShieldCheck, X, ArrowLeft, Loader2, CreditCard,
} from 'lucide-react';

interface SubscriptionProps {
  profile: Profile;
  onPlanChange: (plan: PlanType) => void;
}

const PLAN_ICONS: Record<PlanType, React.ComponentType<{ size?: number; className?: string }>> = {
  free: Gift, starter: Star, business: Briefcase, premium: Crown,
};

const PLAN_ACCENTS: Record<PlanType, string> = {
  free: '#9ca3af', starter: '#6C63FF', business: '#00C2FF', premium: '#FF6B9D',
};

type Operator = 'mtn' | 'orange' | 'card';
type ModalStep = 'operator' | 'phone' | 'card' | 'ussd' | 'verifying' | 'success';

const OPERATORS: { id: Operator; label: string; color: string; ussd: string; logo: string | null }[] = [
  { id: 'mtn',    label: 'MTN Money',       color: '#FFCC00', ussd: '*126#',    logo: '/mtn.png'    },
  { id: 'orange', label: 'Orange Money',    color: '#FF7900', ussd: '#150*50#', logo: '/orange.png' },
  { id: 'card',   label: 'Carte bancaire',  color: '#1a73e8', ussd: '',         logo: null           },
];

const COPY = {
  fr: {
    payTitle: 'Payer le forfait', choosePayMethod: 'Choisissez votre moyen de paiement',
    phoneStep: 'Entrez votre numéro', phonePlaceholder: 'Ex : 07 00 00 00 00',
    validate: 'Valider', back: 'Retour', cancel: 'Annuler',
    confirmSent: 'Une demande de paiement a été envoyée.',
    dialInstruction: (ussd: string, op: string) =>
      `Composez ${ussd} sur votre téléphone pour confirmer le paiement avec ${op}.`,
    imDone: "J'ai confirmé, continuer",
    verifying: 'Vérification du paiement en cours…',
    verifyingSub: 'Merci de patienter, cela prend quelques secondes.',
    success: 'Paiement confirmé !',
    successSub: (plan: string) => `Votre forfait ${plan} est maintenant actif.`,
    close: 'Fermer',
    amountToPay: 'Montant à payer',
  },
  en: {
    payTitle: 'Pay for plan', choosePayMethod: 'Choose your payment method',
    phoneStep: 'Enter your number', phonePlaceholder: 'Ex: 07 00 00 00 00',
    validate: 'Confirm', back: 'Back', cancel: 'Cancel',
    confirmSent: 'A payment request has been sent.',
    dialInstruction: (ussd: string, op: string) =>
      `Dial ${ussd} on your phone to confirm the payment with ${op}.`,
    imDone: "I've confirmed, continue",
    verifying: 'Verifying payment…',
    verifyingSub: 'Please wait, this takes a few seconds.',
    success: 'Payment confirmed!',
    successSub: (plan: string) => `Your ${plan} plan is now active.`,
    close: 'Close',
    amountToPay: 'Amount to pay',
  },
};

export default function Subscription({ profile, onPlanChange }: SubscriptionProps) {
  const { t, lang } = useLang();
  const { isDark: dk } = useAppPrefs();
  const c = COPY[lang === 'en' ? 'en' : 'fr'];

  const [successMsg, setSuccessMsg] = useState('');

  /* ── Payment modal state ── */
  const [payModalPlan, setPayModalPlan] = useState<PlanType | null>(null);
  const [step, setStep] = useState<ModalStep>('operator');
  const [operator, setOperator] = useState<Operator | null>(null);
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  /* ── Theme tokens ── */
  const surface    = dk ? '#12122b' : '#ffffff';
  const surfaceAlt = dk ? '#191938' : '#faf9ff';
  const border     = dk ? 'rgba(139,124,255,0.16)' : '#eeebfb';
  const txtPrim    = dk ? '#f2f1ff' : '#16162e';
  const txtSub     = dk ? '#8c8ab0' : '#8a87a3';
  const inputBg    = dk ? '#0d0d22' : '#faf9ff';
  const inputBorder= dk ? 'rgba(139,124,255,0.18)' : '#e6e1fb';

  function openPayModal(plan: PlanType) {
    if (plan === profile.plan_type) return;
    if (plan === 'free') { handleDowngrade(); return; }
    setPayModalPlan(plan);
    setStep('operator');
    setOperator(null);
    setPhone('');
  }

  function closePayModal() {
    setPayModalPlan(null);
  }

  async function handleDowngrade() {
    const { error } = await supabase.from('profiles').update({ plan_type: 'free' }).eq('user_id', profile.user_id);
    if (!error) {
      onPlanChange('free');
      setSuccessMsg(t.upgradeSuccess(PLAN_CONFIGS.free.name[lang as 'fr' | 'en']));
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  }

  function chooseOperator(op: Operator) {
    setOperator(op);
    setStep(op === 'card' ? 'card' : 'phone');
  }

  function submitPhone(e: React.FormEvent) {
    e.preventDefault();
    setStep('ussd');
  }

  function submitCard(e: React.FormEvent) {
    e.preventDefault();
    setStep('verifying');
    // Simulation du paiement carte
    setTimeout(() => { confirmUssd(); }, 1800);
  }

  async function confirmUssd() {
    setStep('verifying');
    // Simulation des vérifications finales avant activation
    await new Promise(res => setTimeout(res, 2200));
    if (payModalPlan) {
      await supabase.from('profiles').update({ plan_type: payModalPlan }).eq('user_id', profile.user_id);
      onPlanChange(payModalPlan);

      // Multi-level affiliate commissions:
      // Level 1 (direct referrer)          = 5%
      // Level 2 (referrer of referrer)     = 2%
      // Level 3 (grandparent of referrer)  = 1%
      // Each level capped at 12 payments per (referrer, referred) pair.
      try {
        const subscriptionAmount = PLAN_CONFIGS[payModalPlan].price_fcfa;
        if (subscriptionAmount > 0) {
          const RATES = [0.05, 0.02, 0.01];
          let currentReferredId = profile.id;
          let currentReferrerId = profile.referred_by ?? null;

          for (let level = 1; level <= 3 && currentReferrerId; level++) {
            const rate = RATES[level - 1];
            const commissionAmount = Math.round(subscriptionAmount * rate * 100) / 100;

            const { count } = await supabase
              .from('affiliate_commissions')
              .select('*', { count: 'exact', head: true })
              .eq('referrer_id', currentReferrerId)
              .eq('referred_id', currentReferredId);

            if ((count ?? 0) < 12) {
              const { error: insertErr } = await supabase.from('affiliate_commissions').insert({
                referrer_id: currentReferrerId,
                referred_id: currentReferredId,
                subscription_amount: subscriptionAmount,
                commission_amount: commissionAmount,
                commission_rate: rate,
                currency: 'FCFA',
                plan_type: payModalPlan,
                level,
                paid_out: true,  // Credited to withdrawable balance immediately
                paid_out_at: new Date().toISOString(),
              });

              if (!insertErr) {
                const { data: referrer } = await supabase
                  .from('profiles')
                  .select('affiliate_balance, lifetime_affiliate_earned, referred_by')
                  .eq('id', currentReferrerId)
                  .maybeSingle();

                if (referrer) {
                  const newBalance = Number(referrer.affiliate_balance ?? 0) + commissionAmount;
                  const newLifetime = Number(referrer.lifetime_affiliate_earned ?? 0) + commissionAmount;
                  await supabase
                    .from('profiles')
                    .update({
                      affiliate_balance: newBalance,
                      lifetime_affiliate_earned: newLifetime,
                    })
                    .eq('id', currentReferrerId);

                  // Walk up the chain for the next level
                  currentReferredId = currentReferrerId;
                  currentReferrerId = referrer.referred_by ?? null;
                  continue;
                }
              }
            }
            break;
          }
        }
      } catch { /* Do not block success if commission fails */ }
    }
    setStep('success');
  }

  const plans: PlanType[] = ['free', 'starter', 'business', 'premium'];

  function getPlanFeatures(plan: PlanType): string[] {
    const features: string[] = [];
    if (plan === 'free') features.push(t.feat_products_free);
    else if (plan === 'starter') features.push(t.feat_products_starter);
    else if (plan === 'business') features.push(t.feat_products_business);
    else features.push(t.feat_products_premium);
    if (plan === 'free') features.push(t.feat_social_free);
    else features.push(t.feat_social_paid);
    if (plan === 'free') features.push(t.feat_theme_free);
    else features.push(t.feat_theme_paid);
    if (plan === 'free' || plan === 'starter') features.push(t.feat_stats_locked);
    else features.push(t.feat_stats_access);
    if (plan === 'free') features.push(t.feat_badge_free);
    else features.push(t.feat_badge_paid);
    if (plan === 'free') features.push(t.feat_logo_free);
    else features.push(t.feat_logo_paid);
    if (plan === 'premium') features.push(t.feat_withdrawal_priority);
    else features.push(t.feat_withdrawal_standard);
    features.push(t.feat_commission(PLAN_CONFIGS[plan].commission_rate * 100));
    return features;
  }

  const selectedOp = OPERATORS.find(o => o.id === operator);
  const planLabel = payModalPlan ? PLAN_CONFIGS[payModalPlan].name[lang as 'fr' | 'en'] : '';
  const planPrice = payModalPlan ? PLAN_CONFIGS[payModalPlan].price_fcfa : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-black text-xl" style={{ color: txtPrim }}>{t.myPlan}</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-sm" style={{ color: txtSub }}>{t.currentPlan} :</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
              style={{ background: PLAN_ACCENTS[profile.plan_type] }}>
              {PLAN_CONFIGS[profile.plan_type].name[lang as 'fr' | 'en']}
            </span>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-6"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <Check size={16} className="text-green-500" />
          <p className="text-green-500 text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* Pricing grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {plans.map(plan => {
          const config = PLAN_CONFIGS[plan];
          const accent = PLAN_ACCENTS[plan];
          const Icon = PLAN_ICONS[plan];
          const isCurrent = profile.plan_type === plan;
          const isPopular = plan === 'business';
          const features = getPlanFeatures(plan);

          return (
            <div key={plan}
              className="relative rounded-3xl overflow-hidden flex flex-col transition-all hover:-translate-y-1"
              style={{
                background: surface,
                border: `2px solid ${isCurrent ? accent : border}`,
                boxShadow: isCurrent ? `0 8px 24px ${accent}33` : (dk ? 'none' : '0 2px 16px rgba(108,99,255,0.06)'),
              }}
            >
              {isPopular && (
                <div className="absolute top-0 left-0 right-0 h-1"
                  style={{ background: 'linear-gradient(90deg,#6C63FF,#00C2FF,#FF6B9D)' }} />
              )}
              {isCurrent && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: accent }}>
                  <Check size={10} className="text-white" />
                </div>
              )}

              <div className="p-5 flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: `${accent}22` }}>
                    <Icon size={18} color={accent} />
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: txtPrim }}>{config.name[lang as 'fr' | 'en']}</h3>
                    {isPopular && <span className="text-xs font-bold" style={{ color: '#00C2FF' }}>{t.mostPopular}</span>}
                  </div>
                </div>

                <div className="mb-5">
                  {config.price_fcfa === 0 ? (
                    <p className="text-3xl font-black" style={{ color: txtPrim }}>{t.free}</p>
                  ) : (
                    <>
                      <p className="text-3xl font-black" style={{ color: txtPrim }}>
                        {config.price_fcfa.toLocaleString()}
                        <span className="text-sm font-medium ml-1" style={{ color: txtSub }}>FCFA{t.perMonth}</span>
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: txtSub }}>≈ ${config.price_usd}{t.perMonth}</p>
                    </>
                  )}
                </div>

                <ul className="space-y-2.5">
                  {features.map((feat, i) => {
                    const isLocked = feat.includes('bloqué') || feat.includes('locked') || feat.includes('uniquement') || feat.includes('only') || feat.includes('badge');
                    return (
                      <li key={i} className="flex items-start gap-2 text-xs font-medium"
                        style={{ color: isLocked ? txtSub : txtPrim }}>
                        {isLocked
                          ? <Lock size={12} className="mt-0.5 shrink-0" style={{ color: txtSub }} />
                          : <Check size={12} className="mt-0.5 shrink-0" style={{ color: accent }} />}
                        {feat}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="p-4 pt-0">
                {isCurrent ? (
                  <div className="w-full py-2.5 rounded-2xl text-sm font-bold text-center flex items-center justify-center gap-1.5"
                    style={{ background: `${accent}18`, color: accent }}>
                    <Check size={14} />{t.currentPlan}
                  </div>
                ) : (
                  <button
                    onClick={() => openPayModal(plan)}
                    className="w-full py-3 rounded-2xl text-sm font-bold transition flex items-center justify-center gap-2 text-white"
                    style={{ background: plan === 'free' ? '#9ca3af' : `linear-gradient(135deg,${accent},#8B5FBF)` }}
                  >
                    {plan === 'free' ? <Unlock size={14} /> : <Zap size={14} />}
                    {plan === 'free' ? t.downgrade : c.payTitle}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ══ Payment modal ══ */}
      {payModalPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl" style={{ background: surface }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: border }}>
              <div className="flex items-center gap-2">
                {step === 'phone' && (
                  <button onClick={() => setStep('operator')} style={{ color: txtSub }}>
                    <ArrowLeft size={16} />
                  </button>
                )}
                <h3 className="font-bold text-sm" style={{ color: txtPrim }}>
                  {planLabel} — {planPrice.toLocaleString()} FCFA
                </h3>
              </div>
              {step !== 'verifying' && (
                <button onClick={closePayModal} style={{ color: txtSub }}><X size={18} /></button>
              )}
            </div>

            <div className="p-6">

              {/* Step 1 — choose operator */}
              {step === 'operator' && (
                <>
                  <p className="text-sm font-semibold mb-4" style={{ color: txtPrim }}>{c.choosePayMethod}</p>
                  <div className="space-y-3">
                    {OPERATORS.map(op => (
                      <button key={op.id} onClick={() => chooseOperator(op.id)}
                        className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all hover:-translate-y-0.5"
                        style={{ borderColor: inputBorder, background: surfaceAlt }}>
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                          style={{ background: op.id === 'card' ? op.color : '#fff' }}>
                          {op.logo ? (
                            <img src={op.logo} alt={op.label} className="w-9 h-9 object-contain" />
                          ) : (
                            <CreditCard size={18} color="#fff" />
                          )}
                        </div>
                        <span className="font-bold text-sm" style={{ color: txtPrim }}>{op.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Step 2 — phone number */}
              {step === 'phone' && selectedOp && (
                <form onSubmit={submitPhone}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: '#fff' }}>
                      {selectedOp.logo ? (
                        <img src={selectedOp.logo} alt={selectedOp.label} className="w-6 h-6 object-contain" />
                      ) : (
                        <Smartphone size={14} color={selectedOp.id === 'mtn' ? '#1a1a2e' : '#fff'} />
                      )}
                    </div>
                    <span className="font-bold text-sm" style={{ color: txtPrim }}>{selectedOp.label}</span>
                  </div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: txtPrim }}>{c.phoneStep}</label>
                  <input
                    type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder={c.phonePlaceholder} autoFocus
                    className="w-full rounded-xl px-4 py-3 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-brand-violet/25"
                    style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}
                  />
                  <div className="rounded-xl px-3 py-2 mb-5" style={{ background: surfaceAlt }}>
                    <p className="text-xs font-medium" style={{ color: txtSub }}>
                      {c.amountToPay}: <span className="font-bold" style={{ color: txtPrim }}>{planPrice.toLocaleString()} FCFA</span>
                    </p>
                  </div>
                  <button type="submit"
                    className="w-full text-white font-bold py-3 rounded-2xl transition"
                    style={{ background: 'linear-gradient(135deg,#6C63FF,#00C2FF)' }}>
                    {c.validate}
                  </button>
                </form>
              )}

              {/* Step 2b — card form */}
              {step === 'card' && selectedOp && (
                <form onSubmit={submitCard}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1a73e8' }}>
                      <CreditCard size={14} color="#fff" />
                    </div>
                    <span className="font-bold text-sm" style={{ color: txtPrim }}>{lang === 'fr' ? 'Carte bancaire' : 'Bank card'}</span>
                  </div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: txtPrim }}>{lang === 'fr' ? 'Nom sur la carte' : 'Name on card'}</label>
                  <input type="text" required value={cardName} onChange={e => setCardName(e.target.value)}
                    placeholder="JOHN DOE" autoFocus
                    className="w-full rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-violet/25"
                    style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}
                  />
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: txtPrim }}>{lang === 'fr' ? 'Numéro de carte' : 'Card number'}</label>
                  <input type="text" required inputMode="numeric" maxLength={19}
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                    placeholder="4242 4242 4242 4242"
                    className="w-full rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-violet/25 font-mono"
                    style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}
                  />
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: txtPrim }}>MM/AA</label>
                      <input type="text" required inputMode="numeric" maxLength={5}
                        value={cardExpiry}
                        onChange={e => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setCardExpiry(digits.length > 2 ? `${digits.slice(0,2)}/${digits.slice(2)}` : digits);
                        }}
                        placeholder="12/26"
                        className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet/25 font-mono"
                        style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: txtPrim }}>CVV</label>
                      <input type="password" required inputMode="numeric" maxLength={4}
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        placeholder="•••"
                        className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet/25 font-mono"
                        style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}
                      />
                    </div>
                  </div>
                  <div className="rounded-xl px-3 py-2 mb-4 flex items-center gap-2" style={{ background: surfaceAlt }}>
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <p className="text-xs font-medium" style={{ color: txtSub }}>
                      {c.amountToPay}: <span className="font-bold" style={{ color: txtPrim }}>{planPrice.toLocaleString()} FCFA</span>
                    </p>
                  </div>
                  <button type="submit"
                    className="w-full text-white font-bold py-3 rounded-2xl transition"
                    style={{ background: 'linear-gradient(135deg,#1a73e8,#00C2FF)' }}>
                    {lang === 'fr' ? `Payer ${planPrice.toLocaleString()} FCFA` : `Pay ${planPrice.toLocaleString()} FCFA`}
                  </button>
                </form>
              )}

              {/* Step 3 — USSD instructions */}
              {step === 'ussd' && selectedOp && (
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: `${selectedOp.color}33` }}>
                    <Smartphone size={22} color={selectedOp.color} />
                  </div>
                  <p className="font-bold text-sm mb-2" style={{ color: txtPrim }}>{c.confirmSent}</p>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: txtSub }}>
                    {c.dialInstruction(selectedOp.ussd, selectedOp.label)}
                  </p>
                  <div className="rounded-2xl py-4 mb-5 font-mono text-2xl font-black tracking-widest"
                    style={{ background: surfaceAlt, color: selectedOp.color }}>
                    {selectedOp.ussd}
                  </div>
                  <button onClick={confirmUssd}
                    className="w-full text-white font-bold py-3 rounded-2xl transition"
                    style={{ background: 'linear-gradient(135deg,#6C63FF,#00C2FF)' }}>
                    {c.imDone}
                  </button>
                </div>
              )}

              {/* Step 4 — verifying */}
              {step === 'verifying' && (
                <div className="text-center py-4">
                  <Loader2 size={36} className="animate-spin mx-auto mb-4" style={{ color: '#6C63FF' }} />
                  <p className="font-bold text-sm mb-1" style={{ color: txtPrim }}>{c.verifying}</p>
                  <p className="text-xs" style={{ color: txtSub }}>{c.verifyingSub}</p>
                </div>
              )}

              {/* Step 5 — success */}
              {step === 'success' && (
                <div className="text-center py-2">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'rgba(34,197,94,0.15)' }}>
                    <ShieldCheck size={28} className="text-green-500" />
                  </div>
                  <p className="font-black text-base mb-1" style={{ color: txtPrim }}>{c.success}</p>
                  <p className="text-sm mb-6" style={{ color: txtSub }}>{c.successSub(planLabel)}</p>
                  <button onClick={closePayModal}
                    className="w-full font-bold py-3 rounded-2xl transition"
                    style={{ background: surfaceAlt, color: txtPrim }}>
                    {c.close}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
