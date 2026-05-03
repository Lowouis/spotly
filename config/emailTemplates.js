export const EMAIL_TEMPLATE_GROUPS = [
    {
        id: 'user',
        title: 'Utilisateur',
        description: 'Emails envoyés à la personne qui réserve ou utilise la ressource.',
        templates: [
            {templateName: 'reservationConfirmation', label: 'À la confirmation'},
            {templateName: 'reservationRequestUser', label: 'À la demande en attente'},
            {templateName: 'groupReservationAccepted', label: 'À la confirmation groupée'},
            {templateName: 'groupReservationWaiting', label: 'À la demande groupée en attente'},
            {templateName: 'reservationReturnedConfirmation', label: 'À la restitution'},
            {templateName: 'reservationCancelled', label: 'À l’annulation'},
            {templateName: 'groupReservationCancelled', label: 'À l’annulation groupée'},
            {templateName: 'rejected', label: 'Au refus'},
            {templateName: 'reservationDelayedAlert', label: 'Au retard de restitution'},
            {templateName: 'latePickupWarning', label: 'Si un utilisateur bloque la récupération'},
            {templateName: 'resentCode', label: 'À la demande de code'},
            {templateName: 'resourceUnavailable', label: 'Si une ressource devient indisponible'},
            {templateName: 'resourceChanged', label: 'Si la ressource est remplacée'},
            {templateName: 'resourceEventAffectedReservation', label: 'Si un événement impacte une réservation'},
        ],
    },
    {
        id: 'manager',
        title: 'Gestionnaire',
        description: 'Emails envoyés au responsable de site, catégorie ou ressource.',
        templates: [
            {templateName: 'reservationRequestOwner', label: 'À la demande'},
            {templateName: 'groupReservationRequestOwner', label: 'À la demande groupée'},
            {templateName: 'resourceProblemReported', label: 'Si un problème ressource est signalé'},
        ],
    },
    {
        id: 'system',
        title: 'Système',
        description: 'Emails techniques ou de validation de configuration.',
        templates: [
            {templateName: 'test', label: 'Email de test SMTP'},
        ],
    },
];

export const EMAIL_TEMPLATE_NAMES = EMAIL_TEMPLATE_GROUPS.flatMap(group => group.templates.map(template => template.templateName));
