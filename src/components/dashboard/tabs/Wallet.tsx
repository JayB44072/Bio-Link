import React, { useEffect, useState } from 'react';
import { Profile, Transaction, WithdrawalRequest } from '../../../lib/types';
import { useLang } from '../../../lib/LanguageContext';
import { supabase } from '../../../lib/supabase';
import { Wallet as WalletIcon, ArrowDownCircle, Smartphone, CreditCard, Clock, CheckCircle, Zap, AlertCircle } from 'lucide-react';

interface WalletProps {
  profile: Profile;
  onBalanceUpdate: (balance: number) => void;
}

export default function Wallet({ profile, onBalanceUpdate }: WalletProps) {
  const { t } = useLang();
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

  const isPremium = profile.plan_type === 'premium';

  useEffect(() => {
    async function load() {
      const [txRes, wRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('seller_id', profile.user_id).order('created_at', { ascending: false }).limit(10),
        supabase.from('withdrawal_requests').select('*').eq('user_id', profile.user_id).order('created_at', { ascending: false }).limit(5),
      ]);
      setTransactions((txRes.data || []) as Transaction[]);
      setWithdrawals((wRes.data || []) as WithdrawalRequest[]);
      setLoading(false);
    }
    load();
  }, [profile.user_id]);

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
      // Deduct from wallet
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
    if (pm === 'mtn' || pm === 'orange') return <Smartphone size={14} className="text-gray-400" />;
    return <CreditCard size={14} className="text-gray-400" />;
  };

  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-6">{t.myWallet}</h2>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-blue-900/60 to-blue-800/40 border border-blue-700/30 rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-400 rounded-full" />
          <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-blue-300 rounded-full" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <WalletIcon size={16} className="text-blue-300" />
            <span className="text-blue-300 text-sm">{t.availableBalance}</span>
          </div>
          <p className="text-white text-4xl font-bold mb-1">
            {profile.wallet_balance.toLocaleString()} <span className="text-xl text-blue-300">FCFA</span>
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            <span className="text-gray-400 text-xs">{t.youReceive} · {t.commission}</span>
          </div>
          {isPremium && (
            <div className="flex items-center gap-1.5 mt-2 bg-amber-500/20 rounded-full px-3 py-1 w-fit">
              <Zap size={12} className="text-amber-400" />
              <span className="text-amber-300 text-xs font-medium">{t.priorityWithdrawal}</span>
            </div>
          )}
        </div>
      </div>

      {/* Success banner */}
      {success && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-4">
          <CheckCircle size={16} className="text-green-400" />
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {/* Withdraw button */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-600/20 mb-6"
        >
          <ArrowDownCircle size={18} />
          {t.requestWithdrawal}
        </button>
      ) : (
        <form onSubmit={handleWithdraw} className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-5 mb-6 space-y-4">
          <h3 className="text-white font-semibold">{t.requestWithdrawal}</h3>

          {err && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle size={14} className="text-red-400" />
              <p className="text-red-400 text-sm">{err}</p>
            </div>
          )}

          <div>
            <label className="block text-gray-300 text-sm mb-1.5">{t.withdrawAmount} (FCFA)</label>
            <input
              type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="1000"
              max={profile.wallet_balance}
              placeholder="Ex: 5000"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1.5">{t.phoneNumber}</label>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
              placeholder="+225 07 00 00 00"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">{t.paymentMethodLabel}</label>
            <div className="flex gap-3">
              {(['mtn', 'orange'] as const).map(m => (
                <button
                  key={m} type="button" onClick={() => setMethod(m)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition ${
                    method === m ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <Smartphone size={16} />
                  {m === 'mtn' ? t.mtnMoney : t.orangeMoney}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setShowForm(false); setErr(''); }} className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium py-2.5 rounded-xl transition">{t.cancel}</button>
            <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2">
              {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {submitting ? t.withdrawing : t.withdrawBtn}
            </button>
          </div>
        </form>
      )}

      {/* Withdrawal requests */}
      {withdrawals.length > 0 && (
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-700/50">
            <h3 className="text-white font-semibold text-sm">Demandes de retrait</h3>
          </div>
          <div className="divide-y divide-gray-700/30">
            {withdrawals.map(w => (
              <div key={w.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <Smartphone size={16} className="text-gray-400" />
                  <div>
                    <p className="text-white text-sm font-medium">{w.amount.toLocaleString()} FCFA</p>
                    <p className="text-gray-500 text-xs">{w.phone_number} · {w.payment_method.toUpperCase()}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  w.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                  w.status === 'processing' ? 'bg-blue-500/10 text-blue-400' :
                  w.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                  'bg-amber-500/10 text-amber-400'
                }`}>
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-700/50">
          <Clock size={16} className="text-gray-400" />
          <h3 className="text-white font-semibold text-sm">{t.recentTransactions}</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-8">{t.noTransactions}</p>
        ) : (
          <div className="divide-y divide-gray-700/30">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  {paymentMethodIcon(tx.payment_method)}
                  <div>
                    <p className="text-white text-sm font-medium">{tx.buyer_name}</p>
                    <p className="text-gray-500 text-xs">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 text-sm font-semibold">+{tx.seller_amount.toLocaleString()} FCFA</p>
                  <p className="text-gray-600 text-xs">-{tx.platform_fee.toLocaleString()} comm.</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
