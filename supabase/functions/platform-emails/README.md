# platform-emails

E-mails de BioLinkWD aux vendeurs inscrits :

- **Annonces** de nouvelles fonctionnalités, écrites dans le tableau de bord (onglet « Annonces », visible des administrateurs).
- **Rappel hebdomadaire** aux vendeurs qui ne se sont pas connectés depuis 7 jours : boutique à vérifier (ou premier produit à ajouter)
  et rappel du programme de parrainage (5 % / 2 % / 1 % pendant 12 mois). Un rappel par semaine au maximum, 8 au total
  si le vendeur ne revient jamais.

## Mise en place (100 % gratuite, sans nom de domaine)

1. **Brevo** (envoi d'e-mails, 300 par jour gratuits) : créer un compte sur brevo.com, puis
   *Expéditeurs, domaines → Expéditeurs → Ajouter un expéditeur* avec votre adresse (ex. Gmail) et valider le lien reçu.
   *SMTP et API → Clés API → Générer* donne la clé.
2. Exécuter `supabase/migrations/20261019000000_platform_emails.sql` (SQL Editor de Supabase).
3. Déployer les fonctions et définir les secrets :

```bash
supabase functions deploy platform-emails --no-verify-jwt
supabase functions deploy welcome-subscriber --no-verify-jwt
supabase functions deploy notify-subscribers
supabase secrets set \
  BREVO_API_KEY=xkeysib-xxx \
  NOTIFY_FROM="BioLinkWD <votre.adresse@gmail.com>" \
  SITE_URL=https://biolinkwd.duckdns.org \
  ADMIN_EMAILS=votre.adresse@gmail.com \
  CRON_SECRET=une-longue-chaine-aleatoire
```

4. **Planification (GitHub Actions, gratuit)** : dans GitHub, *Settings → Secrets and variables → Actions*, créer
   `PLATFORM_EMAILS_URL` (= `https://<projet>.supabase.co/functions/v1/platform-emails`) et `CRON_SECRET` (même valeur qu'à l'étape 3).
   Le fichier `.github/workflows/rappel-hebdo.yml` lance le rappel chaque lundi ; l'onglet *Actions → Run workflow* permet de l'essayer tout de suite.

Resend reste possible : définir `RESEND_API_KEY` à la place de `BREVO_API_KEY` (nécessite un domaine vérifié).

## Garde-fous

- L'administrateur est reconnu par `ADMIN_EMAILS` (secret serveur), **pas** par la colonne `is_admin` que chaque utilisateur peut modifier.
- Le rappel exige `CRON_SECRET`.
- Chaque e-mail contient `/preferences-email/<jeton>` : un clic désinscrit définitivement de ces e-mails (les e-mails de commande ne sont pas concernés).
- Annonces : 3 par 24 h au maximum ; un bouton d'essai envoie l'e-mail à l'administrateur seul.
- Limite gratuite de Brevo : 300 e-mails par jour. Au-delà, les envois échouent jusqu'au lendemain.
