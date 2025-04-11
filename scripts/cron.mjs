import cron from 'node-cron';
import {PrismaClient} from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';


dotenv.config();

const prisma = new PrismaClient();


const logsDir = process.env.LOGS_DIR || path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

const logToFile = (message) => {
    const now = new Date();
    const timestamp = now.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    const logFile = path.join(logsDir, `cron-${now.toISOString().split('T')[0]}.log`);
    const logMessage = `[${timestamp}] ${message}\n`;

    fs.appendFileSync(logFile, logMessage);
};

cron.schedule('* * * * *', async () => {
    logToFile('⏳ Vérification des mises à jour...');

    try {
        const now = new Date();
        logToFile(`${now.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: "2-digit",
            minute: "2-digit"
        })}`);


        // Mise à jour des ressources qui sont dont la réservation et le pickup sont automatisés faire une transaction plus tard ici $transaction
        const autoReservedEntries = await prisma.entry.updateMany({
            data: {
                moderate: "USED"
            },
            where: {
                resource: {
                    OR: [
                        {pickable: {name: "FLUENT" || "HIGH_TRUST"}},
                        {category: {pickable: {name: "FLUENT" || "HIGH_TRUST"}}},
                        {domains: {pickable: {name: "FLUENT" || "HIGH_TRUST"}}},
                    ]
                },
                moderate: "ACCEPTED",
                startDate: {
                    lte: now
                },
                endDate: {
                    gt: now
                }
            }
        });

        logToFile(`🔄 ${autoReservedEntries.count} réservations mis à jour en utilisées (USED)`);

        // Mise a jour des réservations qui sont en retard
        const lateEntries = await prisma.entry.updateMany({
            data: {
                moderate: "DELAYED"
            },
            where: {
                moderate: "USED",
                endDate: {
                    lt: now
                }
            }
        });

        logToFile(`🔄 ${lateEntries.count} ressources mis à jour en retard (DELAYED)`);
        // Mise à jour des ressources dont la réservation et la restitution est automatisés
        const autoReturnedEntries = await prisma.entry.updateMany({
            data: {
                moderate: "ENDED",
                returned: true
            },
            where: {
                resource: {
                    OR: [
                        {pickable: {name: "FLUENT"}},
                        {category: {pickable: {name: "FLUENT"}}},
                        {domains: {pickable: {name: "FLUENT"}}},
                    ],

                },
                moderate: "USED",
                AND: [
                    {
                        endDate: {
                            lt: now
                        }
                    },
                    {
                        startDate: {
                            lt: now
                        }
                    }
                ]
            }
        })
        logToFile(`🔄 ${autoReturnedEntries.count} ressources mis à jour en terminé (ENDED)`);


    } catch (error) {
        logToFile(`❌ Erreur lors de la vérification: ${error.message}`);
        console.error(error);
    }
});