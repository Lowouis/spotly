<!-- Logo centré et réduit -->
<p align="center">
  <img src="./public/banner.png" alt="Spotly Logo" width="120" />
</p>

## À qui s'adresse Spotly ?

Spotly est destiné à toutes les organisations (entreprises, collectivités, établissements scolaires, associations...)
qui souhaitent gérer efficacement la réservation de ressources partagées: salles, équipements, véhicules, etc. Il est
particulièrement adapté aux structures multi-sites ou nécessitant une gestion fine des droits d’accès et de
l’authentification.

## Présentation

Spotly est une application web open source de gestion et de réservation de ressources. Elle permet de planifier,
réserver et suivre l’utilisation de tout type de ressource partagée, avec une interface moderne, responsive et des
fonctionnalités avancées (créneaux récurrents, gestion des droits, notifications, etc.).

L’objectif: simplifier la logistique interne, optimiser l’utilisation des ressources et offrir une expérience
utilisateur fluide, sur desktop comme sur mobile.

## Aperçu

![Capture d’écran Spotly](./docs/screenshot1.png)
![Capture d’écran réservation](./docs/screenshot2.png)

📺 **Démo vidéo complète sur YouTube**  
[Voir la chaîne YouTube Spotly](https://www.youtube.com/@ServiceSpotly)

## Fonctionnalités principales

- 📅 Réservation de ressources (salles, équipements, véhicules, etc.)
- 🔄 Créneaux récurrents et gestion avancée du calendrier
- 👥 Gestion des utilisateurs, rôles et droits d’accès
- 🏢 Multi-sites et multi-catégories
- 🔒 Authentification sécurisée (LDAP, SSO, local)
- 📱 Interface responsive (mobile & desktop)
- 📊 Statistiques d’utilisation
- 🔔 Notifications et rappels (email)

## Prérequis

- Node.js (v16+ recommandé)
- Next.js (v13+)
- Prisma (ORM)
- Base de données compatible (MySQL, PostgreSQL, MariaDB…)
- Serveur LDAP/SSO (optionnel, pour l’authentification d’entreprise)
- (Facultatif) Serveur SMTP pour l’envoi d’emails

## Installation rapide

1. Clonez le dépôt:
   ```bash
   git clone https://github.com/lowouis/spotly.git
   cd spotly
   npm install
   ```
2. Configurez vos variables d’environnement dans `.env.local` (voir exemple ci-dessous)
3. Initialisez la base de données:
   ```bash
   npx prisma db push
   ```
4. Lancez l’application:
   ```bash
   npm run dev
   ```

Exemple de fichier `.env.local`:
```bash
# Environnement
NODE_ENV="development"

# Base de données
DATABASE_URL="mysql://root:password@localhost:3306/spotly"

# Sécurité (clé secrète pour NextAuth)
AUTH_SECRET="ab7ec0bad16e38cdbe7c513a6b617a380d76a4024f57adcaeafa241af127117a"

# API Configuration
NEXT_PUBLIC_API_ENDPOINT="http://localhost:3000/spotly"
NEXT_PUBLIC_BASE_PATH="/spotly"
NEXTAUTH_URL="http://localhost:3000/spotly"
NEXT_PUBLIC_API_DOMAIN="spotly.example.local"

# SMTP Configuration (envoi d'emails)
NEXT_PUBLIC_EMAIL_USER="spotly@example.fr" // Adresse email expéditrice
NEXT_PUBLIC_SMTP_HOST="bluemind" // Nom du serveur SMTP
NEXT_PUBLIC_SMTP_PORT=25
NEXT_PUBLIC_SMTP_SECURE=false

# LDAP Configuration (authentification entreprise)
NEXT_PUBLIC_LDAP_DOMAIN="ldap://example.me.local"
NEXT_PUBLIC_LDAP_BASEDN="dc=example,dc=local"
NEXT_PUBLIC_LDAP_ADMIN_DN="CN=username,DC=example,DC=local"
NEXT_PUBLIC_LDAP_ADMIN_PASSWORD="password"

# Logs
LOGS_DIR="logs"

# SSO Configuration (Kerberos)
KERBEROS_REALM="EXAMPLE.LOCAL"
KERBEROS_SERVICE_NAME="HTTP"
KERBEROS_KEYTAB_PATH="/etc/krb5.keytab"
KERBEROS_PRINCIPAL="HTTP/sso.exemple.domain.local@EXAMPLE.LOCAL"
```

👉 **Pour une installation détaillée, consultez le manuel complet sur Authorea**  
[Manuel d’installation Spotly sur Authorea](https://www.authorea.com/spotly-manuel-install)

## Licence

Ce projet est distribué sous licence **GNU GPL v3**.  
Voir le fichier `LICENSE` pour plus d’informations.

## Auteur

Développé et maintenu par **Louis GURITA**.

- [GitHub](https://github.com/lowouis)
- [LinkedIn](https://www.linkedin.com/in/louisgurita/)
- Contact: louisguritapro@gmail.com

## Contribuer

Les contributions sont les bienvenues!  
Merci de lire le fichier `CONTRIBUTING.md` avant de proposer une pull request.
```



