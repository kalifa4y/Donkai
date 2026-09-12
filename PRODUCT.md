# DONKAI — Cadrage Produit (PRODUCT.md)

## 1. Vision & Proposition de Valeur
DONKAI est une plateforme moderne, rapide, sécurisée et mobile-first permettant à tout créateur, artiste, streamer, association, ONG ou porteur de projet en Afrique de l'Ouest (marché initial : Mali / Afrique de l'Ouest) de créer des collectes à objectifs précis et de recevoir directement le soutien financier de sa communauté.

**Positionnement :**
> "Créer, partager, recevoir le soutien de votre communauté."

DONKAI n'est pas un simple bouton de pourboire ou générateur de lien de paiement brut : c'est un écosystème complet de collecte communautaire avec gestion multi-objectifs, suivi de progression en temps réel, gestion des bénéficiaires et retraits sécurisés par Mobile Money.

---

## 2. Public Cible
1. **Créateurs digitaux & Influenceurs** (TikTokers, créateurs YouTube, streamers, podcasteurs).
2. **Artistes & Musiciens** (financement de clips, albums, concerts, matériel de production).
3. **Associations & ONG locales** (projets caritatifs, aide médicale, accès à l'eau, éducation).
4. **Porteurs de projets communautaires & Particuliers** ayant un objectif légitime et vérifiable.

---

## 3. Principes Fondamentaux de l'Expérience Utilisateur
- **Simplicité radicale :** Compréhension instantanée de la valeur en moins de 5 secondes.
- **Zéro friction pour le donateur :** Le donateur **n'a jamais besoin de créer de compte**. Parcours de don en moins de 45 secondes (sélection du montant, mot d'encouragement facultatif, anonymat au choix, paiement Mobile Money natif, confirmation immédiate).
- **Zéro jargon technique dans les espaces publics :** Bannissement total des acronymes ou termes d'infrastructure (API, webhook, PostgreSQL, agrégateur...) dans les textes marketing et l'interface utilisateur.
- **Transparence tarifaire absolue :** Aucun frais caché. Pas de frais affichés sur la landing page marketing, mais affichage limpide (Brut / Frais / Net) lors de la création d'une collecte et sur le tableau de bord.
- **Modèle économique validé :** 5% de commission plateforme + 100 FCFA par contribution, déduits du montant reçu. Aucun frais supplémentaire au retrait.

---

## 4. Fonctionnalités Clés & Flux Fonctionnels

### 4.1 Collectes Multi-objectifs & Routage Indépendant
- Chaque utilisateur vérifié peut créer plusieurs collectes indépendantes.
- Durée maximale d'une collecte : 2 ans.
- URL unique et propre par collecte : `/@username/:slug` (ex : `/@kalifa/eau-pour-gao`).
- URL de profil organisateur : `/@username` (présentation, bio, badge de confiance, liste des collectes actives).
- Routage indépendant du nom de domaine pour garantir la pérennité des partages.

### 4.2 Gestion des Bénéficiaires
- **Collecte pour soi-même :** L'organisateur est le bénéficiaire direct.
- **Collecte pour un tiers :** L'organisateur invite le bénéficiaire via email/coordonnées. Le bénéficiaire revendique son compte et configure son identité et son numéro de réception. L'organisateur ne peut en aucun cas détourner les fonds.

### 4.3 Retraits & Verrou de Sécurité 30 Jours
- Les fonds s'accumulent au fil des dons confirmés.
- Le bénéficiaire déclenche manuellement ses demandes de retrait dès le solde minimal atteint.
- **Règle absolue de sécurité (Anti-fraude) :** Tout changement du numéro Mobile Money de réception bloque toute nouvelle modification pendant **30 jours révolus**. Une alerte de sécurité explicite est affichée sur le profil et le tableau de bord.

### 4.4 Système de Confiance & Vérification (KYC)
- Seuil de vérification renforcée déclenchée dès **500 000 FCFA** collectés (ou plus tôt en cas de signaux d'alerte, volume anormal ou signalements répétés).
- Niveaux de confiance internes : `non vérifié`, `vérification en cours`, `profil vérifié`, `surveillance`, `restreint`, `suspendu`.
- Jamais de mention trompeuse "garanti par Donkai", mais des badges factuels "Identité vérifiée" ou "Profil vérifié".

### 4.5 Modération & Signalements
- Tout visiteur peut signaler une collecte ou un profil (motif, description, éléments probants).
- Règle de déclenchement : **3 signalements crédibles déclenchent automatiquement une revue humaine** et un blocage préventif des retraits en cours d'analyse.
- Procédure de réexamen et contestation claire pour l'organisateur.

### 4.6 Internationalisation & SEO
- Bilinguisme natif : Français (défaut) et Anglais avec bascule volontaire.
- SEO technique de haut niveau : métadonnées dynamiques Open Graph / Twitter Card pour chaque collecte, balisage Schema.org, sitemap et robots.txt.
