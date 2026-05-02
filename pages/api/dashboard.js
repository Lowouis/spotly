'use server';

import db from "@/server/services/databaseService";
import {runMiddleware} from "@/services/server/core";
import {requireAdmin} from '@/services/server/api-auth';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date) {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
}

function endOfDay(date) {
    const value = new Date(date);
    value.setHours(23, 59, 59, 999);
    return value;
}

function getRange(range) {
    const now = new Date();
    const todayStart = startOfDay(now);

    if (range === 'today') return {start: todayStart, end: endOfDay(now)};
    if (range === 'month') return {start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0))};

    const day = todayStart.getDay() || 7;
    const start = new Date(todayStart.getTime() - (day - 1) * DAY_MS);
    return {start, end: endOfDay(new Date(start.getTime() + 6 * DAY_MS))};
}

function formatDayLabel(date) {
    const weekday = new Intl.DateTimeFormat('fr-FR', {weekday: 'short'}).format(date);
    const day = new Intl.DateTimeFormat('fr-FR', {day: '2-digit', month: '2-digit'}).format(date);
    return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${day}`;
}

function getManagedResourceWhere(userId) {
    return {
        OR: [
            {ownerId: userId},
            {category: {ownerId: userId}},
            {domains: {ownerId: userId}},
        ],
    };
}

function getResourceWhere(siteId, categoryId, session) {
    const filter = {
        ...(siteId && {domainId: Number(siteId)}),
        ...(categoryId && {categoryId: Number(categoryId)}),
    };

    if (session?.user?.role !== 'SUPERADMIN') {
        return {
            AND: [
                filter,
                getManagedResourceWhere(Number(session.user.id)),
            ],
        };
    }

    return filter;
}

function getEntryWhere({rangeStart, rangeEnd, siteId, categoryId, session}) {
    return {
        startDate: {lte: rangeEnd},
        endDate: {gte: rangeStart},
        resource: getResourceWhere(siteId, categoryId, session),
    };
}

function getEntryStartWhere({rangeStart, rangeEnd, siteId, categoryId, session}) {
    return {
        startDate: {gte: rangeStart, lte: rangeEnd},
        resource: getResourceWhere(siteId, categoryId, session),
    };
}

function getEventWhere({siteId, categoryId, session}) {
    return {
        resource: getResourceWhere(siteId, categoryId, session),
    };
}

function normalizeSeverity(value) {
    const severity = String(value || '').toLowerCase();
    if (['critical', 'critique', 'high', 'haute', 'urgent'].includes(severity)) return 'critical';
    if (['medium', 'moyenne', 'moderate', 'modérée'].includes(severity)) return 'medium';
    if (['low', 'faible', 'minor', 'mineure'].includes(severity)) return 'low';
    return 'unknown';
}

export default async function handler(req, res) {
    await runMiddleware(req, res);
    const session = await requireAdmin(req, res);
    if (!session) return;

    if (req.method !== "GET") {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({message: `Method ${req.method} not allowed`});
    }

    const siteId = req.query.siteId && req.query.siteId !== 'all' ? req.query.siteId : null;
    const categoryId = req.query.categoryId && req.query.categoryId !== 'all' ? req.query.categoryId : null;
    const range = req.query.range || 'week';
    const {start: rangeStart, end: rangeEnd} = getRange(range);
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const entryWhere = getEntryWhere({rangeStart, rangeEnd, siteId, categoryId, session});
    const resourceWhere = getResourceWhere(siteId, categoryId, session);

    const chartEntryWhere = getEntryStartWhere({rangeStart, rangeEnd, siteId, categoryId, session});

    const [domains, categories, resourcesTotal, resourcesAvailable, entries, chartEntries, todayReservations, waitingCount, upcomingEntries, maintenanceEvents, maintenanceConversations] = await Promise.all([
        db.domain.findMany({select: {id: true, name: true}, orderBy: {name: 'asc'}}),
        db.category.findMany({select: {id: true, name: true}, orderBy: {name: 'asc'}}),
        db.resource.count({where: resourceWhere}),
        db.resource.count({where: {...resourceWhere, status: 'AVAILABLE'}}),
        db.entry.findMany({
            where: entryWhere,
            include: {resource: {include: {domains: true, category: true}}},
            orderBy: {startDate: 'asc'},
        }),
        db.entry.findMany({
            where: chartEntryWhere,
            orderBy: {startDate: 'asc'},
        }),
        db.entry.count({where: getEntryStartWhere({rangeStart: todayStart, rangeEnd: todayEnd, siteId, categoryId, session})}),
        db.entry.count({where: {...entryWhere, moderate: 'WAITING'}}),
        db.entry.findMany({
            where: {
                startDate: {gte: now},
                resource: resourceWhere,
                moderate: {in: ['ACCEPTED', 'WAITING', 'USED']},
            },
            include: {resource: {include: {domains: true, category: true}}},
            orderBy: {startDate: 'asc'},
            take: 5,
        }),
        db.resourceEvent.findMany({
            where: getEventWhere({siteId, categoryId, session}),
            include: {resource: {include: {domains: true, category: true}}},
            orderBy: [{endDate: 'asc'}, {startDate: 'desc'}],
        }),
        db.conversation.findMany({
            where: {contextType: 'RESOURCE_EVENT', status: {not: 'ARCHIVED'}},
            select: {contextId: true, status: true},
        }),
    ]);

    const dayCount = Math.max(1, Math.ceil((rangeEnd - rangeStart) / DAY_MS));
    const reservationsByDay = Array.from({length: Math.min(dayCount, 31)}, (_, index) => {
        const dayStart = startOfDay(new Date(rangeStart.getTime() + index * DAY_MS));
        const dayEnd = endOfDay(dayStart);
        return {
            label: formatDayLabel(dayStart),
            date: dayStart.toISOString(),
            count: chartEntries.filter((entry) => new Date(entry.startDate) >= dayStart && new Date(entry.startDate) <= dayEnd).length,
        };
    });
    const periodReservations = reservationsByDay.reduce((sum, item) => sum + item.count, 0);

    const statusItems = [
        {key: 'confirmed', label: 'Confirmée', color: '#22c55e', count: entries.filter((entry) => ['ACCEPTED', 'USED'].includes(entry.moderate)).length},
        {key: 'waiting', label: 'En attente', color: '#f59e0b', count: entries.filter((entry) => entry.moderate === 'WAITING').length},
        {key: 'cancelled', label: 'Annulée', color: '#ef4444', count: entries.filter((entry) => entry.moderate === 'REJECTED').length},
        {key: 'ended', label: 'Terminée', color: '#3b82f6', count: entries.filter((entry) => entry.moderate === 'ENDED' || entry.returned).length},
    ];

    const resourceUsage = new Map();
    entries.forEach((entry) => {
        if (!entry.resource) return;
        const current = resourceUsage.get(entry.resource.id) || {id: entry.resource.id, name: entry.resource.name, count: 0, categoryName: entry.resource.category?.name || 'Ressource'};
        current.count += 1;
        resourceUsage.set(entry.resource.id, current);
    });
    const topResources = Array.from(resourceUsage.values()).sort((a, b) => b.count - a.count).slice(0, 5);
    const occupancyRate = resourcesTotal ? Math.round(((resourcesTotal - resourcesAvailable) / resourcesTotal) * 100) : 0;

    const maintenanceEventsInPeriod = maintenanceEvents.filter((event) => new Date(event.startDate) >= rangeStart && new Date(event.startDate) <= rangeEnd);
    const openMaintenanceEvents = maintenanceEvents.filter((event) => !event.endDate || new Date(event.endDate) > now);
    const criticalMaintenanceEvents = openMaintenanceEvents.filter((event) => normalizeSeverity(event.severity) === 'critical');
    const resolvedMaintenanceEvents = maintenanceEvents.filter((event) => event.endDate && new Date(event.endDate) >= rangeStart && new Date(event.endDate) <= rangeEnd);
    const avgResolutionHours = resolvedMaintenanceEvents.length
        ? Math.round(resolvedMaintenanceEvents.reduce((sum, event) => sum + Math.max(0, new Date(event.endDate) - new Date(event.startDate)), 0) / resolvedMaintenanceEvents.length / (60 * 60 * 1000))
        : 0;
    const maintenanceByDay = Array.from({length: Math.min(dayCount, 31)}, (_, index) => {
        const dayStart = startOfDay(new Date(rangeStart.getTime() + index * DAY_MS));
        const dayEnd = endOfDay(dayStart);
        return {
            label: formatDayLabel(dayStart),
            date: dayStart.toISOString(),
            count: maintenanceEventsInPeriod.filter((event) => new Date(event.startDate) >= dayStart && new Date(event.startDate) <= dayEnd).length,
        };
    });
    const maintenanceResourceImpact = new Map();
    maintenanceEventsInPeriod.forEach((event) => {
        if (!event.resource) return;
        const current = maintenanceResourceImpact.get(event.resource.id) || {id: event.resource.id, name: event.resource.name, count: 0};
        current.count += 1;
        maintenanceResourceImpact.set(event.resource.id, current);
    });
    const severityCounts = maintenanceEventsInPeriod.reduce((counts, event) => {
        const severity = normalizeSeverity(event.severity);
        counts[severity] = (counts[severity] || 0) + 1;
        return counts;
    }, {critical: 0, medium: 0, low: 0, unknown: 0});
    const activeMaintenanceEventIds = new Set(openMaintenanceEvents.map((event) => event.id));
    const openMaintenanceDiscussions = maintenanceConversations.filter((conversation) => activeMaintenanceEventIds.has(conversation.contextId) && conversation.status === 'OPEN').length;

    return res.status(200).json({
        filters: {domains, categories},
        metrics: {
            todayReservations,
            periodReservations,
            resourcesAvailable,
            resourcesTotal,
            occupancyRate,
            waitingCount,
        },
        reservationsByDay,
        statusItems,
        topResources,
        maintenance: {
            metrics: {
                openEvents: openMaintenanceDiscussions,
                unavailableResources: resourcesTotal - resourcesAvailable,
                criticalEvents: criticalMaintenanceEvents.length,
                avgResolutionHours,
                openDiscussions: openMaintenanceDiscussions,
            },
            eventsByDay: maintenanceByDay,
            severityItems: [
                {key: 'critical', label: 'Critique', color: '#ef4444', count: severityCounts.critical},
                {key: 'medium', label: 'Moyenne', color: '#f59e0b', count: severityCounts.medium},
                {key: 'low', label: 'Faible', color: '#22c55e', count: severityCounts.low},
                {key: 'unknown', label: 'Non qualifiée', color: '#94a3b8', count: severityCounts.unknown},
            ],
            topResources: Array.from(maintenanceResourceImpact.values()).sort((a, b) => b.count - a.count).slice(0, 5),
            upcomingEvents: maintenanceEvents
                .filter((event) => !event.endDate && new Date(event.startDate) >= now)
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                .slice(0, 5)
                .map((event) => ({
                    id: event.id,
                    title: event.title,
                    resourceName: event.resource?.name || 'Ressource inconnue',
                    siteName: event.resource?.domains?.name || 'Site',
                    startDate: event.startDate,
                    endDate: event.endDate,
                    severity: event.severity,
                })),
        },
        upcomingEntries: upcomingEntries.map((entry) => ({
            id: entry.id,
            resourceName: entry.resource?.name || 'Ressource inconnue',
            siteName: entry.resource?.domains?.name || 'Site',
            categoryName: entry.resource?.category?.name || 'Catégorie',
            startDate: entry.startDate,
            endDate: entry.endDate,
            moderate: entry.moderate,
        })),
    });
}
