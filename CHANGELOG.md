# Changelog

## [2.0.0] - 2026-05-03

### Added

#### Administration

- Nouveau tableau de bord admin avec filtres par site, catégorie et période.
- Graphiques de suivi des réservations, statuts, ressources les plus utilisées et indicateurs de maintenance.
- Navigation admin modernisée avec sidebar, badges d'attente et bascule entre activité et maintenance.
- Nouvelles sections admin: maintenance, paramètres de réservation, configuration mail, niveaux de protection, paramètres généraux et page à propos.
- Import LDAP utilisateur depuis l'écran de configuration LDAP admin.
- Page À propos enrichie avec vérification de la dernière release GitHub et badge de disponibilité de mise à jour.

#### Assistant De Premier Lancement

- Nouveau guide `/setup` pour accompagner une première installation Spotly.
- Page de bienvenue avec logo Spotly animé et explication du produit.
- Vérification de la connexion base de données avant poursuite du guide.
- Configuration guidée et skippable SMTP, LDAP et SSO Kerberos.
- Modes de démarrage: nouvelle installation, données de démonstration ou mise à jour depuis Spotly 1.0.0.
- Génération sécurisée des identifiants administrateur pour les nouvelles installations.
- Mode développement permettant de relancer le guide depuis la page de connexion.

#### Réservations

- Nouvelle expérience de réservation avec recherche, listes retravaillées et parcours détaillé en étapes.
- Prise en charge anticipée configurable via `maxEarlyPickupMinutes`.
- Actions par code externe pour récupérer ou restituer une ressource.
- Gestion des réservations groupées avec validation ou refus de groupe.
- Signalement d'une récupération bloquée par une ressource non restituée.
- Helpers de modes de réservation: automatique, par clic et par code.

#### Maintenance

- Événements de ressource avec type, sévérité, période, description et impact sur la disponibilité.
- Incidents capables de rendre automatiquement une ressource indisponible puis de la réactiver à la clôture.
- Conversations liées aux événements de maintenance.
- Notification du responsable quand un problème est signalé sur une ressource.
- Détection des réservations impactées lors d'une indisponibilité de ressource.
- Option de notification préventive par mail aux utilisateurs impactés.
- Clôture immédiate des événements de maintenance avec archivage automatique de la discussion associée.

#### Messages Et Notifications

- Conversations pour les réservations et les événements de maintenance.
- Messages de réservation en remplacement des anciens commentaires.
- Centre de notifications avec lecture, suppression et compteur de non lus.
- Notifications pour messages non lus, conversations non lues, problèmes ressource, récupération bloquée et états de réservation.
- Nettoyage automatique des discussions inactives et archivage des conversations résolues via la cron.
- Déduplication journalière des notifications email avec `EmailNotificationLog`.

#### Favoris Et Accueil

- Favoris utilisateur pour sites et ressources.
- Accueil et listing enrichis avec accès rapide aux ressources favorites.
- Icônes personnalisables sur les catégories.

#### Emails

- Configuration fine des modèles d'emails activables ou désactivables.
- Nouveaux emails pour ressource indisponible, ressource remplacée, problème signalé et récupération bloquée.
- Support `CRON_SECRET` pour les envois email déclenchés par cron.
- Script `npm run test:mail:send` pour envoyer tous les modèles vers un mail catcher.
- Outillage `mailparser` pour les contrôles de compatibilité MIME.

#### LDAP Et Authentification

- Stack LDAP locale de développement avec utilisateurs de test seedés.
- Script `npm run seed:ldap` pour peupler l'annuaire LDAP local.
- Utilisateurs LDAP de test: `alice`, `karim`, `sophie`, `thomas`, `nadia` et `ldap.user`.
- Fallback d'authentification LDAP par `uid` en plus de `sAMAccountName`.
- Création automatique d'utilisateurs externes locaux après authentification LDAP réussie.

#### Données Et API

- Modèles Prisma pour favoris, notifications, messages, conversations, événements ressource, types d'événements, paramètres applicatifs et réglages de templates email.
- Migrations dédiées pour les nouveaux modèles et paramètres.
- Nouvelles API: `app-settings`, `favorites`, `notifications`, `resource-events`, `resource-event-types`, conversations, messages et action par code.
- API dashboard réécrite pour fournir des métriques filtrées compatibles avec les nouveaux écrans.
- API `timeScheduleOptions` enrichie avec horaires de raccourcis, jour de fin de semaine et prise en charge anticipée.
- APIs setup dédiées pour statut, vérification DB, configuration SMTP/LDAP/SSO, finalisation et reset développement.
- API GitHub de vérification de la dernière release disponible.

#### Interface

- Migration importante de l'UI vers des composants Radix/shadcn internes.
- Composants UI réutilisables: boutons, cartes, dialogues, sélecteurs, calendrier, tableaux, graphiques, badges, tooltips et toasts.

### Changed

- Refonte visuelle des menus, modales, formulaires, tableaux, login, footer et thème sombre.
- Remplacement du système de toast HeroUI par une solution interne.
- Alignement du guide `/setup` avec le style de l'espace utilisateur.
- Utilisation centralisée de `public/favicon.svg` pour le logo dans la navigation, le setup et les écrans de chargement.
- Suppression des anciennes sections admin peu utiles ou redondantes comme logs et général.
- Amélioration des templates mail existants.
- Génération d'emails HTML-only `7bit` plus sûre pour les clients mail problématiques.
- Suppression des images CID dans les emails pour éviter les rendus multipart cassés.
- Normalisation des sujets d'email avec des en-têtes compatibles ASCII.
- Déplacement des rappels de retard vers une logique compatible scheduler avec déduplication quotidienne.
- Gestion visuelle automatique des réservations `FLUENT` en cours ou terminées.
- Alignement de la stack Docker locale avec MySQL de production.
- Installation Vercel passée à `npm ci` pour des releases reproductibles.
- Validation de production ajoutée pour `NEXTAUTH_URL` et `NEXT_PUBLIC_API_ENDPOINT`.
- Passage de la version npm de `1.1.0` à `2.0.0`.

### Fixed

- Correction de l'affichage de statut pour les ressources automatiques ou sans protection.
- Correction des couleurs du stepper pour les étapes actives.
- Correction de l'authentification LDAP quand l'attribut utilisateur est `uid`.
- Correction du workflow local d'import et de vérification des utilisateurs LDAP.
- Correction des emails affichant les frontières MIME ou du quoted-printable dans le corps du message.
- Correction des accents cassés dans les emails reçus.
- Correction des sorties `undefined` et `[object Object]` dans les templates email.
- Correction du mauvais transport Nodemailer utilisé par certains endpoints de notification ressource.
- Correction des échecs de seed MySQL liés aux champs historiques manquants `pickable`, `entry`, LDAP, SMTP, Kerberos et schedule-option.
- Correction du chemin du seed de production et prévention de la création du compte par défaut `admin/admin` en production.
- Correction des appels email cron vers des endpoints authentifiés quand `CRON_SECRET` est configuré.
- Correction de l'accès public à `favicon.svg` dans le middleware pour éviter les logos cassés avant authentification.
- Correction des contrôles factices grille/liste/filtres/tri dans les résultats de recherche.

### Security

- Helpers de sécurité API partagés: `requireAuth`, `requireAdmin`, contrôles de rôles, contrôles de propriété et rate limiting mémoire.
- Restriction du middleware API: `/api` n'est plus globalement public.
- Réponses JSON `401` pour les appels API non authentifiés.
- Restriction CORS aux origines de confiance.
- Validation serveur du ticket Kerberos au lieu de faire confiance au nom utilisateur fourni par le client.
- Validation serveur des payloads d'envoi email.
- Protection des endpoints sensibles par authentification et rôles admin.
- Verrouillage des endpoints SMTP, LDAP, SSO, utilisateurs, upload, logs, mail, authorized-location et resource-notification.
- Rate limiting sur login, inscription, envoi mail et tests SMTP/mail.
- Désactivation de l'exposition publique de la configuration Kerberos.
- Désactivation des tickets Kerberos de test en production.
- Suppression des hashes de mots de passe et champs internes des réponses SSO/auth et des merges de session token.
- Réduction des données sensibles retournées par les contrôles d'authorized-location.
- Réduction des détails d'erreur sur les endpoints sensibles hors développement.
- Sécurisation du seed de production avec identifiants admin explicites via variables d'environnement.
- Audit des dépendances npm, mise à jour des dépendances vulnérables directes et suppression des alertes critiques/hautes.

### Tests Et Documentation

- Scénarios e2e admin CRUD.
- Tests API client, providers, mailer, rendu MIME/email, LDAP, modes de réservation, autorisation API, CORS et rate-limit.
- Documentations opérationnelles: Docker, mail, notifications et refactor.
- Validation avec `npx prisma migrate status`, `npx prisma migrate deploy`, `npm run seed`, `npm run seed:demo`, `npm run lint`, `npm test -- --runInBand`, `npm run build` et `npm run test:mail:send`.

### Migration

- Vérification de compatibilité avec la branche `1.0.0-stable`.
- Mise à jour depuis Spotly 1.0.0 conservant les données existantes et complétant uniquement la configuration système manquante.

### Nettoyage Technique

- Retrait massif de dépendances HeroUI au profit de Radix, Recharts, Lucide, Sonner et utilitaires Tailwind.
- Suppression de composants obsolètes: ancien banner, ancien date picker compatible, test select et anciennes API logs/upload banner.
- Mise à jour du favicon, du logo et de l'image banner.
