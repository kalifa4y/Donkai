# QUALITY GATE : PAYMENT (DONKAI)

Avant de déclarer une tâche du workflow Payment terminée, tous les critères suivants doivent être validés :

- [ ] **Plan approuvé par Kalf** : Validation formelle obtenue avant tout changement sur les flux de paiement.
- [ ] **Calcul strict des frais côté serveur** : Frais de 5% + 100 FCFA déduits côté Edge Function, non modifiables par le client.
- [ ] **Vérification cryptographique HMAC** : Contrôle effectif de la signature `x-webhook-signature` / `x-saspay-signature` sur les requêtes entrantes.
- [ ] **Tolérance temporelle anti-rejeu** : Rejet des webhooks ayant un timestamp dépassant la fenêtre de 600 secondes.
- [ ] **Protection d'idempotence** : Aucun double traitement possible sur répétition d'une même session ou webhook.
- [ ] **Mise à jour atomique de la collecte** : Incrémentation du montant collecté (`collected_amount`) et du nombre de soutiens (`contributions_count`) garantie uniquement sur confirmation de paiement.
- [ ] **Verrou de sécurité 30 jours** : Impossibilité absolue de modifier le numéro de retrait avant l'expiration des 30 jours calendaires.
- [ ] **Gestion propre des échecs** : Statut `failed` enregistré en base, messages d'erreurs explicites et sans jargon technique pour le donateur.
- [ ] **Isolation des secrets** : `SASPAY_SECRET_KEY` et `SUPABASE_SERVICE_ROLE_KEY` invisibles côté client.
- [ ] **Zéro Emoji** : Aucun emoji dans les retours d'API, les statuts ou les messages d'erreur.
