# Audit des mails

Ce document recense les mails automatiques envoyes par Spotly, par type de destinataire. Les envois passent principalement par `POST /api/mail/sendEmail`, via `EmailContext`, et utilisent les templates declares dans `config/emailTemplates.js` et rendus par `services/server/mails/templates.js`.

## Garde-fous generaux

- Les templates peuvent etre actives/desactives depuis l'administration via `pages/api/mail/settings.js` et `features/admin/sections/MailConfig.js`.
- Par defaut, un template sans reglage explicite est considere actif.
- `POST /api/mail/sendEmail` exige une session authentifiee ou un appel de service avec `CRON_SECRET`.
- Les mails `reservationDelayedAlert` et `resentCode` sont limites a un envoi par jour, destinataire et contexte grace a `EmailNotificationLog`.
- Les envois necessitent une configuration SMTP active en base (`SmtpConfig`).
- Les mails de changement ou indisponibilite de ressource utilisent des routes dediees et ne passent pas par `buildEmailMessage`, meme s'ils utilisent les memes templates HTML.

## Utilisateurs

| Evenement | Quand le mail est envoye | Template | Source |
| --- | --- | --- | --- |
| Reservation acceptee immediatement | Apres creation d'une reservation non moderee ou d'un groupe de reservations accepte automatiquement | `groupReservationAccepted` | `components/modals/ModalValidBooking.js` |
| Demande de reservation en attente | Apres creation d'une reservation moderee avec statut `WAITING` | `reservationRequestUser` | `components/modals/ModalValidBooking.js` |
| Demande groupee en attente | Apres creation de plusieurs reservations moderees avec statut `WAITING` | `groupReservationWaiting` | `components/modals/ModalValidBooking.js` |
| Reservation acceptee par moderation | Quand un manager/admin accepte une reservation en attente | `reservationConfirmation` | `components/actions/ActionMenu.js` |
| Reservation refusee | Quand un manager/admin refuse une reservation en attente | `rejected` | `components/actions/ActionMenu.js` |
| Restitution confirmee | Quand la ressource est marquee comme restituee | `reservationReturnedConfirmation` | `components/modals/ModalCheckingBooking.js`, `hooks/useEntryActions.js` |
| Reservation annulee | Quand une reservation est supprimee/annulee depuis la modale de suivi | `reservationCancelled` | `components/modals/ModalCheckingBooking.js` |
| Code de reservation renvoye | Quand l'utilisateur demande le renvoi du code | `resentCode` | `components/modals/ModalCheckingBooking.js` |
| Retard de restitution | Tous les jours a 07:00 via `npm run "run cron:daily"` pour les entrees `USED`, non retournees, dont `endDate` est passee | `reservationDelayedAlert` | `scripts/cron.mjs` |
| Ressource devenue indisponible | Quand un admin rend une ressource indisponible et renseigne un message pour les reservations futures affectees | `resourceUnavailable` | `components/modals/ResourceStatusChangeModal.js`, `pages/api/mail/send-resource-unavailable.js` |
| Ressource remplacee | Quand un admin attribue une ressource similaire a une reservation affectee | `resourceChanged` | `components/modals/ResourceStatusChangeModal.js`, `pages/api/mail/send-resource-changed.js` |

## Managers / gestionnaires

Un manager correspond ici au responsable de la ressource, sinon au responsable de la categorie, sinon au responsable du site.

| Evenement | Quand le mail est envoye | Template | Source |
| --- | --- | --- | --- |
| Nouvelle demande de reservation | Quand une reservation moderee est creee avec statut `WAITING` | `reservationRequestOwner` | `components/modals/ModalValidBooking.js` |
| Nouvelle demande groupee | Quand plusieurs reservations moderees sont creees avec statut `WAITING` | `groupReservationRequestOwner` | `components/modals/ModalValidBooking.js` |
| Probleme ressource signale par un utilisateur | Quand un utilisateur non admin cree un evenement de maintenance/probleme sur une ressource dont le gestionnaire est different du declarant | `resourceProblemReported` | `pages/api/resource-events.js` |

## Admins

- Aucun mail n'est envoye a tous les admins uniquement parce qu'ils ont le role `ADMIN` ou `SUPERADMIN`.
- Un admin peut recevoir les mails de la section manager s'il est responsable de la ressource, de la categorie ou du site concerne.
- Les superadmins peuvent envoyer un mail de test SMTP via les routes de test/configuration, mais ce mail sert a valider la configuration et ne correspond pas a une notification metier utilisateur.

## Templates declares mais peu ou pas relies a un declencheur direct observe

- `groupReservationCancelled` est declare et teste, mais aucun appel applicatif direct n'a ete trouve dans le code audite.
- `latePickupWarning` est declare et teste, mais aucun appel applicatif direct n'a ete trouve dans le code audite.

## Points d'attention

- Certains envois sont declenches cote client apres succes d'une mutation. Si l'appel mail echoue, la reservation peut deja etre creee ou modifiee.
- `resourceUnavailable` et `resourceChanged` ne passent pas par la fonction commune `buildEmailMessage`, donc leur format d'envoi et leurs pieces jointes different des autres mails.
- Les mails de retard sont geres par la commande cron systeme `npm run "run cron:daily"`, pas par un processus permanent Next.js/Vercel.
- Les mails aux managers dependent de la presence d'une adresse email sur le responsable resolu.
