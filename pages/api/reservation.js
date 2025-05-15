import {runMiddleware} from "@/lib/core";
import prisma from "@/prismaconf/init";

export default async function reservation(req, res) {
    await runMiddleware(req, res);
    try {
        if (req.method === "GET") {
            const {startDate, endDate, siteId, categoryId, resourceId, recurrent_unit, recurrent_limit} = req.query;
            console.log(req.query);
            // Controller la cohérence de recurrence
            if (recurrent_unit === "jour") {
                const startDateTime = new Date(startDate);
                const endDateTime = new Date(endDate);
                if (
                    startDateTime.getFullYear() !== endDateTime.getFullYear() ||
                    startDateTime.getMonth() !== endDateTime.getMonth() ||
                    startDateTime.getDate() !== endDateTime.getDate()
                ) {
                    return res.status(400).json({message: "Les dates de début et de fin doivent être sur le même jour calendaire"});
                }
            }
            if (recurrent_unit === "hebdomadaire") {
                const startDateTime = new Date(startDate);
                const endDateTime = new Date(endDate);
                const diffTime = Math.abs(endDateTime - startDateTime);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (startDateTime.getDay() !== endDateTime.getDay()) {
                    return res.status(400).json({message: "Les dates de début et de fin doivent être sur le même jour de la semaine pour une récurrence hebdomadaire"});
                }

                if (diffDays > 7) {
                    return res.status(400).json({message: "L'intervalle entre la date de début et de fin ne doit pas dépasser 7 jours pour une récurrence hebdomadaire"});
                }
            }

            const timeScheduleOptions = await prisma.timeScheduleOptions.findMany({
                where: {
                    id: 1
                }
            });

            // Fonction helper pour générer les dates récurrentes
            const generateRecurrentDates = (start, end, unit) => {
                const dates = [];
                const startDate = new Date(start);
                const endDate = new Date(end);
                const recurrentEndDate = new Date(recurrent_limit);

                if (startDate > recurrentEndDate) {
                    return dates;
                }

                do {
                    const periodStart = new Date(startDate);
                    const periodEnd = new Date(endDate);

                    if (periodEnd > recurrentEndDate) {
                        break;
                    }

                    dates.push({
                        start: periodStart,
                        end: periodEnd,
                        available: true
                    });

                    switch (unit) {
                        case 'jour':
                            startDate.setDate(startDate.getDate() + 1);
                            endDate.setDate(endDate.getDate() + 1);
                            break;
                        case 'hebdomadaire':
                            startDate.setDate(startDate.getDate() + 7);
                            endDate.setDate(endDate.getDate() + 7);
                            break;
                    }
                } while (endDate <= recurrentEndDate); // Modifié pour inclure le dernier jour

                return dates;
            };

            const ajustedStartDate = new Date(new Date(startDate).getTime() - timeScheduleOptions[0].onPickup * 60000);
            const ajustedEndDate = new Date(new Date(endDate).getTime() + timeScheduleOptions[0].onReturn * 60000);

            // Générer les dates à vérifier
            const datesToCheck = recurrent_unit ?
                generateRecurrentDates(ajustedStartDate, ajustedEndDate, recurrent_unit) :
                [{start: ajustedStartDate, end: ajustedEndDate, available: true}];
            console.log(datesToCheck);
            console.log(recurrent_limit);
            // Vérifier la disponibilité pour chaque date
            for (let dateSlot of datesToCheck) {
                const conflictingEntries = await prisma.entry.findMany({
                    where: {
                        AND: [
                            {
                                OR: [
                                    {moderate: "ACCEPTED"},
                                    {moderate: "USED"},
                                    {moderate: "BLOCKED"},
                                    {moderate: "WAITING"}
                                ]
                            },
                            {
                                startDate: {lte: dateSlot.end},
                                endDate: {gte: dateSlot.start}
                            },
                            {
                                resource: {
                                    ...(resourceId && {id: parseInt(resourceId)}),
                                    ...(siteId && categoryId && {
                                        domains: {id: parseInt(siteId)},
                                        category: {id: parseInt(categoryId)},
                                    })
                                }
                            }
                        ]
                    }
                });

                dateSlot.available = conflictingEntries.length === 0;
            }

            // Récupérer les ressources concernées
            const resources = await prisma.resource.findMany({
                where: {
                    ...(resourceId && {id: parseInt(resourceId)}),
                    ...(siteId && categoryId && {
                        domains: {id: parseInt(siteId)},
                        category: {id: parseInt(categoryId)},
                    })
                },
                include: {
                    domains: {include: {owner: true, pickable: true}},
                    category: {include: {owner: true, pickable: true}},
                    pickable: true,
                    owner: true
                }
            });


            if (resources.length === 0) {
                res.status(404).json({message: "No resources available for these dates"});
            } else {
                // Retourner un tableau contenant les ressources et leurs disponibilités
                const response = resources.map(resource => ({
                    ...resource,
                    availability: datesToCheck
                })).filter(resource => resource.availability.some(slot => slot.available));

                if (response.length === 0) {
                    res.status(404).json({message: "No resources available for these dates"});
                } else {
                    res.status(200).json(response);
                }
            }
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({error: "Not authorized"});
    }
}