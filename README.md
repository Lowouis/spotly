<!-- Logo centré et réduit -->
<p align="center">
  <img src="./public/banner.png" alt="Spotly Logo" width="120" />
</p>


<div align="center">

[🇫🇷Français](#-français) | [🇬🇧English](#-english)

</div>

---

## 🇫🇷 Français

### À qui s'adresse Spotly ?

Spotly est destiné à toutes les organisations (entreprises, collectivités, établissements scolaires, associations...)
qui souhaitent gérer efficacement la réservation de ressources partagées : salles, équipements, véhicules, etc.  
Il est particulièrement adapté aux structures multi-sites ou nécessitant une gestion fine des droits d’accès et de
l’authentification.

### Présentation

Spotly est une application web open source de gestion et de réservation de ressources.  
Elle permet de planifier, réserver et suivre l’utilisation de tout type de ressource partagée, avec une interface
moderne, responsive et des fonctionnalités avancées (créneaux récurrents, gestion des droits, notifications, etc.).

L’objectif : simplifier la logistique interne, optimiser l’utilisation des ressources et offrir une expérience
utilisateur fluide, sur desktop comme sur mobile.

### Aperçu

📺 **[Démo en ligne](https://spotly-ruby.vercel.app) (fonctionnalités limitées)**

### Fonctionnalités principales

- 📅 Réservation de ressources (salles, équipements, véhicules, etc.)
- 🔄 Créneaux récurrents (quotidiens, hebdomadaires)
- 👥 Gestion des utilisateurs, rôles et droits d’accès
- 🏢 Multi-sites et multi-catégories avec une forte granularité
- 🔒 Authentification sécurisée (LDAP, SSO, local)
- 📱 Interface responsive (mobile & desktop)
- 📊 Statistiques d’utilisation
- 🔔 Notifications et rappels (email)

### Prérequis

- Node.js (v20+ recommandé)
- Next.js (v15+)
- Prisma (ORM)
- Base de données compatible (MySQL, PostgreSQL, MariaDB…)
- Serveur LDAP/SSO (optionnel, pour l’intégration en entreprise)
- Serveur SMTP pour l’envoi d’emails (optionnel mais recommandé)

### Installation rapide (développement)

```bash
git clone https://github.com/lowouis/spotly.git
cd spotly
npm install
```

Configurez vos variables d’environnement dans `.env.local` & `.env` en copiant les fichiers `.env.local.template` &
`.env.template`.

```bash
npx prisma db push
npm run dev
```

👉 **Pour une installation détaillée, consultez le manuel complet dans `docs/deployment.pdf`**

### Licence

Ce projet est distribué sous licence **GNU GPL v3**.  
Voir le fichier `LICENSE` pour plus d’informations.

### Auteur

Développé et maintenu par **Louis GURITA** :

- [GitHub](https://github.com/lowouis)
- [LinkedIn](https://www.linkedin.com/in/louisgurita/)
- Contact: louisguritapro@gmail.com

### Contribuer

Les contributions sont les bienvenues !  
Merci de lire le fichier `CONTRIBUTING.md` avant de proposer une pull request.

---

## 🇬🇧 English

### Who is Spotly for?

Spotly is designed for all kinds of organizations (companies, public bodies, schools, nonprofits, etc.) that want to
efficiently manage bookings for shared resources such as rooms, equipment, vehicles, and more.  
It is especially well-suited to multi-site structures or teams that require fine-grained access control and
authentication.

### Overview

Spotly is an open-source web app for managing and booking resources.  
It lets you schedule, reserve, and track usage for any type of shared resource, with a modern, responsive interface and
advanced features (recurring time slots, access control, notifications, etc.).

The goal: streamline internal logistics, optimize resource utilization, and deliver a smooth user experience on both
desktop and mobile.

### Preview

📺 **[Live demo](https://spotly-ruby.vercel.app) (feature-limited)**

### Key Features

- 📅 Resource booking (rooms, equipment, vehicles, etc.)
- 🔄 Recurring slots (daily, weekly)
- 👥 User, role, and permission management
- 🏢 Multi-site and multi-category with strong granularity
- 🔒 Secure authentication (LDAP, SSO, local)
- 📱 Responsive interface (mobile & desktop)
- 📊 Usage statistics
- 🔔 Notifications and reminders (email)

### Prerequisites

- Node.js (v20+ recommended)
- Next.js (v15+)
- Prisma (ORM)
- Compatible database (MySQL, PostgreSQL, MariaDB…)
- LDAP/SSO server (optional, for enterprise integration)
- SMTP server for sending emails (optional but recommended)

### Quick Setup (development)

```bash
git clone https://github.com/lowouis/spotly.git
cd spotly
npm install
```

Configure your environment variables in `.env.local` & `.env` by duplicating the `.env.local.template` & `.env.template`
files.

```bash
npx prisma db push
npm run dev
```

👉 **For a detailed setup, see the full manual in `docs/deployment.pdf`**

### License

This project is distributed under the **GNU GPL v3** license.  
See the `LICENSE` file for more information.

### Author

Developed and maintained by **Louis GURITA**:

- [GitHub](https://github.com/lowouis)
- [LinkedIn](https://www.linkedin.com/in/louisgurita/)
- Contact: louisguritapro@gmail.com

### Contributing

Contributions are welcome!  
Please read the `CONTRIBUTING.md` file before opening a pull request.
