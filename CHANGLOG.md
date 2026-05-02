# CHANGLOG

## Version 2.0.0

### Administration
- Nouveau tableau de bord admin avec filtres par site, catégorie et période.
- Ajout de graphiques de suivi des réservations, statuts, ressources les plus utilisées et indicateurs de maintenance.
- Nouvelle navigation admin avec sidebar modernisée, badges d'attente et bascule entre vue activité et vue maintenance.
- Nouvelles sections admin: maintenance, paramètres de réservation, configuration mail, niveaux de protection, paramètres généraux et page à propos.
- Suppression des anciennes sections admin peu utiles ou redondantes comme logs et général.

### Réservations
- Nouvelle expérience de réservation avec recherche et listes retravaillées.
- Nouveau parcours de détail réservation en étapes: création, confirmation, prise en charge, restitution.
- Gestion de la prise en charge anticipée via `maxEarlyPickupMinutes`.
- Ajout d'une action par code externe pour récupérer ou restituer une ressource.
- Meilleure gestion des réservations groupées avec validation/refus de groupe.
- Signalement possible quand une récupération est bloquée par une ressource non restituée.

### Maintenance Et Incidents
- Ajout des événements de ressource avec type, sévérité, période, description et impact sur la disponibilité.
- Les incidents peuvent rendre automatiquement une ressource indisponible puis la réactiver à leur clôture.
- Ajout de conversations liées aux événements de maintenance.
- Notification du responsable quand un problème est signalé sur une ressource.

### Messages Et Notifications
- Nouveau système de conversations pour les réservations et les événements de maintenance.
- Ajout des messages de réservation à la place des simples commentaires historiques.
- Nouveau centre de notifications avec lecture, suppression et compteur de non lus.
- Notifications ajoutées pour messages non lus, conversations non lues, problèmes ressource, récupération bloquée et états de réservation.
- Nettoyage automatique des discussions inactives et archivage automatique des conversations résolues via la cron.

### Favoris Et Accueil
- Ajout des favoris utilisateur pour sites et ressources.
- Accueil et listing enrichis avec accès plus rapide aux ressources favorites.
- Ajout d'icônes personnalisables sur les catégories.

### Emails
- Configuration fine des modèles d'emails activables/désactivables.
- Nouveaux emails pour ressource indisponible, ressource remplacée, problème signalé et récupération bloquée.
- Déduplication journalière de certaines notifications email pour éviter le spam.
- Amélioration des templates mail existants.

### SSO, Sécurité Et Localisation
- Amélioration des routes Kerberos/SSO et de la sauvegarde de configuration.
- Vérifications d'accès renforcées sur plusieurs API admin.
- Centralisation de certains contrôles de prise en charge et d'autorisation IP.

### Données Et API
- Extension Prisma avec favoris, notifications, messages, conversations, événements ressource, types d'événements, paramètres applicatifs et réglages de templates email.
- Ajout de migrations dédiées pour les nouveaux modèles et paramètres.
- Nouvelles API: `app-settings`, `favorites`, `notifications`, `resource-events`, `resource-event-types`, conversations, messages et action par code.
- API dashboard réécrite pour fournir des métriques filtrées et compatibles avec les nouveaux écrans.
- API `timeScheduleOptions` enrichie avec horaires de raccourcis, jour de fin de semaine et prise en charge anticipée.

### Interface Et Design System
- Migration importante de l'UI vers des composants Radix/shadcn internes.
- Ajout de composants UI réutilisables: boutons, cartes, dialogues, sélecteurs, calendrier, tableaux, graphiques, badges, tooltips et toasts.
- Refonte visuelle des menus, modales, formulaires, tableaux, login, footer et thème sombre.
- Remplacement du système de toast HeroUI par une solution interne.

### Tests Et Documentation
- Ajout de scénarios e2e admin CRUD.
- Mise à jour des tests API client, providers et mailer.
- Ajout de documentations opérationnelles: Docker, mail, notifications et refactor.

### Nettoyage Technique
- Passage de la version npm de `1.1.0` à `2.0.0`.
- Retrait massif de dépendances HeroUI au profit de Radix, Recharts, Lucide, Sonner et utilitaires Tailwind.
- Suppression de composants obsolètes: ancien banner, ancien date picker compatible, test select et anciennes API logs/upload banner.
- Mise à jour du favicon, du logo et de l'image banner.
