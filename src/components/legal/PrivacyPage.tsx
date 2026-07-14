import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 font-sans antialiased">
      {/* Header */}
      <header className="border-b border-gray-800 px-5 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <a href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} />
            Retour à l'accueil
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-16">
        {/* Title */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#6C63FF,#00C2FF)' }}>
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-violet uppercase tracking-wide">WhiteDuckSaaS</p>
            <h1 className="text-2xl font-black text-white">Politique de Confidentialité</h1>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-12">Dernière mise à jour : juillet 2026</p>

        <div className="space-y-10 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-bold text-base mb-3">1. Qui sommes-nous ?</h2>
            <p>
              BioLinkWD est un service édité par <strong className="text-white">WhiteDuckSaaS</strong>.
              Notre plateforme permet aux créateurs et vendeurs de créer une page bio link personnalisée
              intégrant une boutique en ligne, des liens sociaux et des outils de paiement.
            </p>
            <p className="mt-2">
              En utilisant BioLinkWD, vous acceptez la présente politique de confidentialité.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">2. Données collectées</h2>
            <p>Nous collectons les données suivantes :</p>
            <ul className="mt-3 space-y-2 list-none">
              {[
                { title: 'Données de compte', desc: "Adresse e-mail, nom d'affichage, nom d'utilisateur (@username), photo de profil." },
                { title: 'Données de profil public', desc: "Description bio, liens sociaux, produits publiés, thème choisi — visibles par tous les visiteurs de votre page." },
                { title: 'Données de paiement', desc: "BioLinkWD ne stocke pas vos données bancaires. Les paiements sont traités via des prestataires tiers (MTN Money, Orange Money). Nous enregistrons uniquement les références de transactions." },
                { title: 'Données d\'utilisation', desc: "Nombre de vues de votre page, statistiques de vente, données de navigation anonymisées pour améliorer nos services." },
                { title: 'Avis publics', desc: "Si vous déposez un avis sur notre page d'accueil, votre nom et commentaire sont publiés publiquement." },
              ].map(({ title, desc }) => (
                <li key={title} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-violet mt-2 shrink-0" />
                  <span><strong className="text-gray-200">{title} :</strong> {desc}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">3. Pourquoi collectons-nous ces données ?</h2>
            <ul className="space-y-2">
              {[
                'Créer et gérer votre compte utilisateur',
                'Afficher votre page bio link publique',
                'Traiter les commandes et paiements de vos clients',
                'Vous envoyer des notifications importantes (commandes, sécurité)',
                'Améliorer nos services via des statistiques anonymisées',
                'Respecter nos obligations légales',
              ].map(item => (
                <li key={item} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">4. Partage des données</h2>
            <p>
              WhiteDuckSaaS ne vend jamais vos données personnelles à des tiers.
              Vos données peuvent être partagées avec :
            </p>
            <ul className="mt-3 space-y-2">
              {[
                { who: 'Supabase', why: "notre infrastructure de base de données et d'authentification (hébergement sécurisé)." },
                { who: 'Prestataires de paiement', why: 'MTN Mobile Money, Orange Money — uniquement pour le traitement des transactions.' },
                { who: 'Autorités légales', why: 'uniquement si la loi applicable l\'exige.' },
              ].map(({ who, why }) => (
                <li key={who} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                  <span><strong className="text-gray-200">{who} :</strong> {why}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">5. Conservation des données</h2>
            <p>
              Vos données sont conservées aussi longtemps que votre compte est actif.
              Si vous supprimez votre compte, vos données personnelles sont effacées dans un délai de 30 jours,
              à l'exception des données nécessaires à nos obligations légales (ex. : historique de transactions).
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">6. Vos droits</h2>
            <p>Conformément à la réglementation applicable, vous disposez des droits suivants :</p>
            <ul className="mt-3 space-y-2">
              {[
                'Droit d\'accès à vos données personnelles',
                'Droit de rectification de données inexactes',
                'Droit à l\'effacement (droit à l\'oubli)',
                'Droit à la portabilité de vos données',
                'Droit d\'opposition au traitement',
              ].map(right => (
                <li key={right} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                  <span>{right}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              Pour exercer vos droits, contactez-nous via WhatsApp :{' '}
              <a href="https://wa.me/640336384"
                className="text-brand-violet hover:underline" target="_blank" rel="noopener noreferrer">
                +640 33 63 84
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">7. Cookies</h2>
            <p>
              BioLinkWD utilise des cookies techniques strictement nécessaires au fonctionnement
              du service (authentification, préférences de langue et de thème).
              Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">8. Sécurité</h2>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger
              vos données : chiffrement des données en transit (HTTPS), authentification sécurisée,
              accès aux données restreint au personnel autorisé, et politiques de sécurité au niveau de
              la base de données (Row Level Security).
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">9. Modifications</h2>
            <p>
              WhiteDuckSaaS se réserve le droit de modifier cette politique à tout moment.
              Toute modification substantielle vous sera notifiée par e-mail ou via une bannière
              sur la plateforme. La date de mise à jour en haut de cette page indique la version en vigueur.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">10. Contact</h2>
            <p>Pour toute question relative à cette politique :</p>
            <div className="mt-3 bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-1">
              <p className="text-white font-semibold">WhiteDuckSaaS — BioLinkWD</p>
              <p>
                WhatsApp :{' '}
                <a href="https://wa.me/640336384"
                  className="text-brand-violet hover:underline" target="_blank" rel="noopener noreferrer">
                  +640 33 63 84
                </a>
              </p>
              <p>Instagram : <span className="text-gray-300">@biolinkwd</span></p>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-800 py-6 px-5 text-center text-xs text-gray-600">
        © 2026 WhiteDuckSaaS. Tous droits réservés.
      </footer>
    </div>
  );
}
