export const ACTIVE_RESOURCE_EVENT_RESERVATION_STATUSES = ['ACCEPTED', 'USED', 'WAITING'];

export async function findAffectedReservations(dbClient, {resourceId, startDate, endDate}) {
    const parsedResourceId = Number(resourceId);
    if (!parsedResourceId || !(startDate instanceof Date) || Number.isNaN(startDate.getTime()) || !(endDate instanceof Date) || Number.isNaN(endDate.getTime())) {
        return [];
    }

    return dbClient.entry.findMany({
        where: {
            resourceId: parsedResourceId,
            moderate: {in: ACTIVE_RESOURCE_EVENT_RESERVATION_STATUSES},
            startDate: {lte: endDate},
            endDate: {gte: startDate},
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    surname: true,
                    email: true,
                },
            },
            resource: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: {startDate: 'asc'},
    });
}

export async function hasOngoingReservation(dbClient, resourceId, now = new Date()) {
    const entries = await findAffectedReservations(dbClient, {
        resourceId,
        startDate: now,
        endDate: now,
    });

    return entries.length > 0;
}
