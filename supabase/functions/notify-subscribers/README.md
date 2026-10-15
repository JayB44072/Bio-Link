# notify-subscribers

Envoie un e-mail aux abonnés d'une page publique (nouveau produit, nouveau service, annonce, message libre).

## Ce qu'il faut avoir

1. **Un service d'envoi d'e-mails.** Cette fonction utilise [Resend](https://resend.com) (gratuit jusqu'à un certain volume).
   Créez un compte, **vérifiez votre nom de domaine** (sans cela les e-mails partent en spam ou sont refusés)
   et générez une clé d'API.
2. **La migration SQL** `supabase/migrations/20261015000000_tracking_and_subscribers.sql` exécutée.

## Déploiement

```bash
supabase functions deploy notify-subscribers
supabase secrets set \
  RESEND_API_KEY=re_xxx \
  NOTIFY_FROM="BioLinkWD <notifications@votredomaine.com>" \
  SITE_URL=https://biolinkwd.duckdns.org
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` sont fournies automatiquement par Supabase.

## Garde-fous

- L'appelant doit être connecté ; il n'écrit qu'à **ses propres** abonnés.
- 10 envois maximum par 24 h et par vendeur (journal dans `page_notifications`).
- Chaque e-mail contient un lien de désabonnement personnel (`/desabonnement/<jeton>`).
- Le texte saisi par le vendeur est échappé avant d'entrer dans le HTML.

Tant que la fonction n'est pas déployée, l'application continue de fonctionner : les abonnements sont enregistrés
et visibles dans le tableau de bord, seuls les envois échouent (message clair pour le vendeur).

## E-mail de bienvenue (welcome-subscriber)

A labonnement, le visiteur recoit un e-mail avec son lien prive "Voir mes livraisons".

    supabase functions deploy welcome-subscriber

Memes secrets que ci-dessus (RESEND_API_KEY, NOTIFY_FROM, SITE_URL) et migration
supabase/migrations/20261018000000_subscriber_welcome.sql. Un abonne ne recoit quun seul message de bienvenue.
