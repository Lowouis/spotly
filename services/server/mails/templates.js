import {marked} from 'marked';
import {formatDuration} from "@/global";

const appUrl = process.env.NEXTAUTH_URL || 'https://votre-app.vercel.app';

const spotlyLogoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1254 1254" width="34" height="34" role="img" aria-label="Spotly" style="display:block;">
  <path d="M 585 194 C 705 178 812 247 851 356 C 895 480 830 584 693 673 C 574 750 488 803 505 872 C 524 949 657 895 748 795 C 845 689 981 697 1055 789 C 1134 887 1103 1043 984 1108 C 889 1161 775 1137 700 1069" fill="none" stroke="#0a0a0a" stroke-width="135" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 367 333 C 398 252 463 206 559 193 C 663 178 749 225 790 306 C 835 395 786 493 671 526 C 573 554 459 544 380 505 C 331 481 315 431 345 391 C 352 381 361 359 367 333 Z" fill="#0a0a0a"/>
  <path d="M 374 492 C 346 522 316 540 274 548 C 252 552 244 561 244 575 C 244 589 257 596 276 591 C 291 587 309 581 323 574 C 306 594 294 613 292 626 C 290 641 305 650 319 639 C 340 622 361 594 389 552 Z" fill="#0a0a0a"/>
  <circle cx="528" cy="269" r="30" fill="white"/>
</svg>`;

/**
 * Ajoute un style par défaut pour les emails.
 * @param {string} body - Contenu HTML du corps de l'email.
 * @returns {string} - HTML complet avec des styles.
 */
const wrapInHtmlTemplate = (body, subject = "Spotly") => `
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta http-equiv="Content-Language" content="fr" />
    <title>${subject}</title>
    <style>
      body { margin: 0; padding: 0; background: #f6f7f9; color: #111827; font-family: Arial, Helvetica, sans-serif; }
      .page { width: 100%; background: #f6f7f9; padding: 32px 12px; }
      .email { max-width: 640px; margin: 0 auto; overflow: hidden; border: 1px solid #e5e7eb; border-radius: 20px; background: #ffffff; }
      .header { padding: 28px 32px 18px; border-bottom: 1px solid #eef0f3; }
      .brand { display: inline-flex; align-items: center; gap: 12px; color: #111827; text-decoration: none; }
      .brand-mark { display: inline-flex; height: 42px; width: 42px; align-items: center; justify-content: center; border-radius: 14px; background: #f3f4f6; vertical-align: middle; }
      .brand-name { display: inline-block; margin-left: 12px; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; vertical-align: middle; }
      .content { padding: 28px 32px 8px; }
      .content h1 { margin: 0 0 18px; color: #111827; font-size: 24px; line-height: 1.25; letter-spacing: -0.03em; }
      .content h2, .content h3, .content h4 { margin: 26px 0 10px; color: #111827; font-size: 15px; line-height: 1.4; }
      .content p { margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.7; }
      .content ul, .content ol { margin: 12px 0 22px; padding: 0; list-style: none; }
      .content li { margin: 8px 0; padding: 12px 14px; border: 1px solid #eef0f3; border-radius: 12px; background: #fafafa; color: #374151; font-size: 14px; line-height: 1.5; text-align: center; }
      .content strong { color: #111827; font-weight: 700; }
      .content a { color: #ffffff; display: inline-block; margin-top: 6px; padding: 12px 18px; border-radius: 999px; background: #111827; font-weight: 700; text-decoration: none; }
      .content hr { display: none; }
      .footer { padding: 22px 32px 28px; color: #6b7280; font-size: 12px; line-height: 1.6; }
      .footer a { color: #111827; font-weight: 700; text-decoration: none; }
      @media (max-width: 520px) {
        .page { padding: 16px 8px; }
        .header, .content, .footer { padding-left: 20px; padding-right: 20px; }
        .content h1 { font-size: 21px; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="email">
        <header class="header">
          <a class="brand" href="${appUrl}">
            <span class="brand-mark">${spotlyLogoSvg}</span>
            <span class="brand-name">Spotly</span>
          </a>
        </header>
        <main class="content">
          ${body}
        </main>
        <footer class="footer">
          <p style="margin:0;">Ce message est généré automatiquement, merci de ne pas y répondre.</p>
        </footer>
      </div>
    </div>
  </body>
</html>
`;

const displayValue = (value, fallback = 'non renseigné') => {
    if (value === null || value === undefined || value === '') return fallback;
    if (value instanceof Date) return value.toLocaleString('fr-FR');
    if (typeof value === 'object') {
        return value.name || value.label || value.title || fallback;
    }
    return String(value);
};

const displayUser = (data, fallback = 'utilisateur') => {
    const user = data?.user;
    if (typeof user === 'string') return user || fallback;
    const fullName = [user?.name, user?.surname].filter(Boolean).join(' ');
    return data?.name || data?.userName || fullName || fallback;
};

const displayDate = (value, fallback = 'non renseignée') => {
    if (!value) return fallback;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return displayValue(value, fallback);
    return date.toLocaleString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const cleanMarkdown = (markdown) => String(markdown || '')
    .replace(/\n---\s*/g, '\n')
    .replace(/\n\s*Cordialement,?\s*\n\s*(L'équipe de gestion des ressources|Votre système de gestion des ressources\.)\s*/gi, '\n')
    .replace(/\n\s*L'équipe de gestion des ressources\s*/gi, '\n')
    .replace(/\n\s*Votre système de gestion des ressources\.\s*/gi, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const displayGroupEntryDate = (entry) => displayDate(entry?.startDate || entry?.date);

const displayGroupEntryTimeRange = (entry) => {
    const start = entry?.startDate ? new Date(entry.startDate) : null;
    const end = entry?.endDate ? new Date(entry.endDate) : null;

    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'non renseignés';

    return `${start.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})} - ${end.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}`;
};

const displayShortDate = (value, fallback = 'non renseignée') => {
    if (!value) return fallback;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return displayValue(value, fallback);

    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const inferGroupFrequency = (entries) => {
    const sortedStarts = [...(entries || [])]
        .map((entry) => new Date(entry?.startDate || entry?.date))
        .filter((date) => !Number.isNaN(date.getTime()))
        .sort((a, b) => a - b);

    if (sortedStarts.length < 2) return 'Ponctuelle';

    const diffInDays = Math.round((sortedStarts[1] - sortedStarts[0]) / (1000 * 60 * 60 * 24));
    if (diffInDays === 1) return 'Quotidienne';
    if (diffInDays === 7) return 'Hebdomadaire';
    if (diffInDays >= 28 && diffInDays <= 31) return 'Mensuelle';
    if (diffInDays > 1) return `Tous les ${diffInDays} jours`;
    return 'Récurrente';
};

const displayGroupReservationSummary = (data) => {
    const entries = [...(data?.entries || [])].sort((a, b) => new Date(a?.startDate || a?.date) - new Date(b?.startDate || b?.date));
    const firstEntry = entries[0];
    const lastEntry = entries[entries.length - 1];
    const occurrenceCount = entries.length;
    const timeRange = firstEntry ? displayGroupEntryTimeRange(firstEntry) : 'non renseignés';

    return `
### Synthèse de la série
- **Ressource** : ${displayValue(data.resource)}
- **Période** : du ${displayShortDate(firstEntry?.startDate || firstEntry?.date)} au ${displayShortDate(lastEntry?.startDate || lastEntry?.date)}
- **Fréquence** : ${displayValue(data.frequency || data.recursiveUnit || data.recursive_unit || inferGroupFrequency(entries))}
- **Occurrences** : ${occurrenceCount} réservation${occurrenceCount > 1 ? 's' : ''}
- **Horaires habituels** : ${timeRange}
`;
};

const templates = {
    rejected: (data) => `
# Refus de la demande de réservation

Bonjour **${displayUser(data)}**,

Votre demande de réservation pour la ressource **${displayValue(data.resource)}** de **${displayValue(data.domain)}** a été refusée par ${displayValue(data.owner)}.
 
### Détails de votre demande :
- **Date de début** : ${displayDate(data.startDate)}
- **Date de fin**   : ${displayDate(data.endDate)}

---

Cordialement,
L'équipe de gestion des ressources 

`,
    test: () => `
# Test d'email

Bonjour,

Ceci est un email de test envoyé depuis Spotly.

---

Cordialement,  
L'équipe de gestion des ressources 
`,
    reservationConfirmation: (data) => `
# Confirmation de réservation

Bonjour **${displayUser(data)}**,

Nous vous confirmons que votre réservation pour la ressource **${displayValue(data.resource)}** de **${displayValue(data.domain)}** a bien été enregistrée avec succès.

### Détails de votre réservation :
- **Date de début** : ${displayDate(data.startDate)}
- **Date de fin**   : ${displayDate(data.endDate)}

---

Cordialement,  
L'équipe de gestion des ressources 
`,
    reservationCancelled: (data) => `
# Annulation de réservation

Bonjour **${displayUser(data)}**,

Nous vous confirmons l'annulation de la réservation suivante :
    
- **Ressource** : ${displayValue(data.resource)}
- **Date de début** : ${displayDate(data.startDate)}
- **Date de fin**   : ${displayDate(data.endDate)}
---
    
Cordialement,  
L'équipe de gestion des ressources 
    
    `,

    reservationRequestUser: (data) => `
# Confirmation de la demande de réservation

Bonjour **${displayUser(data)}**,

Votre demande de réservation pour la ressource **${displayValue(data.resource)}** de **${displayValue(data.domain)}** a bien été soumise à ${displayValue(data.owner)}.
Lorsque votre demande sera approuvée, vous recevrez un email de confirmation.    

### Détails de votre demande :
- **Date de début** : ${displayDate(data.startDate)}
- **Date de fin**   : ${displayDate(data.endDate)}

---

Cordialement,  
L'équipe de gestion des ressources 
    
    `

    ,reservationRequestOwner: (data) => `
# Nouvelle réservation en attente 

Une nouvelle réservation a été soumise par **${displayUser(data)}** :

### Détails de la demande :
- **Ressource** : ${displayValue(data.resource)}
- **Site** : ${displayValue(data.domain)}
- **Date de début** : ${displayDate(data.startDate)}
- **Date de fin**   : ${displayDate(data.endDate)}

Merci de valider ou rejeter cette réservation dans les plus brefs délais dans la section administrateur de votre application Spotly.

---
Cordialement,  
Votre système de gestion des ressources.
    `
    ,reservationReturnedConfirmation: (data) => `
# Confirmation de restitution 

La ressource de votre réservation a été restitué avec succès. 

### Détails de la réstitution :
- **Ressource** : ${displayValue(data.resource)}
- **Date de restitution** : ${displayDate(data.returnedAt || new Date())}
${new Date() > new Date(data.endDate) ? `- **Retard** : ${formatDuration(new Date() - new Date(data.endDate))}` : ''}

### Nous vous remercions d'avoir utilisé Spotly.
---
Cordialement,  
Votre système de gestion des ressources.
    `, reservationDelayedAlert: (data) => `
# Vous avez une réservation en retard 

Vous n'avez pas encore restitué la ressource réservée.
Veuillez restituer dans les plus brefs délais la ressource suivante : **${displayValue(data.resource)}**

Retard : ${formatDuration(new Date() - new Date(data.endDate))}

---
Cordialement,  
Votre système de gestion des ressources.
    `,
    latePickupWarning: (data) => `
# Retard de restitution — tentative de récupération

Bonjour **${displayValue(data.offender, 'utilisateur')}**,

Vous vous étiez engagé·e à restituer la ressource **${displayValue(data.resource)}** à **${displayDate(data.endDate)}**.
Une personne a réservé la ressource **${displayValue(data.resource)}** après vous et se trouve actuellement en attente.
Merci de restituer celle-ci au plus vite.

### Détails
- **Demandeur·euse** : ${displayValue(data.requester)}
- **Ressource** : ${displayValue(data.resource)}
- **Fin prévue de votre réservation** : ${displayDate(data.endDate)}

Merci de restituer la ressource dans les plus brefs délais.

---
Cordialement,  
L'équipe de gestion des ressources 
    `,
    resentCode: (data) => `
# Code de réservation

Bonjour **${displayUser(data)}**,

Suite à votre demande, voici le code de réservation pour la ressource **${displayValue(data.resource)}**.

### Détails de la réservation :
- **Date de début** : ${displayDate(data.startDate)}
- **Date de fin** : ${displayDate(data.endDate)}

Votre code de réservation :

<div style="margin:18px 0 8px;text-align:center;font-size:34px;font-weight:800;letter-spacing:0.16em;color:#111827;line-height:1.2;">${data.key}</div>
---

Cordialement,  
L'équipe de gestion des ressources 
`,
    groupReservationAccepted: (data) => `
# Réservation de groupe acceptée

Bonjour **${displayUser(data)}**,

Votre série de réservations pour la ressource **${displayValue(data.resource)}** a bien été acceptée.

${displayGroupReservationSummary(data)}

${data.entries?.some((entry) => entry.isCode) ? 'Un code peut être demandé au moment de la récupération ou de la restitution. Il sera disponible depuis le détail de la réservation concernée.' : ''}

<div style="text-align:center; margin: 18px 0;">
  <a href="${process.env.NEXTAUTH_URL}?sso=1&tab=bookings" style="display:inline-block; background:#2563eb; color:#fff; font-weight:bold; padding:10px 24px; border-radius:6px; text-decoration:none; font-size:1.1em;">Voir mes réservations</a>
</div>


---

Cordialement,  
L'équipe de gestion des ressources 
`,

    groupReservationWaiting: (data) => `
# Demande de réservation de groupe en attente

Bonjour **${displayUser(data)}**,

Votre demande de réservation de groupe pour la ressource **${displayValue(data.resource)}** a bien été soumise.
Vous recevrez une confirmation lorsque la demande sera traitée.

${displayGroupReservationSummary(data)}

---

Cordialement,  
L'équipe de gestion des ressources 
`,

    groupReservationCancelled: (data) => `
# Annulation de réservation de groupe

Bonjour **${displayUser(data)}**,

Nous vous confirmons l'annulation de votre réservation de groupe pour la ressource **${displayValue(data.resource)}**.

${displayGroupReservationSummary(data)}

---

Cordialement,  
L'équipe de gestion des ressources 
`,

    groupReservationRequestOwner: (data) => `
# Nouvelle demande de réservation de groupe en attente

Une nouvelle demande de réservation de groupe a été soumise par **${displayUser(data)}** pour la ressource **${displayValue(data.resource)}**.

${displayGroupReservationSummary(data)}

Merci de valider ou rejeter cette demande de réservation de groupe dans les plus brefs délais dans la section administrateur de votre application Spotly.

---
Cordialement,  
Votre système de gestion des ressources.
`,

    resourceUnavailable: (data) => `
# Ressource indisponible - Réservation affectée

Bonjour **${data.userName}**,

Nous vous informons que la ressource **${data.resourceName}** (${data.resourceCategory} - ${data.resourceSite}) est devenue indisponible.

### Votre réservation concernée :
- **Date de début** : ${displayDate(data.reservationStartDate)}
- **Date de fin** : ${displayDate(data.reservationEndDate)}

### Raison de l'indisponibilité :
${data.message}

### Que faire maintenant ?
1. **Connectez-vous à votre espace** pour voir si une ressource similaire vous a été automatiquement proposée
2. **Contactez l'administrateur** si vous avez besoin d'aide pour trouver une alternative
3. **Modifiez votre réservation** si nécessaire

### Contact administrateur :
Pour toute question, contactez : ${data.adminContact}

---

Cordialement,
L'équipe de gestion des ressources
`,

    resourceChanged: (data) => `
# Changement de ressource - Réservation modifiée

Bonjour **${data.userName}**,

Votre réservation a été automatiquement modifiée suite à l'indisponibilité de la ressource **${data.oldResourceName}**.

### Nouvelle ressource attribuée :
- **Ressource** : ${data.newResourceName}
- **Site** : ${data.newResourceSite}
- **Catégorie** : ${data.newResourceCategory}

### Détails de votre réservation :
- **Date de début** : ${displayDate(data.reservationStartDate)}
- **Date de fin** : ${displayDate(data.reservationEndDate)}


### Que faire maintenant ?
1. **Vérifiez** que la nouvelle ressource vous convient
2. **Contactez l'administrateur** si vous souhaitez une autre ressource
3. **Connectez-vous** à votre espace pour voir les détails

### Contact administrateur :
Pour toute question, contactez : ${data.adminContact}

---

Cordialement,  
L'équipe de gestion des ressources
`,

    resourceProblemReported: (data) => `
# Problème signalé sur une ressource

Bonjour **${data.ownerName}**,

Un problème a été signalé par **${data.reporterName}** sur la ressource **${data.resourceName}**.

### Ressource concernée
- **Site** : ${data.resourceSite}
- **Catégorie** : ${data.resourceCategory}

### Signalement
- **Titre** : ${data.eventTitle}
- **Typologie** : ${data.eventType}
- **Impact** : ${data.severity}
- **Date du problème** : ${displayDate(data.problemDate)}

### Description
${data.description}

Connectez-vous à l’administration pour suivre cet événement dans la section Maintenance.

---

Cordialement,
L'équipe de gestion des ressources
`,

    resourceEventAffectedReservation: (data) => `
# Changement de ressource requis

Bonjour **${data.userName}**, 

Une intervention affecte la ressource **${data.resourceName}** (${data.resourceCategory} - ${data.resourceSite}).

Vous devrez choisir une autre ressource pour votre réservation.

### Réservation concernée
- **Date de début** : ${displayDate(data.reservationStartDate)}
- **Date de fin** : ${displayDate(data.reservationEndDate)}

### Motif
- **Typologie** : ${data.eventType}
- **Raison** : ${data.eventReason}

### Détail
${data.eventDescription}

### Prochaine étape
1. Connectez-vous à votre espace pour modifier votre réservation
2. Choisissez une autre ressource disponible sur le même créneau
3. Contactez l’administrateur si vous avez besoin d’aide

### Contact administrateur
${data.adminContact || 'Contactez votre administrateur habituel.'}

---

Cordialement,
L'équipe de gestion des ressources
`,

};

/**
 * Récupère un modèle d'email et le convertit en HTML.
 * @param {string} templateName - Nom du modèle.
 * @param {object} data - Données dynamiques pour le modèle.
 * @returns {string} - Contenu HTML stylisé de l'email.
 */
export const getEmailTemplate = (templateName, data) => {
    if (!templates[templateName]) {
        throw new Error(`Modèle d'email "${templateName}" introuvable.`);
    }

    // Empêcher l'inclusion de commentaires/notes dans le corps markdown
    const sanitized = {
        ...data,
        comment: undefined,
        adminNote: undefined,
        entries: Array.isArray(data?.entries)
            ? data.entries.map(e => ({...e, comment: undefined, adminNote: undefined}))
            : data?.entries
    };

    const markdown = cleanMarkdown(templates[templateName](sanitized));
    const htmlBody = marked(markdown);

    return wrapInHtmlTemplate(htmlBody, data.subject || "Spotly");
};
