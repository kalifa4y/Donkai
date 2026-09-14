# RÈGLE : ASSAINISSEMENT & NETTOYAGE (CLEANUP)

## 1. Objectif
Garantir que le projet Donkai demeure exempt de code mort, de dépendances orphelines, de configurations périmées et d'assets inutilisés.

---

## 2. Périmètre de Nettoyage Systématique
Après chaque étape ou refonte fonctionnelle :
- **Fichiers de configuration obsolètes** : Éliminer toute trace d'anciens hébergeurs ou frameworks abandonnés (ex. configurations Netlify passées en faveur de Vercel).
- **Composants et hooks orphelins** : Supprimer tout composant React, utilitaire ou type TypeScript qui n'est plus importé ni exécuté.
- **Code commenté et temporaire** : Ne laisser aucun bloc de code mort commenté ou bloc de debug console en production.
- **Dépendances npm** : Désinstaller toute dépendance non utilisée dans `package.json` et mettre à jour le lockfile.
- **Assets multimédias** : Supprimer les SVG, logos ou images non exploités dans `public/` ou `src/assets/`.

---

## 3. Protocole de Suppression Sécurisée
Ne jamais supprimer un fichier sans contrôle d'impact préalable :
```text
RECHERCHE DE RÉFÉRENCES CROISÉES (Grep / Search)
  ↓
VÉRIFICATION DES IMPORTS ET DES TESTS
  ↓
EXÉCUTION DU BUILD (tsc && vite build)
  ↓
SUPPRESSION DÉFINITIVE DU FICHIER
```
