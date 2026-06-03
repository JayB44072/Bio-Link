## BioLinkWD - Nouvelle Mise à Jour : Thèmes Graphiques Avancés et Double Aperçu

### 1. THÈMES VISUELS AVEC ARRIÈRE-PLANS STYLISÉS

#### Nouveaux thèmes ajoutés (11 au total) :

1. **Blanc Standard** (Gratuit)
   - Fond blanc épuré avec texte gris foncé
   
2. **Sombre Élégant** (Starter+)
   - Gris charbon profond avec texte blanc
   
3. **Minimaliste** (Starter+) ✨ FORMES
   - Dégradé blanc vers gris clair
   - Formes géométriques légères en arrière-plan : carrés arrondis, lignes épurées
   - Opacité 30% pour un effet discret
   
4. **Géométrique** (Starter+) ✨ FORMES
   - Fond ardoise sombre avec motif de points
   - Sphères de gradient cyan/purple floues en arrière-plan
   - Lignes grille cyberpunk à 25%, 50%, 75% de hauteur
   - Accent cyan électrique
   
5. **Pastel** (Starter+) ✨ FORMES
   - Dégradé tricolore rose/pourpre/bleu
   - Trois sphères floues rose, purple, bleu disposées en triangle
   - Effet doux et accueillant
   - Accent blanc
   
6. **Cyberpunk** (Starter+) ✨ FORMES
   - Gradient noir/pourpre intense
   - Lignes horizontales cyan neon simulant un scan
   - Barres verticales rose/cyan à différents points
   - Effet ligne grille SVG
   - Accent cyan neon
   
7. **Océan Bleu** (Starter+)
   - Bleu profond avec accent cyan

8. **Forêt Verte** (Starter+)
   - Vert émeraude sombre avec accent émeraude

9. **Coucher de Soleil** (Starter+)
   - Orange/ambre sombre avec accent ambre

10. **Rose Doux** (Starter+)
    - Rose profond avec accent rose

11. **Or Métallisé** (Premium UNIQUEMENT) 👑 PREMIUM
    - **THÈME EXCLUSIF PREMIUM**
    - Dégradé or/jaune/ambre graduel et métallisé
    - Sphères dorées floues en arrière-plan (opacité 40%)
    - Motif de points or subtil via SVG (dots-or)
    - Ombre douce et brillance premium
    - Accent jaune pâle
    - Badge "PREMIUM" sur le bouton de sélection
    - **Verrouillé pour tous sauf Premium**
    - **Modale d'upgrade au clic** pour les autres plans

---

### 2. DOUBLE APERÇU DANS LE DASHBOARD

#### Sélecteur d'affichage en temps réel

**Localisation :** Dans le tab "Mon Lien Bio" (BioLink), zone de prévisualisation à droite du formulaire.

**Fonctionnalités :**

- **Bouton "Mobile"** (Icône Smartphone)
  - Affiche l'aperçu dans un cadre de téléphone réaliste
  - Dimensions : 240px × 480px
  - Cadre noir avec bord arrondi (2.5rem)
  - Encoché notch en haut
  - Scroll possible si contenu dépasse
  - Rendu idéal pour tester l'expérience mobile

- **Bouton "Bureau"** (Icône Monitor)
  - Affiche l'aperçu en vue de bureau/tablette
  - Dimensions : 100% × 600px
  - Cadre avec bordure grise et ombre
  - Contenu centré et agrandissable
  - Avatar : 128px (vs 64px sur mobile)
  - Texte et espacements augmentés
  - Boutons avec plus d'espace
  - Idéal pour voir l'expérience desktop

**Synchronisation en temps réel :**
- Tous les changements du formulaire (nom, bio, thème, liens, produits) s'affichent instantanément dans les deux vues
- Le thème sélectionné s'applique immédiatement avec ses formes/gradients d'arrière-plan
- Permet au créateur de voir exactement comment les clients verront sa page

---

### 3. COMPOSANTS NOUVEAUX CRÉÉS

#### `ThemeBackground.tsx`
Composant réutilisable qui génère les formes/motifs SVG/gradients pour chaque thème :
- Formes abstraites (carrés, cercles)
- Gradients flous (blur)
- Motifs SVG (points, lignes)
- Appliqué en position absolute avec `pointer-events-none` pour ne pas bloquer les interactions
- Opacité adjustable par thème

#### `DesktopPreview.tsx`
Composant de prévisualisation bureau :
- Affichage plein écran avec marges
- Avatar plus grand (128px)
- Contenu centré avec max-width
- Applique le background du thème avec `ThemeBackground`
- Responsive simulation

#### Mise à jour `MobilePreview.tsx`
- Intégration de `ThemeBackground`
- Support du thème gold avec ombre dorée
- Texte d'accent dynamique selon le thème

---

### 4. DÉTAILS DE PLANIFICATION

#### Accessibilité des thèmes par plan

| Thème | Gratuit | Starter | Business | Premium |
|-------|---------|---------|----------|---------|
| Blanc Standard | ✓ | ✓ | ✓ | ✓ |
| Sombre Élégant | ✗ | ✓ | ✓ | ✓ |
| Minimaliste | ✗ | ✓ | ✓ | ✓ |
| Géométrique | ✗ | ✓ | ✓ | ✓ |
| Pastel | ✗ | ✓ | ✓ | ✓ |
| Cyberpunk | ✗ | ✓ | ✓ | ✓ |
| Océan Bleu | ✗ | ✓ | ✓ | ✓ |
| Forêt Verte | ✗ | ✓ | ✓ | ✓ |
| Coucher de Soleil | ✗ | ✓ | ✓ | ✓ |
| Rose Doux | ✗ | ✓ | ✓ | ✓ |
| **Or Métallisé** | ✗ | ✗ | ✗ | **✓ EXCLUSIF** |

#### Modale Premium
- Affichée au clic sur le thème Or pour non-Premium
- Icône couronne doré
- Message d'upgrade avec nom du plan
- Bouton "Passer au Premium" avec icône couronne

---

### 5. EXPÉRIENCE UTILISATEUR

**Workflow créateur :**
1. Accès au Dashboard → Onglet "Mon Lien Bio"
2. Formule complète le profil (nom, photo, bio)
3. Clique sur un thème pour aperçu instantané
4. Bascule entre "Mobile" et "Bureau" pour valider les deux vues
5. Ajoute des liens sociaux (le nombre max dépend du plan)
6. Voit en temps réel comment la page publique s'affichera
7. Si essaie le thème Or sans Premium : modale d'upgrade
8. Clique "Enregistrer" pour sauvegarder

**Page publique (/u/:username) :**
- Affiche le thème sélectionné avec arrière-plan
- Responsive mobile/desktop automatique
- Badge "Propulsé par WhiteDukeSaas" visible uniquement si plan Gratuit
- Si plan Premium : page marque blanche sans badge

---

### 6. ANIMATIONS & MICRO-INTERACTIONS

- **Sélection thème :** Bordure bleue + légère réduction d'échelle (scale-95)
- **Basculement mobile/bureau :** Boutons actifs avec fond bleu clair
- **Avatar premium (Or) :** Ombre dorée subtile (shadow-yellow-500/30)
- **Formes d'arrière-plan :** Blur 3D pour effet profondeur, opacité variable par thème

---

### 7. FICHIERS MODIFIÉS / CRÉÉS

**Créés :**
- `src/components/ui/ThemeBackground.tsx` — Générateur de formes
- `src/components/dashboard/DesktopPreview.tsx` — Aperçu bureau
- (Mis à jour `src/lib/planLimits.ts` — Nouveaux thèmes avec propriété `premium`)

**Modifiés :**
- `src/components/dashboard/tabs/BioLink.tsx` — Sélecteur d'aperçu mobile/bureau, modale premium
- `src/components/dashboard/MobilePreview.tsx` — Intégration ThemeBackground
- `src/components/public/PublicPage.tsx` — Intégration ThemeBackground, ombre avatar gold
- `src/lib/planLimits.ts` — Définition de 11 thèmes avec propriétés hasBg et premium

---

### 8. TESTS À EFFECTUER

1. ✓ Sélectionner chaque thème → aperçu se met à jour
2. ✓ Basculer mobile/bureau → viewport change, contenu repositionné
3. ✓ Tenter de cliquer sur "Or Métallisé" (non-Premium) → modale d'upgrade
4. ✓ Changer le forfait à Premium → thème Or déverrouillé
5. ✓ Vérifier les formes en arrière-plan sur chaque thème (web et mobile)
6. ✓ Ajouter liens sociaux → visibles en aperçu temps réel
7. ✓ Visiter la page publique → thème appliqué avec backgrounds
8. ✓ Sur plan Gratuit → badge "Propulsé par WhiteDukeSaas"
9. ✓ Sur plan Premium → pas de badge, page marque blanche

---

**Déploiement :** Prêt pour production. Build réussi (367.81 kB gzipé).
