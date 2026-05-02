# Mise en production complete

Cette procedure vise un environnement complet, pas une simple demo Vercel.

## Architecture recommandee

- Application Next.js Spotly.
- Base MySQL ou MariaDB persistante.
- Annuaire LDAP accessible par l'application.
- SSO Kerberos si l'infrastructure le permet.
- SMTP externe pour l'envoi d'e-mails.
- Cron systeme executant les taches planifiees Spotly.
- Reverse proxy HTTPS : Nginx, Traefik ou Caddy.

Pour un deploiement Docker complet, un VPS avec Docker Compose ou Coolify est plus adapte que Vercel.

## Variables d'environnement minimales

```bash
NODE_ENV=production
DATABASE_PROVIDER=mysql
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/spotly
AUTH_SECRET=CHANGE_ME_LONG_RANDOM_SECRET
LDAP_ENCRYPTION_KEY=CHANGE_ME_LONG_RANDOM_SECRET
NEXTAUTH_URL=https://spotly.example.com
NEXT_PUBLIC_API_ENDPOINT=https://spotly.example.com
NEXT_PUBLIC_API_DOMAIN=spotly.example.com
```

Si une tache planifiee appelle des endpoints internes :

```bash
CRON_SECRET=CHANGE_ME_LONG_RANDOM_SECRET
```

Pour le seed production :

```bash
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=CHANGE_ME_AT_LEAST_12_CHARS
SEED_ADMIN_NAME=Admin
SEED_ADMIN_SURNAME=Spotly
```

## Base de donnees

Creer une base vide `spotly`, puis appliquer les migrations :

```bash
npx prisma migrate deploy
npx prisma generate
```

Initialiser les donnees minimales :

```bash
npm run seed:prod
```

Le seed production cree ou met a jour uniquement :

- le compte administrateur configure par variables d'environnement ;
- les types de ressource ;
- les options horaires par defaut.

Ne pas executer `npm run seed:demo` en production reelle.

## LDAP

La configuration LDAP effective est stockee en base via l'interface d'administration et chiffree avec `LDAP_ENCRYPTION_KEY`.

Recommandations :

- Utiliser `ldaps://` en production.
- Eviter les credentials LDAP en clair dans des fichiers versionnes.
- Tester la connexion depuis l'interface admin apres deploiement.
- Importer les utilisateurs LDAP depuis l'ecran admin si necessaire.

## SSO Kerberos

Kerberos necessite generalement :

- acces reseau au domaine ;
- configuration systeme compatible ;
- keytab ou service principal ;
- runtime capable d'utiliser les bibliotheques Kerberos natives.

Ce mode est rarement adapte au serverless pur. Preferer un serveur ou conteneur long-running si le SSO Kerberos est requis.

Les tickets de test sont refuses en production.

## SMTP

Configurer SMTP depuis l'interface admin.

Recommandations :

- Utiliser un fournisseur SMTP externe : Brevo, Postmark, Mailgun, SendGrid, OVH SMTP, etc.
- Configurer SPF, DKIM et DMARC pour le domaine d'envoi.
- Eviter d'heberger un SMTP sortant soi-meme sauf expertise deliverability.

## Cron et taches planifiees

Le script `scripts/cron.mjs` assure :

- le passage automatique de certaines reservations `ACCEPTED` vers `USED` ;
- le passage automatique des reservations `FLUENT` terminees vers `ENDED` ;
- l'envoi quotidien des alertes de retard.

Sur un VPS ou un serveur avec cron systeme :

```bash
crontab -e

*/30 * * * * cd /path/to/spotly && npm run "run cron"
0 7 * * * cd /path/to/spotly && npm run "run cron:daily"
```

Les commandes cron sont ponctuelles : elles executent leur traitement puis quittent. Ne pas les lancer comme worker permanent avec PM2/systemd.

Sur une plateforme serverless, transformer ces traitements en routes cron protegees par `CRON_SECRET`.

## Deploiement applicatif

```bash
npm ci
npm run build
npm run start
```

En Docker, lancer l'application derriere un reverse proxy HTTPS.

## Verification post-deploiement

- Ouvrir `/login`.
- Se connecter avec l'admin seed.
- Verifier l'acces `/admin`.
- Configurer SMTP et envoyer un e-mail de test.
- Configurer LDAP et tester la connexion.
- Importer les utilisateurs LDAP si besoin.
- Creer une reservation de test.
- Verifier les logs applicatifs et cron.
