# SailBoard

Application web responsive de gestion et de suivi des courses de voile. Le produit public privilégie une navigation cartographique interactive ; l’administration couvre les saisons, courses, parcours, bateaux, équipages, résultats et barèmes versionnés.

## Socle technique

- Next.js App Router et TypeScript, déployés sur Vercel ;
- PostgreSQL Neon Free, accessible avec le pilote PostgreSQL standard `pg` ;
- Drizzle pour le schéma et les migrations versionnées ;
- Better Auth auto-hébergé avec Google OAuth ;
- MapLibre pour les parcours et la carte globale.

Supabase, OpenAI Sites, Cloudflare D1 et Sign in with ChatGPT ne font pas partie de cette architecture.

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
