# RÈGLE : ANTI-OVERENGINEERING POUR DONKAI

## 1. Principe Fondamental
La solution la plus simple qui résout rigoureusement le problème est systématiquement la meilleure.
Chaque ligne de code supplémentaire représente une dette technique et une surface d'attaque potentielle.

---

## 2. Interdictions Spécifiques Donkai
- **Abstractions prématurées** : Ne pas créer de micro-services, de bus d'événements complexes ou de multi-couches d'indirection pour des besoins couverts par des requêtes Supabase directes et des Edge Functions ciblées.
- **Ajout de dépendances superflues** : Ne pas importer de bibliothèques tierces lourdes pour des calculs simples (frais de 5% + 100 FCFA, formatage de dates, calculs de pourcentage de collecte).
- **Multiplication d'états globaux** : Privilégier le state local React ou le contexte existant sans introduire de gestionnaires de store lourds (Redux, MobX, etc.).
- **Composants génériques artificiels** : Ne pas coder de wrappers abstraits pour un composant n'ayant qu'un seul usage dans l'application.
- **Complexification de l'infrastructure** : S'en tenir à l'architecture déclarée (Vite + Vercel pour le front, Supabase Edge Functions pour le back, SasPay pour les paiements).

---

## 3. Matrice de Décision
Avant toute modification ou ajout :
```text
Est-ce strictement nécessaire ?
  ↓
Existe-t-il une solution plus simple avec les outils déjà installés ?
  ↓
Quel est l'impact sur le bundle et la vitesse de chargement sur smartphone 3G/4G ?
```
Si l'utilité n'est pas démontrée : **ne pas implémenter**.
