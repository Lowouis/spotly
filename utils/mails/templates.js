import {marked} from 'marked';
import {formatDuration} from "@/global";

/**
 * Ajoute un style par défaut pour les emails.
 * @param {string} body - Contenu HTML du corps de l'email.
 * @returns {string} - HTML complet avec des styles.
 */
const wrapInHtmlTemplate = (body) => `
    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #fff;">
        <div class="w-full flex justify-center items-center">
        <img 
        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSljy3n2uMTUxQtGyUxZURLEbUrSbup0o7hFQ&s" 
        alt="Spotly" class="w-full" />
        </div>
        ${body}
        <footer class="flex flex-col justify-start items-start" style="margin-top: 20px; font-size: 0.9em; text-align: center; color: #666;">
        <span><a href="${process.env.NEXT_PUBLIC_API_ENDPOINT}">Spotly</a></span>

            <hr style="border: none; border-top: 1px solid #eee;">
            <p>Merci d'utiliser notre service !</p>
            <p>⚠️ Ce message est généré automatiquement, merci de ne pas y répondre.</p>
        </footer>
    </div>
`;

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
- **Retard** : ${formatDuration(new Date() - new Date(data.endDate))}

### Nous vous remercions d'avoir utilisé Spotly.
---
Cordialement,  
Votre système de gestion des ressources.
    `, reservationDelayedAlert: (data) => `
# Vous avez une réservation en retard 

La ressource de votre réservation à été restitué avec succès. 
Veuillez restitué dans les plus bref delais la ressource suivante : ${data.resource.name}

Retard : ${formatDuration(new Date(data.endDate - new Date()))}

---
Cordialement,  
Votre système de gestion des ressources.
    `,
    resentCode: (data) => `
# Code de réservation

Bonjour **${data.user}**,

Suite à votre demande, voici le code de réservation pour la ressource **${data.resource}**.

### Détails de la réservation :
- **Date de début** : ${data.startDate}
- **Date de fin** : ${data.endDate}

- **Code de réservation** : <div style="text-align: center; font-size: 24px; font-weight: bold; margin: 15px 0; padding: 10px; background-color: #f5f5f5; border-radius: 5px;">${data.key}</div>
---

Cordialement,  
L'équipe de gestion des ressources 
`,
    groupReservationAccepted: (data) => `
# Confirmation de réservation de groupe

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

`).join('\n')}


---

Cordialement,  
L'équipe de gestion des ressources 
`,

    groupReservationWaiting: (data) => `
# Demande de réservation de groupe en attente

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

    const markdown = templates[templateName](data);
    const htmlBody = marked(markdown);
    return wrapInHtmlTemplate(htmlBody);
};

