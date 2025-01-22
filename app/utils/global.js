const constructDate = (date) => {
    const d = new Date();
    d.setFullYear(date.year);
    d.setMonth(date.month-1);
    d.setDate(date.day);
    d.setHours(date.hour);
    d.setMinutes(0);
    return d;
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













export {constructDate, whoIsPickable, whoIsOwner};



