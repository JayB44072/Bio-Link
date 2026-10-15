import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { useAppPrefs } from '../../lib/AppPrefsContext';
import { BRAND, GRADIENTS } from '../../lib/theme';

export default function CguPage() {
  const { isDark: dk } = useAppPrefs();

  const bg      = dk ? '#0b0b1e'                : '#fbfaff';
  const surface = dk ? '#12122b'                : '#ffffff';
  const border  = dk ? 'rgba(139,124,255,0.14)' : '#efecfb';
  const txtPrim = dk ? '#f2f1ff'                : BRAND.navy;
  const txtSub  = dk ? '#8c8ab0'                : '#8a87a3';
  const txtBody = dk ? '#b8b6d0'                : '#4b5563';
  const dot     = dk ? '#8B7CFF'                : BRAND.violet;

  return (
    <div className="min-h-screen font-sans antialiased" style={{ background: bg, color: txtBody }}>
      <header className="px-5 py-4" style={{ borderBottom: `1px solid ${border}`, background: surface }}>
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 transition-colors text-sm" style={{ color: txtSub }}>
            <ArrowLeft size={16} />
            Retour à l'accueil
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-16">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: GRADIENTS.violetPink }}>
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: BRAND.violet }}>WhiteDuckSaaS</p>
            <h1 className="text-2xl font-black" style={{ color: txtPrim }}>Conditions Générales d'Utilisation</h1>
          </div>
        </div>
        <p className="text-sm mb-12" style={{ color: txtSub }}>Dernière mise à jour : septembre 2026</p>

        <div className="space-y-10 text-sm leading-relaxed">

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: txtPrim }}>1. Présentation du service</h2>
            <p>
              BioLinkWD est une plateforme SaaS éditée par <strong style={{ color: txtPrim }}>WhiteDuckSaaS</strong>.
              Elle permet à tout vendeur ou créateur de contenu de créer une page bio link personnalisée
              intégrant une boutique en ligne, des liens vers ses réseaux sociaux et des outils de paiement
              adaptés au marché africain (MTN Mobile Money, Orange Money).
            </p>
            <p className="mt-2">
              En créant un compte ou en utilisant le service, vous acceptez sans réserve les présentes
              Conditions Générales d'Utilisation (CGU). Si vous n'acceptez pas ces conditions,
              vous ne devez pas utiliser BioLinkWD.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: txtPrim }}>2. Accès au service</h2>
            <ul className="space-y-2">
              {[
                "Le service est accessible à toute personne physique ou morale disposant d'un accès à Internet.",
                "L'inscription est obligatoire pour accéder au tableau de bord vendeur et aux fonctionnalités de vente.",
                "Vous devez avoir au minimum 18 ans ou avoir l'autorisation d'un représentant légal pour utiliser le service.",
                'Vous êtes responsable de la confidentialité de vos identifiants de connexion.',
                "WhiteDuckSaaS se réserve le droit de refuser ou de suspendre l'accès à tout utilisateur sans préavis en cas de violation des présentes CGU.",
              ].map(item => (
                <li key={item} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: dot }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: txtPrim }}>3. Compte utilisateur</h2>
            <p>
              Lors de votre inscription, vous choisissez un nom d'utilisateur unique (@username) qui
              constituera l'adresse publique de votre boutique (ex. : biolinkwd.com/u/votre-pseudo).
              Ce nom d'utilisateur ne peut pas être transféré à un tiers.
            </p>
            <p className="mt-2">
              Vous êtes seul responsable des informations publiées sur votre page (produits, photos,
              prix, descriptions). WhiteDuckSaaS ne saurait être tenu responsable de tout contenu
              inexact, trompeur ou illicite publié par un utilisateur.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: txtPrim }}>4. Contenus interdits</h2>
            <p>Il est strictement interdit de publier ou vendre sur BioLinkWD :</p>
            <ul className="mt-3 space-y-2">
              {[
                'Des produits contrefaits ou portant atteinte aux droits de propriété intellectuelle',
                'Des substances illicites, drogues, médicaments sans prescription',
                'Des armes ou munitions de toute nature',
                'Du contenu à caractère pornographique ou pédopornographique',
                'Des produits ou services frauduleux, escroqueries ou arnaques',
                'Tout contenu incitant à la haine, à la discrimination ou à la violence',
              ].map(item => (
                <li key={item} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: BRAND.pink }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              Tout compte publiant ce type de contenu sera immédiatement suspendu et les fonds
              disponibles dans le portefeuille pourront être bloqués dans l'attente d'une enquête.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: txtPrim }}>5. Commissions et tarification</h2>
            <p>BioLinkWD prélève une commission sur chaque vente effectuée via la plateforme. Le taux de commission varie selon votre forfait :</p>
            <div className="mt-4 rounded-2xl overflow-hidden" style={{ border: `1px solid ${border}` }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide" style={{ background: surface, color: txtSub }}>
                    <th className="px-4 py-3 text-left">Forfait</th>
                    <th className="px-4 py-3 text-left">Prix mensuel</th>
                    <th className="px-4 py-3 text-left">Commission plateforme</th>
                  </tr>
                </thead>
                <tbody style={{ borderTop: `1px solid ${border}` }}>
                  {[
                    { plan: 'Gratuit', price: 'Gratuit', rate: '5 %' },
                    { plan: 'Starter', price: '2 000 FCFA / mois', rate: '4 %' },
                    { plan: 'Business', price: '5 000 FCFA / mois', rate: '3 %' },
                    { plan: 'Premium', price: '10 000 FCFA / mois', rate: '2 %' },
                  ].map(row => (
                    <tr key={row.plan} style={{ borderTop: `1px solid ${border}` }}>
                      <td className="px-4 py-3 font-semibold" style={{ color: txtPrim }}>{row.plan}</td>
                      <td className="px-4 py-3">{row.price}</td>
                      <td className="px-4 py-3 font-bold" style={{ color: BRAND.violet }}>{row.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              La commission est déduite automatiquement à chaque transaction. Le solde restant
              (après déduction de la commission) est crédité sur votre portefeuille BioLinkWD.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: txtPrim }}>6. Portefeuille et retraits</h2>
            <ul className="space-y-2">
              {[
                'Votre portefeuille BioLinkWD centralise vos revenus de vente, déduction faite de la commission plateforme.',
                'Vous pouvez demander un retrait via MTN Mobile Money ou Orange Money à tout moment.',
                'Les retraits standards sont traités dans un délai de 24 à 72 heures ouvrables.',
                "Les abonnés Premium bénéficient d'un traitement prioritaire de leurs demandes de retrait.",
                'Un montant minimum de retrait peut être appliqué. BioLinkWD se réserve le droit de modifier ce seuil avec préavis.',
                'WhiteDuckSaaS ne saurait être tenu responsable des retards causés par les opérateurs de paiement (MTN, Orange).',
              ].map(item => (
                <li key={item} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: dot }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: txtPrim }}>7. Abonnements</h2>
            <p>
              Les abonnements payants (Starter, Business, Premium) sont facturés mensuellement.
              Tout mois commencé est dû en intégralité. Il n'y a pas de remboursement pour
              la période en cours en cas de résiliation anticipée.
            </p>
            <p className="mt-2">
              WhiteDuckSaaS se réserve le droit de modifier les tarifs des abonnements avec
              un préavis de 30 jours communiqué par e-mail ou via la plateforme.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: txtPrim }}>8. Programme d'affiliation</h2>
            <p>
              BioLinkWD propose un programme de parrainage permettant à tout utilisateur de percevoir
              une commission sur les abonnements souscrits par les personnes qu'il a parrainées.
              Les conditions de ce programme (taux, niveaux, durée) sont définies dans l'onglet
              "Parrainage" du tableau de bord et peuvent être modifiées par WhiteDuckSaaS à tout moment.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: txtPrim }}>9. Propriété intellectuelle</h2>
            <p>
              La marque BioLinkWD, le logo, le code source, les designs et tous les éléments
              constitutifs de la plateforme sont la propriété exclusive de WhiteDuckSaaS et sont
              protégés par les lois applicables en matière de propriété intellectuelle.
            </p>
            <p className="mt-2">
              En publiant des contenus sur BioLinkWD (photos, descriptions, textes), vous accordez
              à WhiteDuckSaaS une licence non exclusive, mondiale et gratuite d'utilisation de ces
              contenus aux seules fins de l'exploitation du service.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: txtPrim }}>10. Responsabilité</h2>
            <p>
              WhiteDuckSaaS est un hébergeur de contenus au sens de la loi applicable. À ce titre,
              nous ne sommes pas responsables des contenus publiés par les vendeurs ni des litiges
              survenant entre vendeurs et acheteurs.
            </p>
            <p className="mt-2">
              En cas de dysfonctionnement technique, BioLinkWD s'engage à rétablir le service dans
              les meilleurs délais mais ne peut garantir une disponibilité continue à 100 %.
              WhiteDuckSaaS ne saurait être tenu responsable de toute perte de revenus résultant
              d'une interruption du service.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: txtPrim }}>11. Suspension et résiliation</h2>
            <p>
              Vous pouvez supprimer votre compte à tout moment depuis les paramètres ou en nous
              contactant. WhiteDuckSaaS se réserve le droit de suspendre ou supprimer tout compte
              en violation des présentes CGU, sans préavis et sans indemnité.
            </p>
            <p className="mt-2">
              En cas de suspension pour violation des CGU, les fonds présents dans le portefeuille
              pourront être bloqués pendant la durée de l'enquête.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: txtPrim }}>12. Modifications des CGU</h2>
            <p>
              WhiteDuckSaaS se réserve le droit de modifier les présentes CGU à tout moment.
              Les modifications entrent en vigueur dès leur publication sur cette page.
              En continuant à utiliser le service après modification, vous acceptez les nouvelles CGU.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: txtPrim }}>13. Droit applicable et litiges</h2>
            <p>
              Les présentes CGU sont soumises au droit camerounais. En cas de litige,
              une solution amiable sera recherchée en priorité. À défaut d'accord amiable,
              le litige sera soumis aux tribunaux compétents de Douala, Cameroun.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: txtPrim }}>14. Contact</h2>
            <p>Pour toute question relative aux présentes CGU :</p>
            <div className="mt-3 rounded-2xl p-5 space-y-1" style={{ background: surface, border: `1px solid ${border}` }}>
              <p className="font-semibold" style={{ color: txtPrim }}>WhiteDuckSaaS — BioLinkWD</p>
              <p>
                WhatsApp :{' '}
                <a href="https://wa.me/640336384" style={{ color: BRAND.violet }}
                  className="hover:underline" target="_blank" rel="noopener noreferrer">
                  +640 33 63 84
                </a>
              </p>
              <p>Instagram : <span style={{ color: txtBody }}>@biolinkwd</span></p>
            </div>
          </section>

        </div>
      </main>

      <footer className="py-6 px-5 text-center text-xs" style={{ borderTop: `1px solid ${border}`, color: txtSub }}>
        © 2026 WhiteDuckSaaS. Tous droits réservés.
      </footer>
    </div>
  );
}
