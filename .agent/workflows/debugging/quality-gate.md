# QUALITY GATE : DEBUGGING (DONKAI)

- [ ] **Plan approuvé par Kalf** avant application du correctif.
- [ ] **Cause racine identifiée et traitée** : Pas de solution de contournement temporaire ou d'atténuation cosmétique.
- [ ] **Zéro suppression d'erreur silencieuse** : Absence de blocs `try { ... } catch (e) {}` vides ou masquants.
- [ ] **Test de non-régression validé** : Le scénario qui échouait réussit désormais.
- [ ] **Build intègre** : `tsc && vite build` s'exécute avec succès.
- [ ] **Nettoyage des traces de debug** : Tous les `console.log` d'investigation retirés.
