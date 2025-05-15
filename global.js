const constructDate = (date) => {
    const d = new Date();
    d.setFullYear(date.year);
    d.setMonth(date.month-1);
    d.setDate(date.day);
    d.setHours(date.hour);
    d.setMinutes(0);
    return d;
}

function firstLetterUppercase(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function truncateString(string, maxLength) {
    if (string.length > maxLength) {
        return string.slice(0, maxLength) + '...';
    }
    return string;
}

function formatDuration(ms) {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    let result = '';
    if (days > 0) result += `${days} jour${days !== 1 ? 's' : ''} `;
    if (hours > 0) result += `${hours} heure${hours !== 1 ? 's' : ''} `;
    if (minutes > 0) result += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    return result.trim();
}

const lastestPickable = (entry) => {
    if (!entry?.resource) return null;

    if (entry.resource?.pickable !== null) {
        return entry.resource.pickable;
    } else if (entry.resource?.category?.pickable !== null) {
        return entry.resource.category.pickable;
    } else if (entry.resource?.domains?.pickable !== null) {
        return entry.resource.domains.pickable;
    } else {
        return null;
    }
}


const whoIsPickable = (entry) => {
    if(entry.resource.pickable !== null){
        return entry.resource.pickable.name === "TRUST";
    } else if(entry.resource.category.pickable !== null){
        return entry.resource.category.pickable.name === "TRUST";
    } else if(entry.resource.domains.pickable !== null){
        return entry.resource.domains.pickable.name === "TRUST";
    } else {
        return "TRUST";
    }
}

const whoIsOwner = (entry) => {
    if (entry?.resource.owner !== null) {
        return entry.resource.owner;
    } else if(entry.resource.category.owner !== null){
        return entry.resource.category.owner;
    } else if(entry.resource.domains.owner !== null){
        return entry.resource.domains.owner;
    }
    return null;
}


export function isValidDateTimeFormat(dateTimeString) {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(dateTimeString);
}


const pickablesDescriptions = {
    "FLUENT": "Aucun contrôle si le pickup et le retour de la ressource.",
    "HIGH_TRUST": "Récupération de la ressource sans contrôle, mais restitution à confirmer par clic.",
    "LOW_TRUST": "Récupération et restitution de la ressource avec un clic.",
    "DIGIT": "Récupération et restitution de la ressource avec un code à 6 chiffres.",
    "LOW_AUTH": "Récupération et restitution de la ressource avec un code à 6 chiffres, en étant authentifié ou non.",
    "HIGH_AUTH": "Récupération et restitution de la ressource avec un code à 6 chiffres, en étant authentifié avec un restriction de localisation.",
}


export {
    constructDate,
    whoIsPickable,
    whoIsOwner,
    lastestPickable,
    formatDuration,
    firstLetterUppercase,
    truncateString,
    pickablesDescriptions,
};



