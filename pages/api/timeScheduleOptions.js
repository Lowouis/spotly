import {runMiddleware} from '@/services/server/core';
import db from '@/server/services/databaseService';
import {NextResponse} from 'next/server';
import {requireAdmin} from '@/services/server/api-auth';

const defaultOptions = {
    onPickup: 0,
    onReturn: 0,
    authorizedDelay: 0,
    maxEarlyPickupMinutes: 0,
    shortcutStartHour: 8,
    shortcutEndHour: 18,
    shortcutWeekEndDay: 5,
};

const normalizeHour = (value, fallback) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 23) return fallback;
    return parsed;
};

const normalizeWeekEndDay = (value, fallback) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 6) return fallback;
    return parsed;
};

const normalizePositiveMinutes = (value, fallback, max = 43200) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > max) return fallback;
    return parsed;
};

export default async function handler(req, res) {
    await runMiddleware(req, res);
    if (req.method !== 'GET' && req.method !== 'OPTIONS') {
        if (!await requireAdmin(req, res)) return;
    }

    try {
        switch (req.method) {
            case 'GET':
                const options = await db.timeScheduleOptions.findFirst();
                res.json({...defaultOptions, ...(options || {})});
                break;

            case 'PUT':
                const {onPickup, onReturn, authorizedDelay, maxEarlyPickupMinutes, shortcutStartHour, shortcutEndHour, shortcutWeekEndDay} = req.body;
                const currentOptions = await db.timeScheduleOptions.findFirst();
                const currentShortcutStartHour = currentOptions?.shortcutStartHour ?? defaultOptions.shortcutStartHour;
                const currentShortcutEndHour = currentOptions?.shortcutEndHour ?? defaultOptions.shortcutEndHour;
                const currentShortcutWeekEndDay = currentOptions?.shortcutWeekEndDay ?? defaultOptions.shortcutWeekEndDay;
                const currentMaxEarlyPickupMinutes = currentOptions?.maxEarlyPickupMinutes ?? defaultOptions.maxEarlyPickupMinutes;
                const nextShortcutStartHour = normalizeHour(shortcutStartHour, currentShortcutStartHour);
                const nextShortcutEndHour = normalizeHour(shortcutEndHour, currentShortcutEndHour);
                const nextShortcutWeekEndDay = normalizeWeekEndDay(shortcutWeekEndDay, currentShortcutWeekEndDay);
                const nextMaxEarlyPickupMinutes = normalizePositiveMinutes(maxEarlyPickupMinutes, currentMaxEarlyPickupMinutes);

                if (nextShortcutStartHour >= nextShortcutEndHour) {
                    res.status(400).json({message: "L'heure de début doit être avant l'heure de fin"});
                    return;
                }

                const updatedOptions = await db.timeScheduleOptions.upsert({
                    where: {id: currentOptions?.id || 1},
                    update: {
                        onPickup: onPickup !== undefined ? onPickup : undefined,
                        onReturn: onReturn !== undefined ? onReturn : undefined,
                        authorizedDelay: authorizedDelay !== undefined ? authorizedDelay : undefined,
                        maxEarlyPickupMinutes: maxEarlyPickupMinutes !== undefined ? nextMaxEarlyPickupMinutes : undefined,
                        shortcutStartHour: shortcutStartHour !== undefined ? nextShortcutStartHour : undefined,
                        shortcutEndHour: shortcutEndHour !== undefined ? nextShortcutEndHour : undefined,
                        shortcutWeekEndDay: shortcutWeekEndDay !== undefined ? nextShortcutWeekEndDay : undefined,
                    },
                    create: {
                        onPickup: onPickup || 0,
                        onReturn: onReturn || 0,
                        authorizedDelay: authorizedDelay || 0,
                        maxEarlyPickupMinutes: nextMaxEarlyPickupMinutes,
                        shortcutStartHour: nextShortcutStartHour,
                        shortcutEndHour: nextShortcutEndHour,
                        shortcutWeekEndDay: nextShortcutWeekEndDay,
                    },
                });
                res.json(updatedOptions);
                break;

            case 'OPTIONS':
                // Gérer la requête preflight OPTIONS
                const response = NextResponse.next();
                res.setHeader('Allow', ['GET', 'PUT', 'OPTIONS']);
                res.writeHead(204, Object.fromEntries(response.headers.entries()));
                res.end();
                break;

            default:
                res.setHeader('Allow', ['GET', 'PUT']);
                res.status(405).json({message: `Method ${req.method} Not Allowed`});
        }
    } catch (error) {
        console.error('Erreur timeScheduleOptions:', error);
        res.status(500).json({message: 'Erreur lors de la sauvegarde des paramètres de temps'});
    }
} 
