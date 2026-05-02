const DEFAULT_OPTIONS = {
    onPickup: 0,
    maxEarlyPickupMinutes: 0,
};

export async function canPickupEntryNow(db, entry, now = new Date()) {
    if (!entry || entry.moderate !== 'ACCEPTED' || entry.resource?.status !== 'AVAILABLE' || new Date(entry.endDate) <= now) {
        return {allowed: false, reason: 'La récupération n’est pas disponible'};
    }

    const options = await db.timeScheduleOptions.findFirst();
    const onPickup = options?.onPickup ?? DEFAULT_OPTIONS.onPickup;
    const maxEarlyPickupMinutes = options?.maxEarlyPickupMinutes ?? DEFAULT_OPTIONS.maxEarlyPickupMinutes;
    const startDate = new Date(entry.startDate);
    const regularPickupStart = new Date(startDate.getTime() - onPickup * 60000);

    if (regularPickupStart <= now) {
        return {allowed: true, reason: null};
    }

    if (maxEarlyPickupMinutes <= 0) {
        return {allowed: false, reason: 'La récupération anticipée n’est pas encore autorisée'};
    }

    const flexiblePickupStart = new Date(startDate.getTime() - maxEarlyPickupMinutes * 60000);
    if (flexiblePickupStart > now) {
        return {allowed: false, reason: 'La récupération est trop en avance'};
    }

    const priorReservations = await db.entry.count({
        where: {
            resourceId: entry.resourceId,
            id: {not: entry.id},
            moderate: {in: ['ACCEPTED', 'USED', 'WAITING']},
            startDate: {lt: startDate},
            endDate: {gt: now},
        },
    });

    if (priorReservations > 0) {
        return {allowed: false, reason: 'Une réservation est prévue avant la vôtre'};
    }

    return {allowed: true, reason: null};
}
