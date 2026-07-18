# SailBoard

Application web responsive de gestion et de suivi du World Diam Tour. Le produit distingue les saisons, les étapes du circuit et les courses ou manches disputées dans chaque étape. L’administration couvre les bateaux, les équipages, les navigateurs, les résultats et les barèmes versionnés.

## Socle technique

- Next.js App Router et TypeScript, déployés sur Vercel ;
- PostgreSQL Neon Free, accessible avec le pilote PostgreSQL standard `pg` ;
- Drizzle pour le schéma et les migrations versionnées ;
- Better Auth auto-hébergé avec Google OAuth ;
- MapLibre pour les parcours, le calendrier territorial et les replays animés ;
- Open-Meteo pour reconstituer sans clé les conditions météo et marines d’une course.

Supabase, OpenAI Sites, Cloudflare D1 et Sign in with ChatGPT ne font pas partie de cette architecture.

## Expérience publique

L’accueil « Season Ocean » relie les six étapes du World Diam Tour France 2026 sur une carte satellite de la façade Atlantique. La timeline distingue les quatre étapes disputées des deux rendez-vous à venir, pilote le zoom cartographique et reste visible sur tous les écrans publics. La fiche course synchronise plan d’eau, météo du jour, classement et rail concurrent sans inventer de parcours ou de données GPS.

La page `/classements` publie deux classements provisoires calculés depuis PostgreSQL : le classement des équipages additionne les points de championnat et favorise le total le plus bas ; le classement individuel des navigateurs additionne les points et favorise le total le plus élevé. `Classement WDT 2026.xlsx` reste la source officielle importée et la copie JSON sert uniquement de repli si la base est indisponible. Les résultats des étapes de septembre et octobre restent vides tant qu’ils ne sont pas publiés.

Les conditions du jour sont demandées côté serveur à Open-Meteo puis mises en cache pendant 24 heures. Elles utilisent les modèles météo et marine disponibles pour la position et l’horaire de la course. Ce sont des données modélisées destinées à la lecture sportive et non à la navigation. Une valeur de démonstration explicite prend le relais si le fournisseur est indisponible.

## Développement local

Prérequis : Node.js `>=22.13.0`.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Sans variables d’environnement, les écrans publics utilisent un jeu de démonstration et `/admin` emploie un owner local. En production, aucune identité de secours n’est activée.

## Base de données et authentification

Créer une base PostgreSQL Neon, renseigner `DATABASE_URL`, puis appliquer les deux migrations :

```bash
npm run db:migrate
npm run auth:migrate
```

La première commande crée le domaine SailBoard. La seconde crée les tables Better Auth (`user`, `session`, `account`, `verification`) dans la même base PostgreSQL.

Pour initialiser ou actualiser la saison WDT 2026 depuis le classeur officiel :

```bash
npm run db:migrate:local
npm run db:import:wdt-2026
npm run db:verify:wdt-2026
```

L’import est transactionnel et relançable sans doublon. Il enregistre la saison, ses six étapes, les neuf équipages, les 43 navigateurs, les points de championnat par étape, les compositions d’équipage pouvant être établies sans ambiguïté et une empreinte SHA-256 de la source. Une nouvelle version du classeur crée une nouvelle trace d’import ; un réimport identique actualise la trace existante.

Créer ensuite un client Google OAuth de type application web avec ces URI de redirection :

```text
http://localhost:3000/api/auth/callback/google
https://votre-domaine.vercel.app/api/auth/callback/google
```

Les variables requises sont documentées dans `.env.example`. `INITIAL_ADMIN_EMAIL` désigne l’owner initial. Un autre utilisateur connecté peut demander un accès, mais ne possède aucun droit d’écriture tant que l’owner ne l’a pas accepté. Les rôles applicatifs restent stockés dans `admins` et toutes les mutations sensibles sont auditées.

## Contrôles

```bash
npm run lint
npm test
npm run build
```

Les mutations d’administration vérifient l’identité et le rôle côté serveur. La finalisation d’un résultat et les instantanés de points utilisent une transaction PostgreSQL unique.

## Notes produit

- [`docs/replay-data-model.md`](docs/replay-data-model.md) décrit les données nécessaires aux trois niveaux de replay, de la simulation à la trace GPS.
- [`docs/domain-language-wdt.md`](docs/domain-language-wdt.md) fixe le vocabulaire métier : étapes, manches, bateaux, équipages et navigateurs.
- [`docs/reference-season-circuit.md`](docs/reference-season-circuit.md) conserve la référence du calendrier et les décisions de traduction visuelle SailBoard.
- [`docs/reference-wdt-2026-individual-standings.md`](docs/reference-wdt-2026-individual-standings.md) documente le classement individuel provisoire après quatre étapes et ses anomalies de source.
