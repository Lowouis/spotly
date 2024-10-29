const constructDate = (date) => {
    const d = new Date();
    d.setFullYear(date.year);
    d.setMonth(date.month-1);
    d.setDate(date.day);
    d.setHours(date.hour);
    d.setMinutes(0);
    return d;
}


export {constructDate};