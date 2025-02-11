const constructDate = (date) => {
    const d = new Date();
    d.setFullYear(date.year);
    d.setMonth(date.month-1);
    d.setDate(date.day);
    d.setHours(date.hour);
    d.setMinutes(0);
    return d;
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
    if(entry.resource.pickable !== null){
        return entry.resource.pickable;
    } else if (entry.resource.category.pickable !== null){
        return entry.resource.category.pickable;
    } else if (entry.resource.domains.pickable !== null){
        return entry.resource.domains.pickable;
    } else {
        return null;
    }
}


const whoIsPickable = (entry) => {
    if(entry.resource.pickable !== null){
        return entry.resource.pickable === "TRUST";
    } else if(entry.resource.category.pickable !== null){
        return entry.resource.category.pickable === "TRUST";
    } else if(entry.resource.domains.pickable !== null){
        return entry.resource.domains.pickable === "TRUST";
    } else {
        return "TRUST";
    }
}

const whoIsOwner = (entry) => {
    if(entry.resource.owner !== null){
        return entry.resource.owner;
    } else if(entry.resource.category.owner !== null){
        return entry.resource.category.owner;
    } else if(entry.resource.domains.owner !== null){
        return entry.resource.domains.owner;
    }

    return null;
}


export function isValidDateTimeFormat(dateTimeString) {
    return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/.test(dateTimeString);
}

export {constructDate, whoIsPickable, whoIsOwner, lastestPickable, formatDuration, isValidDateTimeFormat};



