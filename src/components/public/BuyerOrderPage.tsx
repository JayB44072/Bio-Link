import { Link2, Loader2, Package } from 'lucide-react';
import { useLang } from '../../lib/LanguageContext';
import { confirmDelivery } from '../../lib/api/orders';
import { useOrderDetails } from '../../lib/useOrderDetails';
import OrderDetailsCard from './OrderDetailsCard';

interface BuyerOrderPageProps {
  orderId: string;
}

/** Page de suivi d'une commande (lien reçu après le paiement) : l'écran complet, sur fond clair. */
export default function BuyerOrderPage({ orderId }: BuyerOrderPageProps) {
  const { lang } = useLang();
  const fr = lang === 'fr';
  const { details, loading, reload } = useOrderDetails(orderId);

  async function onConfirm(): Promise<string | null> {
    const r = await confirmDelivery(orderId);
    if (r.ok) { await reload(); return null; }
    if (r.error === 'not_shipped') return fr ? "Le vendeur n'a pas encore expédié cette commande." : 'The seller has not shipped this order yet.';
    if (r.error === 'not_found') return fr ? 'Commande introuvable.' : 'Order not found.';
    return fr ? 'La confirmation est momentanément indisponible. Réessayez dans un instant.' : 'Confirmation is temporarily unavailable. Please try again shortly.';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" role="status" aria-label={fr ? 'Chargement' : 'Loading'}>
        <Loader2 size={28} className="animate-spin text-brand-violet" />
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <Package size={32} aria-hidden className="text-gray-300 mb-3" />
        <h1 className="text-gray-900 font-bold text-lg mb-1">{fr ? 'Commande introuvable' : 'Order not found'}</h1>
        <p className="text-gray-400 text-sm">{fr ? 'Ce lien de suivi est invalide ou a expiré.' : 'This tracking link is invalid or expired.'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <main className="max-w-xl mx-auto">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Link2 size={16} aria-hidden className="text-brand-violet" />
          <span className="font-black text-gray-900">BioLinkWD</span>
        </div>
        <h1 className="sr-only">{fr ? 'Suivi de commande' : 'Order tracking'}</h1>
        <OrderDetailsCard details={details} lang={lang} onConfirm={onConfirm} />
      </main>
    </div>
  );
}
