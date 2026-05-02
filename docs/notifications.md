# Audit des notifications

Ce document recense les notifications internes affichees dans Spotly. Elles sont stockees dans le modele Prisma `notification` et exposees par `pages/api/notifications.js`.

## Fonctionnement general

- Le menu charge les notifications une fois a l'ouverture de session via `GET /api/notifications` dans `components/menu.js`.
- `GET /api/notifications` appelle `getNotificationsForSession`, qui synchronise d'abord les notifications generables pour la session courante.
- Les notifications non lues sont triees avant les lues, puis par date de creation decroissante, avec une limite de 50.
- `PUT /api/notifications` marque toutes les notifications non lues de l'utilisateur comme lues, ou une notification precise si un `id` est fourni.
- `DELETE /api/notifications` fait une suppression logique via `deletedAt`, pour toutes les notifications de l'utilisateur ou une notification precise.
- Les notifications lues depuis plus de 48 heures sont automatiquement marquees comme supprimees lors de la synchronisation.

## Utilisateurs

| Notification | Quand elle apparait | Type | Source |
| --- | --- | --- | --- |
| Reservation en retard | Si une entree de l'utilisateur est `USED` et que sa date de fin est passee | `RESERVATION_DELAYED` | `services/server/notifications.js` |
| Reservation a demarrer | Si une entree de l'utilisateur est `ACCEPTED` ou `WAITING` et que sa date de debut est passee sans etre en cours | `RESERVATION_START_MISSED` | `services/server/notifications.js` |
| Reservation refusee | Si une entree de l'utilisateur est `REJECTED` | `RESERVATION_REJECTED` | `services/server/notifications.js` |
| Message non lu | Si l'utilisateur participe a une conversation liee a une reservation et que des messages d'autres participants sont plus recents que son `readAt` | `CONVERSATION_UNREAD` | `services/server/notifications.js` |
| Mention dans une discussion | Si l'utilisateur est mentionne avec `@...` dans une conversation dont il est participant | `CONVERSATION_UNREAD` | `services/server/conversations.js` |

## Managers / gestionnaires

Un manager correspond ici a un admin responsable d'une ressource, d'une categorie ou d'un site. Les notifications manager sont visibles uniquement si la session est consideree admin (`ADMIN` ou `SUPERADMIN`).

| Notification | Quand elle apparait | Type | Source |
| --- | --- | --- | --- |
| Reservation a confirmer | Pour chaque reservation `WAITING` sur une ressource dont le manager est responsable | `RESERVATION_WAITING_CONFIRMATION` | `services/server/notifications.js` |
| Probleme ressource signale | Quand un utilisateur non admin signale un probleme sur une ressource et que le gestionnaire est different du declarant | `RESOURCE_PROBLEM_REPORTED` | `pages/api/resource-events.js` |
| Message non lu | Si le manager participe a une conversation de reservation ou d'evenement ressource et n'a pas lu les derniers messages | `CONVERSATION_UNREAD` | `services/server/notifications.js` |
| Mention dans une discussion | Si le manager est mentionne avec `@...` dans une conversation dont il est participant | `CONVERSATION_UNREAD` | `services/server/conversations.js` |

## Admins

| Notification | Quand elle apparait | Type | Source |
| --- | --- | --- | --- |
| Reservation a confirmer | Pour un `SUPERADMIN`, toutes les reservations `WAITING`; pour un `ADMIN`, seulement celles des ressources/categorie/sites dont il est responsable | `RESERVATION_WAITING_CONFIRMATION` | `services/server/notifications.js` |
| Message non lu | Si l'admin participe a une conversation accessible et que des messages d'autres participants sont non lus | `CONVERSATION_UNREAD` | `services/server/notifications.js` |
| Mention dans une discussion | Si l'admin est mentionne avec `@...` dans une conversation dont il est participant | `CONVERSATION_UNREAD` | `services/server/conversations.js` |

## Notifications generees automatiquement vs notifications ponctuelles

- Les types `RESERVATION_DELAYED`, `RESERVATION_START_MISSED`, `RESERVATION_REJECTED`, `RESERVATION_WAITING_CONFIRMATION`, `MESSAGE_UNREAD` et `CONVERSATION_UNREAD` sont consideres comme generes automatiquement dans `GENERATED_TYPES`.
- Lors de chaque synchronisation, les notifications generees qui ne correspondent plus a un etat actif sont marquees supprimees.
- `RESOURCE_PROBLEM_REPORTED` est creee ponctuellement lors du signalement et n'est pas dans `GENERATED_TYPES`, donc elle n'est pas supprimee automatiquement quand l'etat du probleme change.
- Les mentions creent directement une notification `CONVERSATION_UNREAD`; elles ne portent pas d'`entryId`, ce qui permet plusieurs notifications du meme type sans conflit avec les notifications de conversation liees a une reservation.

## Parametres et limites

- Les notifications de discussion d'evenements ressource peuvent etre desactivees via `appSettings.eventDiscussionNotificationsEnabled`; cela concerne les mentions dans les conversations `RESOURCE_EVENT`.
- Le schema contient le type `MESSAGE_UNREAD`, mais aucun create/upsert effectif de ce type n'a ete trouve dans le code audite.
- Les notifications ne sont pas poussees en temps reel; elles sont recuperees au chargement du menu/session, sauf rafraichissement manuel ou rechargement.
- Le compteur non lu depend du champ `readAt` et non d'un etat separe.
