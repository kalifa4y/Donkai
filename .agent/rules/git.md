# RÈGLE : GESTION DES COMMITS & VERSIONNEMENT GIT

## 1. Principes Clés
- **Commits atomiques** : Un commit correspond à une seule intention logique ou unité fonctionnelle.
- **Convention Angular / Conventional Commits** : Messages explicites, rédigés en anglais ou en français selon la convention du projet, sans emoji.

---

## 2. Format des Messages de Commit
```text
<type>(<portée>): <description concise>
```

Types autorisés :
- `feat` : Nouvelle fonctionnalité visible pour l'utilisateur.
- `fix` : Correction d'une anomalie ou d'un bogue.
- `refactor` : Modification structurelle du code sans altération du comportement observable.
- `perf` : Optimisation de performance (temps de rendu, requêtes, bundle).
- `security` : Renforcement de la sécurité (RLS, secrets, HMAC, validation des inputs).
- `test` : Ajout ou révision de tests (Playwright, unitaires).
- `chore` : Maintenance technique, dépendances, configuration Vercel ou Supabase.
- `docs` : Documentation technique (`README.md`, `PRODUCT.md`, `DESIGN.md`).

---

## 3. Garde-fous Absolus
- **Aucun push direct sur la branche `main`** sans revue ou approbation formelle de Kalf.
- **Vérification pré-commit obligatoire** :
  - `tsc --noEmit` sans erreur de typage.
  - `vite build` avec succès.
  - Zéro secret ou jeton API inclus dans le diff (`.env` systématiquement ignoré).
  - Zéro emoji présent dans le message de commit.
