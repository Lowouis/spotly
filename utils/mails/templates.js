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
- **Code de réservation** : ${data.key}

⚠️ **Conservez ce code précieusement**, il pourra vous être demandé pour accéder à la ressource ou pour sa restitution.


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
    `,
    reservationDelayedAlert: (data) => `
# Vous avez une réservation en retard 

La ressource de votre réservation à été restitué avec succès. 
Veuillez restitué dans les plus bref delais la ressource suivante : ${data.resource.name}

Retard : ${formatDuration(new Date(data.endDate - new Date()))}

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