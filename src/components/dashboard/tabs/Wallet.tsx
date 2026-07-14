import React, { useEffect, useState } from 'react';
import { Profile, Transaction, WithdrawalRequest } from '../../../lib/types';
import { useLang } from '../../../lib/LanguageContext';
import { useAppPrefs } from '../../../lib/AppPrefsContext';
import { supabase } from '../../../lib/supabase';
import {
  Wallet as WalletIcon, ArrowDownCircle, Smartphone, CreditCard, Clock, CheckCircle, Zap, AlertCircle,
  Sparkles, Truck, Package, Check, Settings,
} from 'lucide-react';

interface WalletProps {
  profile: Profile;
  onBalanceUpdate: (balance: number) => void;
}

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  completed:  { bg: 'rgba(34,197,94,0.12)',  text: '#22c55e' },
  processing: { bg: 'rgba(108,99,255,0.12)', text: '#6C63FF' },
  rejected:   { bg: 'rgba(239,68,68,0.12)',  text: '#ef4444' },
  pending:    { bg: 'rgba(251,191,36,0.12)', text: '#f59e0b' },
  shipped:    { bg: 'rgba(108,99,255,0.12)', text: '#6C63FF' },
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: 'En attente d\'envoi',
  shipped: 'Expédiée',
  completed: 'Livrée · payée',
};

export default function Wallet({ profile, onBalanceUpdate }: WalletProps) {
  const { t } = useLang();
  const { isDark: dk } = useAppPrefs();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<'mtn' | 'orange'>('mtn');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [err, setErr] = useState('');
  const [shippingId, setShippingId] = useState<string | null>(null);

  // Numéros de retrait enregistrés
  const [showNumbers, setShowNumbers] = useState(false);
  const [mtnNumber, setMtnNumber] = useState(profile.mtn_number || '');
  const [orangeNumber, setOrangeNumber] = useState(profile.orange_number || '');
  const [savingNumbers, setSavingNumbers] = useState(false);
  const [numbersSaved, setNumbersSaved] = useState(false);

  const isPremium = profile.plan_type === 'premium';

  /* ── Theme tokens ── */
  const surface     = dk ? '#12122b' : '#ffffff';
  const surfaceAlt  = dk ? '#191938' : '#faf9ff';
  const border      = dk ? 'rgba(139,124,255,0.16)' : '#eeebfb';
  const txtPrim     = dk ? '#f2f1ff' : '#16162e';
  const txtLabel    = dk ? '#c7c5e8' : '#2d2b45';
  const txtSub      = dk ? '#8c8ab0' : '#8a87a3';
  const inputBg     = dk ? '#0d0d22' : '#faf9ff';
  const inputBorder = dk ? 'rgba(139,124,255,0.18)' : '#e6e1fb';
  const inputCls    = 'w-full rounded-xl px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-violet/25';
  const labelCls    = 'block text-sm font-semibold mb-1.5';
  const cardShadow  = dk ? 'none' : '0 2px 16px rgba(108,99,255,0.06)';

  useEffect(() => {
    async function load() {
      const [txRes, wRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('seller_id', profile.user_id).order('created_at', { ascending: false }).limit(15),
        supabase.from('withdrawal_requests').select('*').eq('user_id', profile.user_id).order('created_at', { ascending: false }).limit(5),
      ]);
      setTransactions((txRes.data || []) as Transaction[]);
      setWithdrawals((wRes.data || []) as WithdrawalRequest[]);
      setLoading(false);
    }
    load();
  }, [profile.user_id]);

  function autofillPhone(m: 'mtn' | 'orange') {
    setMethod(m);
    const registered = m === 'mtn' ? profile.mtn_number : profile.orange_number;
    if (registered) setPhone(registered);
  }

  async function handleSaveNumbers(e: React.FormEvent) {
    e.preventDefault();
    setSavingNumbers(true);
    await supabase.from('profiles').update({ mtn_number: mtnNumber, orange_number: orangeNumber }).eq('user_id', profile.user_id);
    setSavingNumbers(false);
    setNumbersSaved(true);
    setTimeout(() => setNumbersSaved(false), 2000);
  }

  async function markShipped(txId: string) {
    setShippingId(txId);
    await supabase.from('transactions').update({ status: 'shipped', shipped_at: new Date().toISOString() }).eq('id', txId);
    setTransactions(prev => prev.map(tx => tx.id === txId ? { ...tx, status: 'shipped', shipped_at: new Date().toISOString() } : tx));
    setShippingId(null);
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 1000) { setErr(t.minWithdraw); return; }
    if (amt > profile.wallet_balance) { setErr(t.insufficientBalance); return; }
    setSubmitting(true);

    const { error } = await supabase.from('withdrawal_requests').insert({
      user_id: profile.user_id,
      amount: amt,
      payment_method: method,
      phone_number: phone,
      is_priority: isPremium,
    });

    if (!error) {
      const newBalance = profile.wallet_balance - amt;
      await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('user_id', profile.user_id);
      onBalanceUpdate(newBalance);
      setSuccess(t.withdrawSuccess);
      setShowForm(false);
      setAmount('');
      setPhone('');
    }
    setSubmitting(false);
  }

  const paymentMethodIcon = (pm: string) => {
    if (pm === 'mtn' || pm === 'orange') return <Smartphone size={14} style={{ color: txtSub }} />;
    return <CreditCard size={14} style={{ color: txtSub }} />;
  };

  return (
    <div>
      <h2 className="font-black text-xl mb-6" style={{ color: txtPrim }}>{t.myWallet}</h2>

      {/* Balance card — gradient signature */}
      <div className="rounded-3xl p-6 mb-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#6C63FF 0%,#8B5FBF 55%,#FF6B9D 120%)' }}>
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="absolute -bottom-14 -left-8 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} color="rgba(255,255,255,0.85)" />
            <span className="text-sm font-semibold text-white/85">{t.availableBalance}</span>
          </div>
          <p className="text-4xl font-black text-white mb-1">
            {profile.wallet_balance.toLocaleString()} <span className="text-xl font-bold text-white/70">FCFA</span>
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            <div className="w-1.5 h-1.5 bg-white/70 rounded-full" />
            <span className="text-white/70 text-xs font-medium">{t.youReceive} · {t.commission}</span>
          </div>
          {isPremium && (
            <div className="flex items-center gap-1.5 mt-3 rounded-full px-3 py-1 w-fit" style={{ background: 'rgba(0,0,0,0.18)' }}>
              <Zap size={12} color="#FFD166" />
              <span className="text-xs font-bold text-white">{t.priorityWithdrawal}</span>
            </div>
          )}
        </div>
      </div>

      {/* Info séquestre */}
      <div className="flex items-start gap-2.5 rounded-2xl p-4 mb-6"
        style={{ background: dk ? 'rgba(108,99,255,0.1)' : '#f5f3ff', border: '1px solid rgba(108,99,255,0.2)' }}>
        <Package size={16} style={{ color: '#6C63FF' }} className="mt-0.5 shrink-0" />
        <p className="text-xs leading-relaxed" style={{ color: txtSub }}>
          Le montant d'une vente n'est crédité sur votre solde qu'après que l'acheteur ait confirmé avoir reçu son colis
          — comme sur Amazon. Marquez vos commandes comme <strong>expédiées</strong> dès que vous les envoyez.
        </p>
      </div>

      {/* Success banner */}
      {success && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <CheckCircle size={16} className="text-green-500" />
          <p className="text-green-500 text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Withdraw button */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-2xl transition shadow-lg mb-3"
          style={{ background: 'linear-gradient(135deg,#6C63FF,#00C2FF)', boxShadow: '0 8px 24px rgba(108,99,255,0.3)' }}
        >
          <ArrowDownCircle size={18} />
          {t.requestWithdrawal}
        </button>
      ) : (
        <form onSubmit={handleWithdraw} className="rounded-3xl p-5 mb-3 space-y-4"
          style={{ background: surface, border: `1px solid ${border}`, boxShadow: cardShadow }}>
          <h3 className="font-bold" style={{ color: txtPrim }}>{t.requestWithdrawal}</h3>

          {err && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertCircle size={14} className="text-red-500" />
              <p className="text-red-500 text-sm font-medium">{err}</p>
            </div>
          )}

          <div>
            <label className={labelCls} style={{ color: txtLabel }}>{t.withdrawAmount} (FCFA)</label>
            <input
              type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="1000"
              max={profile.wallet_balance}
              placeholder="Ex: 5000"
              className={inputCls} style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}
            />
          </div>
          <div>
            <label className={labelCls} style={{ color: txtLabel }}>{t.phoneNumber}</label>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
              placeholder="+225 07 00 00 00"
              className={inputCls} style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}
            />
          </div>
          <div>
            <label className={labelCls} style={{ color: txtLabel }}>{t.paymentMethodLabel}</label>
            <div className="flex gap-3">
              {(['mtn', 'orange'] as const).map(m => (
                <button
                  key={m} type="button" onClick={() => autofillPhone(m)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition"
                  style={method === m
                    ? { background: dk ? 'rgba(108,99,255,0.15)' : '#f5f3ff', border: '1px solid #6C63FF', color: '#6C63FF' }
                    : { background: surfaceAlt, border: `1px solid ${inputBorder}`, color: txtSub }}
                >
                  <Smartphone size={16} />
                  {m === 'mtn' ? t.mtnMoney : t.orangeMoney}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setShowForm(false); setErr(''); }}
              className="flex-1 text-sm font-semibold py-2.5 rounded-xl transition"
              style={{ background: surfaceAlt, color: txtSub }}>{t.cancel}</button>
            <button type="submit" disabled={submitting}
              className="flex-1 text-white text-sm font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#6C63FF,#00C2FF)' }}>
              {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {submitting ? t.withdrawing : t.withdrawBtn}
            </button>
          </div>
        </form>
      )}

      {/* Numéros de retrait enregistrés */}
      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: surface, border: `1px solid ${border}`, boxShadow: cardShadow }}>
        <button onClick={() => setShowNumbers(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4">
          <span className="flex items-center gap-2 font-bold text-sm" style={{ color: txtPrim }}>
            <Settings size={15} style={{ color: txtSub }} />
            Mes numéros de retrait (MTN / Orange)
          </span>
          <span className="text-xs" style={{ color: txtSub }}>{showNumbers ? '−' : '+'}</span>
        </button>
        {showNumbers && (
          <form onSubmit={handleSaveNumbers} className="px-5 pb-5 space-y-3 border-t" style={{ borderColor: border }}>
            <div className="pt-4">
              <label className={labelCls} style={{ color: txtLabel }}>Numéro MTN Money</label>
              <input type="tel" value={mtnNumber} onChange={e => setMtnNumber(e.target.value)}
                placeholder="+225 05 00 00 00"
                className={inputCls} style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }} />
            </div>
            <div>
              <label className={labelCls} style={{ color: txtLabel }}>Numéro Orange Money</label>
              <input type="tel" value={orangeNumber} onChange={e => setOrangeNumber(e.target.value)}
                placeholder="+225 07 00 00 00"
                className={inputCls} style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }} />
            </div>
            <button type="submit" disabled={savingNumbers}
              className="w-full text-white text-sm font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: numbersSaved ? '#22c55e' : 'linear-gradient(135deg,#6C63FF,#00C2FF)' }}>
              {numbersSaved ? <Check size={14} /> : null}
              {numbersSaved ? 'Enregistré !' : (savingNumbers ? '...' : 'Enregistrer')}
            </button>
          </form>
        )}
      </div>

      {/* Withdrawal requests */}
      {withdrawals.length > 0 && (
        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: surface, border: `1px solid ${border}`, boxShadow: cardShadow }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: border }}>
            <h3 className="font-bold text-sm" style={{ color: txtPrim }}>Demandes de retrait</h3>
          </div>
          <div>
            {withdrawals.map(w => {
              const st = STATUS_STYLE[w.status] ?? STATUS_STYLE.pending;
              return (
                <div key={w.id} className="flex items-center justify-between px-5 py-3 border-b last:border-b-0" style={{ borderColor: border }}>
                  <div className="flex items-center gap-3">
                    <Smartphone size={16} style={{ color: txtSub }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: txtPrim }}>{w.amount.toLocaleString()} FCFA</p>
                      <p className="text-xs" style={{ color: txtSub }}>{w.phone_number} · {w.payment_method.toUpperCase()}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: st.bg, color: st.text }}>
                    {w.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transactions / Commandes */}
      <div className="rounded-2xl overflow-hidden" style={{ background: surface, border: `1px solid ${border}`, boxShadow: cardShadow }}>
        <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: border }}>
          <Clock size={16} style={{ color: txtSub }} />
          <h3 className="font-bold text-sm" style={{ color: txtPrim }}>{t.recentTransactions}</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 rounded-full animate-spin" style={{ border: '2px solid rgba(108,99,255,0.15)', borderTopColor: '#6C63FF' }} />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-center text-sm py-8" style={{ color: txtSub }}>{t.noTransactions}</p>
        ) : (
          <div>
            {transactions.map(tx => {
              const st = STATUS_STYLE[tx.status] ?? STATUS_STYLE.pending;
              const isPaidOut = tx.status === 'completed';
              return (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3 border-b last:border-b-0 gap-3" style={{ borderColor: border }}>
                  <div className="flex items-center gap-3 min-w-0">
                    {paymentMethodIcon(tx.payment_method)}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: txtPrim }}>{tx.buyer_name}</p>
                      <p className="text-xs" style={{ color: txtSub }}>{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {tx.status === 'pending' && (
                      <button onClick={() => markShipped(tx.id)} disabled={shippingId === tx.id}
                        className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full transition disabled:opacity-50"
                        style={{ background: dk ? 'rgba(108,99,255,0.15)' : '#f5f3ff', color: '#6C63FF' }}>
                        <Truck size={11} />
                        {shippingId === tx.id ? '...' : 'Expédier'}
                      </button>
                    )}
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: isPaidOut ? '#22c55e' : txtSub }}>
                        {isPaidOut ? '+' : ''}{tx.seller_amount.toLocaleString()} FCFA
                      </p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: st.bg, color: st.text }}>
                        {ORDER_STATUS_LABEL[tx.status] ?? tx.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
