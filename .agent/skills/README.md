# SKILLS DU SYSTÈME OPÉRATIONNEL DONKAI

Ce répertoire répertorie et documente l'usage des compétences d'ingénierie mobilisées par les workflows spécialisés de Donkai.

## Cartographie des Compétences par Workflow

| Workflow | Skills Principaux | Rôle Technique |
| :--- | :--- | :--- |
| `payment` | `mobile-money-gateway`, `security-review`, `tdd-workflow` | Intégration SasPay, Orange Money, Wave, Moov, HMAC, idempotence |
| `web-app` | `design-system`, `tdd-workflow`, `quality-gate-audit` | Composants React 19, Tailwind v4, formulaires, routes |
| `backend-api` | `backend-patterns`, `api-design`, `security-review` | Supabase Edge Functions (Deno), triggers SQL, RLS |
| `ui-design` | `design-system`, `quality-gate-audit` | Typographies `Cal Sans`/`Google Sans Flex`, palette tellurique |
| `security-audit` | `security-review`, `review-security`, `quality-gate-audit` | RLS Supabase, audit de secrets, conformité fintech |
| `debugging` | `diagnosing-bugs`, `error-handling`, `quality-gate-audit` | Diagnostic cause racine, traçage des webhooks et sessions |
| `refactoring` | `orch-refine-code`, `codebase-design`, `quality-gate-audit` | Simplification de code et maintien de la maintenabilité |

## Principe d'Exécution
Les compétences sont chargées de manière ciblée selon le workflow actif pour respecter le principe de gestion de contexte (zéro surcharge).
