import React, { useState } from 'react';
import { Profile, PlanType } from '../../../lib/types';
import { PLAN_CONFIGS } from '../../../lib/planLimits';
import { useLang } from '../../../lib/LanguageContext';
import { supabase } from '../../../lib/supabase';
import { Check, Zap, Crown, Star, Briefcase, Gift, Lock, Unlock } from 'lucide-react';

interface SubscriptionProps {
  profile: Profile;
  onPlanChange: (plan: PlanType) => void;
}

const PLAN_ICONS: Record<PlanType, React.ComponentType<{ size?: number; className?: string }>> = {
  free: Gift,
  starter: Star,
  business: Briefcase,
  premium: Crown,
};

const PLAN_COLORS: Record<PlanType, { gradient: string; border: string; badge: string; btn: string }> = {
  free: {
    gradient: 'from-gray-800 to-gray-900',
    border: 'border-gray-700',
    badge: 'bg-gray-700 text-gray-300',
    btn: 'bg-gray-700 hover:bg-gray-600 text-white',
  },
  starter: {
    gradient: 'from-blue-900/40 to-blue-950',
    border: 'border-blue-700/40',
    badge: 'bg-blue-600 text-white',
    btn: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20',
  },
  business: {
    gradient: 'from-emerald-900/40 to-emerald-950',
    border: 'border-emerald-700/40',
    badge: 'bg-emerald-600 text-white',
    btn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20',
  },
  premium: {
    gradient: 'from-amber-900/40 to-amber-950',
    border: 'border-amber-700/40',
    badge: 'bg-amber-500 text-white',
    btn: 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/20',
  },
};

export default function Subscription({ profile, onPlanChange }: SubscriptionProps) {
  const { t, lang } = useLang();
  const [loading, setLoading] = useState<PlanType | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  async function handleUpgrade(plan: PlanType) {
    if (plan === profile.plan_type) return;
    setLoading(plan);
    const { error } = await supabase
      .from('profiles')
      .update({ plan_type: plan })
      .eq('user_id', profile.user_id);
    if (!error) {
      onPlanChange(plan);
      setSuccessMsg(t.upgradeSuccess(PLAN_CONFIGS[plan].name[lang as 'fr' | 'en']));
      setTimeout(() => setSuccessMsg(''), 3000);
    }
    setLoading(null);
  }

  const plans: PlanType[] = ['free', 'starter', 'business', 'premium'];

  function getPlanFeatures(plan: PlanType): string[] {
    const features: string[] = [];
    // Products
    if (plan === 'free') features.push(t.feat_products_free);
    else if (plan === 'starter') features.push(t.feat_products_starter);
    else if (plan === 'business') features.push(t.feat_products_business);
    else features.push(t.feat_products_premium);
    // Social
    if (plan === 'free') features.push(t.feat_social_free);
    else features.push(t.feat_social_paid);
    // Themes
    if (plan === 'free') features.push(t.feat_theme_free);
    else features.push(t.feat_theme_paid);
    // Stats
    if (plan === 'free' || plan === 'starter') features.push(t.feat_stats_locked);
    else features.push(t.feat_stats_access);
    // Badge
    if (plan === 'free') features.push(t.feat_badge_free);
    else features.push(t.feat_badge_paid);
    // Withdrawal
    if (plan === 'premium') features.push(t.feat_withdrawal_priority);
    else features.push(t.feat_withdrawal_standard);
    // Commission
    features.push(t.feat_commission);
    return features;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white text-xl font-bold">{t.myPlan}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-400 text-sm">{t.currentPlan} :</span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${PLAN_COLORS[profile.plan_type].badge}`}>
              {PLAN_CONFIGS[profile.plan_type].name[lang as 'fr' | 'en']}
            </span>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-6">
          <Check size={16} className="text-green-400" />
          <p className="text-green-400 text-sm">{successMsg}</p>
        </div>
      )}

      {/* Pricing grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {plans.map(plan => {
          const config = PLAN_CONFIGS[plan];
          const colors = PLAN_COLORS[plan];
          const Icon = PLAN_ICONS[plan];
          const isCurrent = profile.plan_type === plan;
          const isPopular = plan === 'business';
          const features = getPlanFeatures(plan);

          return (
            <div
              key={plan}
              className={`relative bg-gradient-to-b ${colors.gradient} border ${isCurrent ? 'border-blue-500' : colors.border} rounded-2xl overflow-hidden flex flex-col transition-all hover:scale-[1.01]`}
            >
              {isPopular && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400" />
              )}
              {isCurrent && (
                <div className="absolute top-3 right-3">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </div>
                </div>
              )}

              <div className="p-5 flex-1">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.badge}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{config.name[lang as 'fr' | 'en']}</h3>
                    {isPopular && (
                      <span className="text-xs text-emerald-400 font-medium">{t.mostPopular}</span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="mb-5">
                  {config.price_fcfa === 0 ? (
                    <p className="text-3xl font-bold text-white">{t.free}</p>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-white">
                        {config.price_fcfa.toLocaleString()}
                        <span className="text-sm font-normal text-gray-400 ml-1">FCFA{t.perMonth}</span>
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">≈ ${config.price_usd}{t.perMonth}</p>
                    </>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {features.map((feat, i) => {
                    const isLocked = feat.includes('bloqué') || feat.includes('locked') || feat.includes('uniquement') || feat.includes('only') || feat.includes('badge');
                    return (
                      <li key={i} className={`flex items-start gap-2 text-xs ${isLocked ? 'text-gray-500' : 'text-gray-300'}`}>
                        {isLocked
                          ? <Lock size={12} className="text-gray-600 mt-0.5 shrink-0" />
                          : <Check size={12} className="text-green-400 mt-0.5 shrink-0" />
                        }
                        {feat}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* CTA */}
              <div className="p-4 pt-0">
                {isCurrent ? (
                  <div className="w-full py-2.5 rounded-xl border border-blue-500/30 text-blue-400 text-sm font-medium text-center">
                    ✓ {t.currentPlan}
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={loading === plan}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 ${colors.btn}`}
                  >
                    {loading === plan ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      plan === 'free' ? <Unlock size={14} /> : <Zap size={14} />
                    )}
                    {plan === 'free' ? t.downgrade : t.simulateUpgrade}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Note */}
      <p className="text-gray-600 text-xs text-center mt-6">
        {lang === 'fr'
          ? '* Simulation de paiement uniquement — intégrez une passerelle réelle pour la production.'
          : '* Payment simulation only — integrate a real payment gateway for production.'}
      </p>
    </div>
  );
}
