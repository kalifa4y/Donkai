# QUALITY GATE : SECURITY-AUDIT (DONKAI)

- [ ] **Plan approuvé par Kalf** avant toute modification de sécurité.
- [ ] **Zéro secret dans le frontend** : Recherche négative de `SERVICE_ROLE` ou clés secrètes d'API dans `src/`.
- [ ] **Contrôle RLS validé** : Aucun utilisateur ne peut modifier la collecte d'un tiers ni usurper un don.
- [ ] **Validation HMAC étanche** : Webhooks rejetés en cas de signature incorrecte ou manquante.
- [ ] **Vérification d'horodatage active** : Dérive temporelle bloquée au-delà de 600 secondes.
- [ ] **Verrou 30 jours inviolable** : Changement de numéro de retrait strictement contrôlé.
- [ ] **Variables d'environnement sécurisées** : `.env` protégé, présent dans `.gitignore`.
