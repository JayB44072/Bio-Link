import { useState } from 'react';
import { BellOff, Check, Link2 } from 'lucide-react';
import { useLang } from '../../lib/LanguageContext';
import { GRADIENTS } from '../../lib/theme';
import { unsubscribeFromPage } from '../../lib/api/subscribers';
import { unsubscribePlatformEmails } from '../../lib/api/platformEmails';
import { ButtonSpinner } from '../ui/Spinner';

interface UnsubscribePageProps {
  token: string;
  /** « shop » : e-mails d'une boutique suivie ; « platform » : e-mails de BioLinkWD aux vendeurs (rappels, nouveautés). */
  kind?: 'shop' | 'platform';
}

type State = 'idle' | 'busy' | 'done' | 'invalid';

/**
 * Page ouverte depuis le lien « Se désabonner » d'un e-mail.
 * Le désabonnement exige un clic (et non l'ouverture du lien) : les analyseurs de liens des messageries
 * ouvrent parfois les liens à l'avance et désabonneraient quelqu'un sans qu'il le sache.
 */
export default function UnsubscribePage({ token, kind = 'shop' }: UnsubscribePageProps) {
  const { lang } = useLang();
  const fr = lang === 'fr';
  const [state, setState] = useState<State>('idle');

  async function confirm() {
    setState('busy');
    const ok = kind === 'platform' ? await unsubscribePlatformEmails(token) : await unsubscribeFromPage(token);
    setState(ok ? 'done' : 'invalid');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <main className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-gray-100 p-7 text-center">
        <div className="flex items-center gap-2 justify-center mb-6">
          <Link2 size={16} aria-hidden className="text-brand-violet" />
          <span className="font-black text-gray-900">BioLinkWD</span>
        </div>

        {state === 'done' ? (
          <>
            <span className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-white" style={{ background: '#22c55e' }}><Check size={26} aria-hidden /></span>
            <h1 className="text-lg font-black text-gray-900" role="status">{fr ? 'Vous êtes désabonné' : 'You are unsubscribed'}</h1>
            <p className="text-sm text-gray-500 mt-2">{kind === 'platform'
              ? (fr ? 'Vous ne recevrez plus les rappels ni les annonces de BioLinkWD. Les e-mails liés à vos commandes ne sont pas concernés.' : 'You will no longer receive BioLinkWD reminders and announcements. Order-related emails are not affected.')
              : (fr ? 'Vous ne recevrez plus d’e-mails de cette boutique.' : 'You will no longer receive emails from this shop.')}</p>
          </>
        ) : state === 'invalid' ? (
          <>
            <h1 className="text-lg font-black text-gray-900" role="alert">{fr ? 'Lien invalide ou déjà utilisé' : 'Invalid or already used link'}</h1>
            <p className="text-sm text-gray-500 mt-2">{fr ? 'Vous êtes peut-être déjà désabonné.' : 'You may already be unsubscribed.'}</p>
          </>
        ) : (
          <>
            <span className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-gray-100 text-gray-500"><BellOff size={24} aria-hidden /></span>
            <h1 className="text-lg font-black text-gray-900">{fr ? 'Se désabonner ?' : 'Unsubscribe?'}</h1>
            <p className="text-sm text-gray-500 mt-2 mb-6">{kind === 'platform'
              ? (fr ? 'Vous ne recevrez plus les rappels ni les annonces de BioLinkWD.' : 'You will no longer receive BioLinkWD reminders and announcements.')
              : (fr ? 'Vous ne serez plus prévenu des nouveautés de cette boutique.' : 'You will no longer be notified about this shop’s news.')}</p>
            <button type="button" onClick={() => void confirm()} disabled={state === 'busy'}
              className="w-full h-12 rounded-full text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40"
              style={{ background: GRADIENTS.brand }}>
              {state === 'busy' && <ButtonSpinner />}{fr ? 'Confirmer le désabonnement' : 'Confirm unsubscribe'}
            </button>
          </>
        )}
      </main>
    </div>
  );
}
