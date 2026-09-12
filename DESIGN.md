# DONKAI — Direction Visuelle & Design System (DESIGN.md)

## 1. Vision & Ambiance de Marque
- **Esprit visuel de référence :** Inspiré de l'élégance architecturale et du minimalisme immersif d'[openreel.video](https://openreel.video/) :
  - Espaces généreux et respiration (macro-spacing).
  - Typographie imposante, nette et moderne avec du caractère (zéro police système passe-partout).
  - Présentation du produit réel au centre de la scène, avec un aperçu dynamique et interactif.
  - Micro-interactions subtiles et précises, animations mesurées qui valorisent le contenu.
  - Zéro artifice tape-à-l'œil, zéro dégradé pourpre générique d'IA ("AI slop"), zéro emoji.

---

## 2. Palette Chromatique
Une gamme enracinée dans la modernité ouest-africaine, mêlant teintes telluriques nobles, contrastes sombres affirmés et chaleur lumineuse :

- **Fond principal (Canvas) :** `#0b0c10` (Mode sombre profond teinté minéral) ou `#fbfaf7` (Mode clair ivoire feutré).
  - Pour la landing page : univers sombre premium, futuriste et contrasté (fond obsidienne teinté ocre chaud `#0a0a0c`, surfaces `#121318`, bordures subtiles `#232530`).
  - Pour les espaces applicatifs (pages collectes, dashboard) : clarté, lisibilité absolue sur mobile sous forte luminosité (ivoire `#faf9f6`, surfaces blanches pures `#ffffff`, texte noir encre `#09090b`).
- **Couleurs d'accent et de marque :**
  - **Ocre flamboyant / Solaire :** `#f97316` (Orange vif) / `#ea580c` (Terre brûlée) / `#f59e0b` (Ambre dorée).
  - **Confiance & Réussite :** `#10b981` (Vert émeraude vibrant) pour les dons collectés, barres de progression et succès de paiement.
  - **Mobile Money identitaires (utilisés avec retenue) :**
    - Orange Money : `#ea580c`
    - Wave : `#0284c7`
    - Moov Money : `#059669`
- **Nuances de texte :**
  - Titres et textes dominants : `#09090b` (clair) ou `#f8fafc` (sombre).
  - Textes d'accompagnement : `#52525b` (clair) ou `#94a3b8` (sombre).
  - Zéro gris délavé illisible sur fond sombre : contraste conforme WCAG AAA pour tout texte d'action.

---

## 3. Typographie
- **Typographie de Titrage (Display & Brand) :** `Space Grotesk` ou `Outfit` combiné à `Plus Jakarta Sans`.
  - Poids forts (700, 800), tracking resserré (`tracking-tight`), lisibilité percutante en grand format.
- **Typographie de Corps de texte :** `Plus Jakarta Sans`
  - Clarté exceptionnelle sur smartphone même à 12-14px.
- **Typographie Numérique & Données :** `JetBrains Mono` ou `ui-monospace`
  - Pour les montants en FCFA, les dates, les slugs de collectes et les identifiants.

---

## 4. Règles Anti "AI Slop"
1. **Bannissement des emojis :** Strictement aucun emoji dans le code, l'UI, les boutons, les commits ou la documentation. Utilisation systématique de la bibliothèque **Lucide Icons** (`lucide-react`).
2. **Pas de dégradé violet/cyan SaaS générique :** Remplacé par des teintes profondes, du cuivre, de l'ambre chaud et des accents telluriques.
3. **Pas d'empilement de cartes imbriquées (card-in-card) :** Hiérarchie par l'espace, la taille de police et des séparateurs discrets, pas par 4 couches de rectangles arrondis.
4. **Pas de boutons sans état actif visible :** États `:hover`, `:focus-visible`, `:active`, `:disabled` expressément stylisés avec un retour tactile immédiat.
5. **Mobile-first absolu :** Zones de tap minimales de 44x44px, formulaires à inputs généreux avec types numériques adaptés pour déclencher le pavé numérique (`inputMode="numeric"`).

---

## 5. Composants Clés
- **Hero Display :** Grande accroche percutante, bouton d'action principal bien dimensionné, aperçu animé interactif d'une collecte en direct avec calcul de progression en temps réel.
- **Barre de progression & Paliers :** Progression fluide avec étapes clés (25%, 50%, 75%, 100%), indicateur du montant manquant et nombre de soutiens.
- **Carte de don ultra-fluide :** Montants rapides en tuiles tactiles (1 000, 2 500, 5 000, 10 000 FCFA), champ montant personnalisé, toggle anonymat, calcul instantané et transparent du net reversé.
- **Modal de Retrait Sécurisé :** Affichage du solde disponible, alerte anti-fraude 30 jours pour le numéro de versement, et vérification du seuil KYC (500 000 FCFA).
