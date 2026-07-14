import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Star, Send, MessageSquare, Sparkles } from 'lucide-react';
import type { LandingT } from '../../lib/landingTranslations';

interface Review {
  id: string;
  name: string;
  message: string;
  rating: number;
  created_at: string;
}

interface Props {
  t: LandingT;
  dk: boolean;
}

function StarRating({ value, onChange, size = 24, readonly = false }: {
  value: number; onChange?: (v: number) => void; size?: number; readonly?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={readonly ? 'cursor-default' : 'cursor-pointer transition-transform hover:scale-110'}
        >
          <Star
            size={size}
            fill={(hovered || value) >= n ? '#f59e0b' : 'none'}
            stroke={(hovered || value) >= n ? '#f59e0b' : '#d1d5db'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewsSection({ t, dk }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle'|'ok'|'err'>('idle');

  const load = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(12);
    setReviews(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim() || rating === 0) return;
    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({ name: name.trim(), message: message.trim(), rating });
    if (error) {
      setStatus('err');
    } else {
      setStatus('ok');
      setName(''); setMessage(''); setRating(5);
      setFormOpen(false);
      await load();
    }
    setSubmitting(false);
  };

  const card = dk ? 'bg-[#111128] border-[#1e1e3f]' : 'bg-white border-gray-100';
  const txt  = dk ? 'text-[#f0f0ff]' : 'text-[#1a1a2e]';
  const sub  = dk ? 'text-gray-400' : 'text-gray-500';
  const inp  = dk
    ? 'bg-[#0a0a1e] border-[#1e1e3f] text-[#f0f0ff] placeholder-gray-600 focus:border-purple-500'
    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-400';

  return (
    <section id="reviews" className={`py-24 px-5 relative overflow-hidden ${dk ? 'bg-[#0d0d22]' : 'bg-white'}`}>
      {/* Decorative blobs */}
      <div className="absolute -top-32 left-1/4 w-80 h-80 rounded-full pointer-events-none opacity-[0.05] blur-3xl"
        style={{ background: 'radial-gradient(circle,#6C63FF,transparent)' }} />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full pointer-events-none opacity-[0.04] blur-2xl"
        style={{ background: 'radial-gradient(circle,#FF6B9D,transparent)' }} />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <div className={`inline-flex items-center gap-2 border rounded-full px-4 py-1.5 mb-4 ${
            dk ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-100'
          }`}>
            <Sparkles size={12} className="text-brand-violet" />
            <span className="text-xs font-semibold text-brand-violet uppercase tracking-wide">{t.reviewsTag}</span>
          </div>
          <h2 className={`text-4xl font-black mb-4 ${txt}`}>{t.reviewsTitle}</h2>
          <p className={`max-w-xl mx-auto mb-6 ${sub}`}>{t.reviewsSub}</p>

          {/* Average + count */}
          {reviews.length > 0 && (
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border ${card}`}>
                <span className="text-3xl font-black text-amber-400">{avg}</span>
                <div className="text-left">
                  <StarRating value={Math.round(Number(avg))} size={16} readonly />
                  <p className={`text-xs mt-0.5 ${sub}`}>{reviews.length} {t.reviewCount}</p>
                </div>
              </div>
            </div>
          )}

          {/* Leave review button */}
          <button
            onClick={() => { setFormOpen(v => !v); setStatus('idle'); }}
            className="inline-flex items-center gap-2 text-sm font-bold text-white px-6 py-3 rounded-xl shadow-md shadow-purple-300/30 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg,#6C63FF,#00C2FF)' }}
          >
            <MessageSquare size={15} />
            {t.reviewFormTitle}
          </button>
        </div>

        {/* Review form */}
        {formOpen && (
          <div className={`max-w-lg mx-auto mb-12 rounded-3xl border p-7 shadow-xl ${card}`}>
            <h3 className={`text-lg font-bold mb-5 ${txt}`}>{t.reviewFormTitle}</h3>
            {status === 'ok' && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-4 text-green-400 text-sm font-medium">{t.reviewFormOk}</div>
            )}
            {status === 'err' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4 text-red-400 text-sm">{t.reviewFormErr}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${sub}`}>{t.reviewFormName}</label>
                <input
                  type="text" required maxLength={80}
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder={t.reviewFormName}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm transition focus:outline-none ${inp}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${sub}`}>Note</label>
                <StarRating value={rating} onChange={setRating} size={28} />
              </div>
              <div>
                <textarea
                  required minLength={10} maxLength={400}
                  value={message} onChange={e => setMessage(e.target.value)}
                  placeholder={t.reviewFormMsg}
                  rows={3}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm transition focus:outline-none resize-none ${inp}`}
                />
              </div>
              <button
                type="submit" disabled={submitting || rating === 0}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white py-3 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#6C63FF,#00C2FF)' }}
              >
                <Send size={14} />
                {submitting ? '...' : t.reviewFormSubmit}
              </button>
            </form>
          </div>
        )}

        {/* Reviews grid */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <p className={`text-center py-10 ${sub}`}>{t.reviewNoReviews}</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((r, i) => (
              <div
                key={r.id}
                className={`rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 ${card}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <StarRating value={r.rating} size={15} readonly />
                <p className={`text-sm leading-relaxed mt-3 mb-4 ${sub}`}>"{r.message}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg,#6C63FF,#00C2FF)' }}>
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${txt}`}>{r.name}</p>
                    <p className={`text-xs ${sub}`}>
                      {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
