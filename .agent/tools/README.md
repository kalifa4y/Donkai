# OUTILS & MCP DU SYSTÈME OPÉRATIONNEL DONKAI

Ce document consigne la cartographie des outils natifs et serveurs MCP autorisés sur Donkai.

## 1. Outils Natifs
- **`view_file`** : Lecture chirurgicale du code, schémas SQL et configurations.
- **`write_to_file` / `replace_file_content`** : Création et modification précise de code sans régression.
- **`grep_search` / `list_dir`** : Exploration de l'arborescence et recherche de références croisées.
- **`run_command`** : Exécution des scripts de contrôle (`pnpm build`, `tsc`, `playwright test`).

## 2. Serveurs MCP Autorisés
- **`filesystem`** : Accès contrôlé au système de fichiers de Donkai.
- **`playwright`** : Automatisation de navigateurs pour tests E2E, captures d'écrans et audits UX.

## 3. Garde-fous d'Usage
- Respect strict du principe de moindre privilège.
- Zéro accès de production ou outil payant sans accord explicite de Kalf.
