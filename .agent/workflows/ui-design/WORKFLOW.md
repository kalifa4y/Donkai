WORKFLOW: ui-design

PURPOSE:
Conception, intégration et harmonisation visuelle de l'interface Donkai selon la direction artistique définie dans `DESIGN.md` (inspirée de la clarté et de l'immersion architecturale moderne, zéro AI slop, zéro emoji).

WHEN TO USE:
Évolution du design system, retouche de la palette, intégration de nouvelles vues de campagnes, cartes de don, modales de paiement ou de retraits.

WHEN NOT TO USE:
Tâches d'infrastructure, sécurité des paiements ou modifications de schémas de base de données.

MANDATORY SKILLS:
- design-system
- quality-gate-audit

MANDATORY MCP:
- filesystem
- playwright

ALLOWED ADDITIONAL TOOLS:
- run_command (compilation CSS et test responsive)

RÈGLES ARTISTIQUES DONKAI :
- Typographie : `Cal Sans` (titres h1-h6, grands montants, logo) et `Google Sans Flex` (corps, labels, boutons).
- Palette : Fond obsidienne `#0a0a0c`, surfaces sombres `#121318`, bordures `#232530`, fond clair ivoire `#faf9f6`, accents ocre `#f97316` / `#ea580c` et émeraude vibrant `#10b981`.
- Zéro dégradé violet/cyan générique d'IA.
- Zéro carte imbriquée superflue ("card-in-card").
- Zéro emoji. Utilisation systématique de `lucide-react`.
- Contrôles tactiles minimum 44x44px.

PHASES:
1. Analyse du besoin UI et alignment avec la charte `DESIGN.md`.
2. Sélection des composants et des tokens visuels (espacements, typographie, couleurs).
3. Proposition et plan d'intégration.
4. VALIDATION DU PLAN PAR KALF (POINT D'ARRET OBLIGATOIRE).
5. Implémentation CSS avec Tailwind CSS v4 et composants React.
6. Validation du contraste WCAG AAA et de la lisibilité plein soleil.
7. Contrôle responsive sur mobile et tablette.
8. Validation du Quality Gate UI-Design et présentation à Kalf.

VALIDATION GATE:
PLAN -> VALIDATION KALF (Point d'arrêt obligatoire).

FINAL QUALITY GATE:
- Typographies conformes (`Cal Sans` + `Google Sans Flex`).
- Contrastes WCAG AAA.
- Zéro emoji.
- Cibles tactiles >= 44x44px.
