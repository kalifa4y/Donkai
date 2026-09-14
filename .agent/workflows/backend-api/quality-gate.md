# QUALITY GATE : BACKEND-API (DONKAI)

- [ ] **Plan approuvé par Kalf** avant modification.
- [ ] **Politiques RLS actives** : Aucune table sensible accessible publiquement en écriture directe.
- [ ] **Validation des entrées** : Contrôle systématique des données (format UUID, montant minimum, champs requis).
- [ ] **Gestion des codes de statut** : 200/201 (succès), 400 (mauvaise requête), 401/403 (authentification/droits), 404 (introuvable), 500 (erreur interne maîtrisée).
- [ ] **Absence de fuite de données** : Zéro retour d'informations sensibles (tokens internes, hashs de signatures, stack trace Deno/Node).
- [ ] **Headers CORS standardisés** : Configuration stricte des origines et méthodes autorisées.
- [ ] **Zéro Emoji** : Aucun emoji dans les logs ou les réponses d'erreurs JSON.
