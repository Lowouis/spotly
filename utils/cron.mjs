import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

cron.schedule('* * * * *', async () => {
    console.log('⏳ Vérification des mises à jour...');

    try {
        console.log('⏳ Vérification des mises à jour...');
        const now = new Date();
        console.log('Date actuelle:', now.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: "2-digit",
            minute : "2-digit"
        }));

        // Debug des réservations à venir
        const upComingEntries = await prisma.entry.findMany({
            where: {
                moderate: "ACCEPTED",
                OR: [
                    {resource: {pickable: {name: "FLUENT"}}},
                    {resource: {category: {pickable: {name: "FLUENT"}}}},
                    {resource: {domains: {pickable: {name: "FLUENT"}}}}
                ],
                startDate : {
                    lte: now
                },
                endDate : {
                    gt: now
                }
            }
        });
        console.log('🔍 Détails des réservations à venir :', JSON.stringify(upComingEntries, null, 2));

        // Debug des réservations en cours
        const onGoingEntries = await prisma.entry.findMany({
            where: {
                moderate: "USED",
                OR: [
                    {resource: {pickable: {name: "FLUENT" || "HIGH_TRUST"}}},
                    {resource: {category: {pickable: {name: "FLUENT" || "HIGH_TRUST"}}}},
                    {resource: {domains: {pickable: {name: "FLUENT" || "HIGH_TRUST"}}}}
                ],
            },
            include : {
                user : true,
                resource : true
            }
        });
        console.log('🔍 Détails des réservations en cours : ')
        onGoingEntries.forEach(entry => {
            const startDate = new Date(entry.startDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }) + ' à ' + new Date(entry.startDate).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            });

            const endDate = new Date(entry.endDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }) + ' à ' + new Date(entry.endDate).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            console.log(`➡️ ${entry.user.name} ${entry.user.surname} a réservé la ressource : ${entry.resource.name} de ${startDate} au ${endDate}`);
        });

        // Vérification de toutes les réservations (pour debug)
        const allEntries = await prisma.entry.findMany({
            where : {
              moderate : "ACCEPTED" || "WAITING" || "USED"
            },
            include: {
                resource: true
            }
        });
        console.log('📊 Nombre total de réservations active dans la base:', allEntries.length);



    // Correction de la mise à jour des réservations en cours
    for (const entry of onGoingEntries) {
        console.log(entry)
        if (entry.endDate <= now) {
            await prisma.entry.update({
                where: {
                    id: entry.id
                },
                data: {
                    moderate: 'ENDED',
                    returned : entry.returned
                },
            });
            console.log(`🔄 Réservation ${entry.id} terminée`);
        }
    }

    // Correction de la mise à jour des réservations à venir
    for (const entry of upComingEntries) {
        if (entry.startDate <= now && entry.endDate >= now) {
            await prisma.entry.update({
                where: {
                    id: entry.id
                },
                data: {
                    moderate: 'USED'
                },
            });
            console.log(`🔄 Réservation ${entry.id} passée en USED`);
        }
        if (entry.endDate <= now) {
            await prisma.entry.update({
                where: {
                    id: entry.id
                },
                data: {
                    moderate: 'ENDED'
                },
            });
            console.log(`🔄 Réservation ${entry.id} terminée`);
        }
    }
    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error);
    }
});