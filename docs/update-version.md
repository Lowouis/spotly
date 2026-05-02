# Mise a jour apres pull d'une nouvelle version

Cette procedure decrit quoi faire quand une nouvelle version de Spotly est recuperee depuis Git.

## 1. Sauvegarder avant mise a jour

Avant toute mise a jour de production :

- sauvegarder la base MySQL ;
- sauvegarder les variables d'environnement ;
- verifier que l'on peut revenir a l'ancien commit ou a l'ancienne image Docker.

## 2. Recuperer le code

```bash
git fetch origin
git checkout main
git pull origin main
```

Ou pour une branche versionnee :

```bash
git checkout 2.0.0
git pull origin 2.0.0
```

## 3. Installer les dependances

```bash
npm ci
```

Utiliser `npm ci` plutot que `npm install` pour respecter `package-lock.json`.

## 4. Verifier les variables d'environnement

```bash
npm run validate-env
```

En production, les variables minimales sont :

- `DATABASE_URL`
- `AUTH_SECRET`
- `LDAP_ENCRYPTION_KEY`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_API_ENDPOINT`

Si la version ajoute de nouvelles variables, les renseigner avant le build.

## 5. Appliquer les migrations

```bash
npx prisma migrate status
npx prisma migrate deploy
```

Ne pas utiliser `prisma db push` sur une production reelle.

Exception : une base de demonstration vide et jetable peut etre recreee avec `db push`, mais ce n'est pas une procedure de production.

## 6. Regenerer Prisma

```bash
npx prisma generate
```

Le build le fait aussi, mais l'executer explicitement aide a detecter les erreurs plus tot.

## 7. Relancer les seeds si necessaire

Apres une mise a jour qui ajoute ou modifie des donnees de reference :

```bash
npm run seed:prod
```

Le seed production est idempotent pour les donnees minimales.

Ne pas lancer `npm run seed:demo` sur une production reelle.

## 8. Tester avant redemarrage final

```bash
npm run lint
npm test -- --runInBand
npm run build
```

Sur un serveur limite, `lint` et `test` peuvent etre faits en CI, mais `build` doit passer dans l'environnement cible.

## 9. Redemarrer l'application

Selon l'environnement :

```bash
npm run start
```

Ou redemarrer le service systemd, le conteneur Docker, PM2 ou Coolify.

Verifier aussi la planification cron systeme :

```bash
crontab -l
npm run "run cron"
npm run "run cron:daily"
```

Les commandes cron sont ponctuelles et ne doivent pas etre redemarrees comme un worker permanent.

## 10. Verification post-update

- Ouvrir la page d'accueil.
- Tester la connexion admin.
- Verifier `/admin`.
- Verifier une recherche de reservation.
- Verifier les endpoints e-mail si SMTP est configure.
- Verifier les logs applicatifs.
- Verifier que `npx prisma migrate status` indique que la base est a jour.

## Rollback

Si la mise a jour echoue avant migration :

```bash
git checkout <ancien-commit-ou-tag>
npm ci
npm run build
```

Si la migration a deja ete appliquee, restaurer la sauvegarde de base avant de revenir au code precedent, sauf si la migration est explicitement reversible.
