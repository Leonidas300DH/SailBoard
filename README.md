# SailBoard

Application publique et responsive de suivi des courses de voile, conçue pour OpenAI Sites et Cloudflare D1.

## Fonctionnalités V1

- saisons, événements et manches ;
- flotte, participants et équipages propres à chaque course ;
- éditeur de parcours tactile sur fond aérien IGN avec versions publiées immuables ;
- résultats, pénalités et points individuels ;
- barèmes versionnés : positions, statuts, participation, départage et attribution individuelle ;
- profils et classements publics par bateau ou participant ;
- administration protégée par Sign in with ChatGPT, avec demandes d’accès, rôles et audit.

La V1 n’enregistre aucune position GPS en direct. Les parcours sont des GeoJSON ; le modèle peut être complété plus tard par des traces et événements de course.

## Développement

Prérequis : Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Le serveur local utilise le binding D1 `DB` déclaré dans `.openai/hosting.json` et crée des données de démonstration au premier démarrage. Hors production, `/admin` utilise l’identité locale `owner@sailboard.local`.

## Variables de production

```text
INITIAL_ADMIN_EMAIL=adresse-du-proprietaire@example.com
```

Cette adresse devient l’owner initial. Tous les autres comptes ChatGPT connectés doivent demander un accès puis être acceptés par cet owner.

## Commandes de contrôle

```bash
npm run db:generate   # génère une migration Drizzle
npm run lint          # lint TypeScript et React
npm test              # build de production + tests métier et contrats de sécurité
```

Les mutations d’administration sont contrôlées côté serveur. La finalisation d’un classement utilise un batch D1 transactionnel et conserve la configuration de points dans chaque résultat.
