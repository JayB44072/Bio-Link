import { useCallback, useEffect, useState } from 'react';
import { getOrderDetails, type OrderDetails } from './api/orders';

const REFRESH_MS = 30000;

/**
 * Charge le détail d'une commande (produit, vendeur, suivi) puis l'actualise toutes les 30 s tant qu'elle est en cours.
 * `orderId` nul : rien n'est chargé.
 */
export function useOrderDetails(orderId: string | null) {
  const [details, setDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!orderId) return;
    setDetails(await getOrderDetails(orderId));
  }, [orderId]);

  useEffect(() => {
    if (!orderId) { setDetails(null); setLoading(false); return; }
    let alive = true;
    setLoading(true);
    setDetails(null);
    getOrderDetails(orderId).then(d => { if (alive) { setDetails(d); setLoading(false); } });
    return () => { alive = false; };
  }, [orderId]);

  const open = !!details && (details.order.status === 'pending' || details.order.status === 'shipped');
  useEffect(() => {
    if (!open || !orderId) return;
    const id = window.setInterval(() => { void reload(); }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [open, orderId, reload]);

  return { details, loading, reload };
}
