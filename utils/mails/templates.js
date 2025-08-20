import {marked} from 'marked';
import {formatDuration} from "@/global";

/**
 * Ajoute un style par défaut pour les emails.
 * @param {string} body - Contenu HTML du corps de l'email.
 * @returns {string} - HTML complet avec des styles.
 */
const wrapInHtmlTemplate = (body, subject = "Spotly") => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;">
    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #fff; font-family: Arial, sans-serif;">
      <div style="width: 100%; text-align: center; margin-bottom: 20px;">
        <img 
          src="cid:bannerimg"
          alt="Spotly"
          style="max-width: 200px; height: auto;"
        />
      </div>
      ${body}
      <footer style="margin-top: 20px; font-size: 0.9em; text-align: center; color: #666; border-top: 1px solid #eee; padding-top: 20px;">
        <a href="${process.env.NEXTAUTH_URL}" style="color: #666; text-decoration: none;">Spotly</a>
        <p style="margin: 10px 0;">Merci d'utiliser notre service !</p>
        <p style="margin: 10px 0;">⚠️ Ce message est généré automatiquement, merci de ne pas y répondre.</p>
      </footer>
    </div>
  </body>
</html>
`;

// Sécurise les contenus texte
const escapeHtml = (unsafe = '') => (
    String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
);

// Construit un module "Commentaires" stylé à insérer en fin d'email
const buildCommentsModule = (data) => {
    const hasSingleNotes = !!(data && (data.comment || data.adminNote));
    const entryNotes = Array.isArray(data?.entries) ? data.entries.filter(e => e && (e.comment || e.adminNote)) : [];
    const hasGroupNotes = entryNotes.length > 0;

    if (!hasSingleNotes && !hasGroupNotes) return '';

    const labelStyle = "margin:0 0 6px 0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;";
    const chipStyle = "display:inline-block;padding:8px 12px;border-radius:8px;background:#f3f4f6;color:#111827;font-size:14px;line-height:1.4;";
    const cardStyle = "padding:12px;border:1px solid #e5e7eb;border-radius:8px;background:#ffffff;margin:10px 0;";

    let inner = '';

    if (hasSingleNotes) {
        if (data.comment) {
            inner += `<div style="${cardStyle}">`
                + `<p style="${labelStyle}">Commentaire de l'utilisateur</p>`
                + `<div style="${chipStyle}">${escapeHtml(data.comment)}</div>`
                + `</div>`;
        }
        if (data.adminNote) {
            inner += `<div style="${cardStyle}">`
                + `<p style="${labelStyle}">Note de l'administrateur</p>`
                + `<div style="${chipStyle}">${escapeHtml(data.adminNote)}</div>`
                + `</div>`;
        }
    }

    if (hasGroupNotes) {
        inner += entryNotes.map((entry, idx) => {
            const blocks = [];
            if (entry.comment) {
                blocks.push(
                    `<div style="${cardStyle}">`
                    + `<p style="${labelStyle}">Réservation n°${idx + 1} — Commentaire utilisateur</p>`
                    + `<div style="${chipStyle}">${escapeHtml(entry.comment)}</div>`
                    + `</div>`
                );
            }
            if (entry.adminNote) {
                blocks.push(
                    `<div style="${cardStyle}">`
                    + `<p style="${labelStyle}">Réservation n°${idx + 1} — Note administrateur</p>`
                    + `<div style="${chipStyle}">${escapeHtml(entry.adminNote)}</div>`
                    + `</div>`
                );
            }
            return blocks.join('');
        }).join('');
    }

    return `
      <section style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px;">
        <h3 style="margin:0 0 12px 0;font-size:16px;color:#111827;">Commentaires</h3>
        ${inner}
      </section>
    `;
};

const templates = {
    rejected: (data) => `
# Refus de la demande de réservation

Bonjour **${data.name}**,

Votre demande de réservation pour la ressource **${data.resource}** de **${data.domain}** à été refuser par ${data.owner}.
 
### Détails de votre demande :
- **Date de début** : ${data.startDate}
- **Date de fin**   : ${data.endDate}

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

Bonjour **${data.name}**,

Nous vous confirmons que votre réservation pour la ressource **${data.resource}** de **${data.domain}** a bien été enregistrée avec succès.

### Détails de votre réservation :
- **Date de début** : ${data.startDate}
- **Date de fin**   : ${data.endDate}

---

Cordialement,  
L'équipe de gestion des ressources 
`,
    reservationCancelled: (data) => `
# Annulation de réservation

Bonjour **${data.user}**,

Nous vous confirmons l'annulation de la réservation suivante :
    
- **Ressource** : ${data.resource}
- **Date de début** : ${data.startDate}
- **Date de fin**   : ${data.endDate}
---
    
Cordialement,  
L'équipe de gestion des ressources 
    
    `,

    reservationRequestUser: (data) => `
# Confirmation de la demande de réservation

Bonjour **${data.name}**,

Votre demande de réservation pour la ressource **${data.resource}** de **${data.domain}** a bien été soumise à ${data.owner}.
Lorsque votre demande sera approuvée, vous recevrez un email de confirmation.    

### Détails de votre demande :
- **Date de début** : ${data.startDate}
- **Date de fin**   : ${data.endDate}

---

Cordialement,  
L'équipe de gestion des ressources 
    
    `

    ,reservationRequestOwner: (data) => `
# Nouvelle réservation en attente 

Une nouvelle réservation a été soumise par **${data.user}** :

### Détails de la demande :
- **Ressource** : ${data.resource}
- **Site** : ${data.domain}
- **Date de début** : ${data.startDate}
- **Date de fin**   : ${data.endDate}

Merci de valider ou rejeter cette réservation dans les plus brefs délais dans la section administrateur de votre application Spotly.

---
Cordialement,  
Votre système de gestion des ressources.
    `
    ,reservationReturnedConfirmation: (data) => `
# Confirmation de restitution 

La ressource de votre réservation a été restitué avec succès. 

### Détails de la réstitution :
- **Ressource** : ${data.resource.name}
- **Date de restitution** : ${new Date().toLocaleString("FR-fr", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric"
    })}
${new Date() > new Date(data.endDate) ? `- **Retard** : ${formatDuration(new Date() - new Date(data.endDate))}` : ''}

### Nous vous remercions d'avoir utilisé Spotly.
---
Cordialement,  
Votre système de gestion des ressources.
    `, reservationDelayedAlert: (data) => `
# Vous avez une réservation en retard 

Vous n'avez pas encore restitué la ressource réservée.
Veuillez restituer dans les plus brefs délais la ressource suivante : **${data.resource.name}**

Retard : ${formatDuration(new Date() - new Date(data.endDate))}

---
Cordialement,  
Votre système de gestion des ressources.
    `,
    latePickupWarning: (data) => `
# Retard de restitution — tentative de récupération

Bonjour **${data.offender}**,

Un utilisateur tente actuellement de récupérer la ressource **${data.resource}**.

Vous êtes en retard sur votre restitution.

### Détails
- **Demandeur** : ${data.requester}
- **Ressource** : ${data.resource}
- **Fin prévue de votre réservation** : ${new Date(data.endDate).toLocaleString("FR-fr", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric"
    })}

Merci de restituer la ressource dans les plus brefs délais.

---
Cordialement,  
L'équipe de gestion des ressources 
    `,
    resentCode: (data) => `
# Code de réservation

Bonjour **${data.user}**,

Suite à votre demande, voici le code de réservation pour la ressource **${data.resource}**.

### Détails de la réservation :
- **Date de début** : ${data.startDate}
- **Date de fin** : ${data.endDate}

- **Code de réservation** : 
<span style="display: block; margin: 16px auto; text-align: center; font-size: 2.5em; font-weight: bold; letter-spacing: 0.1em;">
${data.key}
</span>
---

Cordialement,  
L'équipe de gestion des ressources 
`,
    groupReservationAccepted: (data) => `
# Confirmation de réservation

Bonjour **${data.user}**,

Nous vous confirmons que votre réservation de groupe pour la ressource **${data.resource}** a bien été acceptée.

### Détails de votre réservation :
${data.entries.map((entry, index) => `
#### Réservation n°${index + 1} :
- **Date** : ${new Date(entry.startDate).toLocaleString("FR-fr", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    })}
- **Horaires** : ${new Date(entry.startDate).toLocaleTimeString("FR-fr", {
        hour: "2-digit",
        minute: "2-digit"
    })} - ${new Date(entry.endDate).toLocaleTimeString("FR-fr", {
        hour: "2-digit",
        minute: "2-digit"
    })}

${entry.isCode ? `<div style="text-align:center; margin: 16px 0;"><span style="font-size:2em; font-weight:bold; letter-spacing:0.1em;">${entry.returnedConfirmationCode}</span></div>` : ''}

<div style="text-align:center; margin: 12px 0;">
  <a href="${process.env.NEXTAUTH_URL}?sso=1&resId=${entry.id}&tab=bookings" style="display:inline-block; background:#2563eb; color:#fff; font-weight:bold; padding:10px 24px; border-radius:6px; text-decoration:none; font-size:1.1em;">Voir ma réservation</a>
</div>

`).join('\n')}


---

Cordialement,  
L'équipe de gestion des ressources 
`,

    groupReservationWaiting: (data) => `
# Demande de réservation en attente

Bonjour **${data.user}**,

Votre demande de réservation de groupe pour la ressource **${data.resource}** a bien été soumise.
Lorsque votre demande sera approuvée, vous recevrez un email de confirmation avec les codes de réservation.

### Détails de votre demande :
${data.entries.map((entry, index) => `
#### Réservation ${index + 1} :
- **Date** : ${new Date(entry.startDate).toLocaleString("FR-fr", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    })}
- **Horaires** : ${new Date(entry.startDate).toLocaleTimeString("FR-fr", {
        hour: "2-digit",
        minute: "2-digit"
    })} - ${new Date(entry.endDate).toLocaleTimeString("FR-fr", {
        hour: "2-digit",
        minute: "2-digit"
    })}
`).join('\n')}

---

Cordialement,  
L'équipe de gestion des ressources 
`,

    groupReservationCancelled: (data) => `
# Annulation de réservation de groupe

Bonjour **${data.user}**,

Nous vous confirmons l'annulation de votre réservation de groupe pour la ressource **${data.resource}**.

### Détails des réservations annulées :
${data.entries.map((entry, index) => `
#### Réservation ${index + 1} :
- **Date** : ${new Date(entry.startDate).toLocaleString("FR-fr", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    })}
- **Horaires** : ${new Date(entry.startDate).toLocaleTimeString("FR-fr", {
        hour: "2-digit",
        minute: "2-digit"
    })} - ${new Date(entry.endDate).toLocaleTimeString("FR-fr", {
        hour: "2-digit",
        minute: "2-digit"
    })}
`).join('\n')}

---

Cordialement,  
L'équipe de gestion des ressources 
`,

    groupReservationRequestOwner: (data) => `
# Nouvelle demande de réservation de groupe en attente

Une nouvelle demande de réservation de groupe a été soumise par **${data.user}** pour la ressource **${data.resource}**.

### Détails de la demande :
${data.entries.map((entry, index) => `
#### Réservation ${index + 1} :
- **Date** : ${new Date(entry.startDate).toLocaleString("FR-fr", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    })}
- **Horaires** : ${new Date(entry.startDate).toLocaleTimeString("FR-fr", {
        hour: "2-digit",
        minute: "2-digit"
    })} - ${new Date(entry.endDate).toLocaleTimeString("FR-fr", {
        hour: "2-digit",
        minute: "2-digit"
    })}
`).join('\n')}

Merci de valider ou rejeter cette demande de réservation de groupe dans les plus brefs délais dans la section administrateur de votre application Spotly.

---
Cordialement,  
Votre système de gestion des ressources.
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

    const markdown = templates[templateName](sanitized);
    const htmlBody = marked(markdown);
    const commentsModule = buildCommentsModule(data);

    return wrapInHtmlTemplate(htmlBody + commentsModule, data.subject || "Spotly");
};

