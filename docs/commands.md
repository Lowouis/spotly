# Commandes utiles

## Installation

```bash
npm ci
```

Utiliser `npm ci` pour une installation reproductible depuis `package-lock.json`.

## Developpement local

```bash
npm run dev
```

Lance l'application sur `http://localhost:3001`.

```bash
npm run dev-turbo
```

Lance Next.js avec Turbopack sur le port `3001`.

## Base de donnees

```bash
npx prisma generate
```

Regenerer le client Prisma apres modification du schema.

```bash
npx prisma migrate deploy
```

Appliquer les migrations existantes. A utiliser en production.

```bash
npx prisma migrate status
```

Verifier l'etat des migrations.

```bash
npm run seed
```

Initialise les donnees minimales locales : admin local, types de ressource, options horaires.

```bash
npm run seed:demo
```

Ajoute les donnees de demonstration : utilisateurs, sites, categories, ressources et reservations fictives.

```bash
npm run seed:prod
```

Initialise une production avec admin configure par variables d'environnement, types de ressource et options horaires.

Variables requises : `SEED_ADMIN_EMAIL`, `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`.

## LDAP local

```bash
docker compose up -d ldap phpldapadmin
```

Lance les services LDAP locaux.

```bash
npm run seed:ldap
```

Injecte les utilisateurs LDAP de demonstration dans le conteneur local.

## Verifications

```bash
npm run lint
```

Lance ESLint.

```bash
npm test -- --runInBand
```

Lance les tests Jest en serie.

```bash
npm run build
```

Valide les variables d'environnement, genere Prisma et construit l'application.

```bash
npm run check
```

Lance validation d'environnement, tests et build.

## Tests e-mail

```bash
npm run test:mail:send
```

Envoie tous les templates vers le destinataire de smoke test. Utiliser seulement avec un SMTP/catcher de test.

## Cron systeme

```bash
npm run "run cron"
npm run "run cron:daily"
npm run "run cron:all"
```

`run cron` execute le cycle principal, `run cron:daily` execute l'alerte quotidienne de retard, et `run cron:all` execute les deux pour un lancement manuel. Chaque commande execute une passe ponctuelle puis quitte. A planifier avec le cron systeme, pas comme processus permanent.

Exemple crontab :

```bash
*/30 * * * * cd /path/to/spotly && npm run "run cron"
0 7 * * * cd /path/to/spotly && npm run "run cron:daily"
```

Utiliser le chemin absolu du dossier de deploiement et verifier que l'environnement charge par cron contient les variables requises (`DATABASE_URL`, `NEXT_PUBLIC_API_ENDPOINT`, etc.).

## Deploiement Vercel manuel

```bash
npx vercel --prod --yes
```

Deploie l'etat local courant sur Vercel. Un commit/push n'est pas requis pour ce mode, mais reste necessaire pour les deploiements automatiques Git.
