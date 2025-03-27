import cron from 'node-cron';
import {PrismaClient} from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Use LOGS_DIR from environment variables
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
    console.log(message);
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

        // Mise à jour des ressources qui sont en cours d'utilisation
        const entries = await prisma.resource.updateMany({
            data: {
                status: "UNAVAILABLE"
            },
            where: {
                NOT: {
                    status: "UNAVAILABLE"
                },
                entry: {
                    some: {
                        moderate: 'USED',
                        endDate: {
                            gte: now
                        }
                    }
                }
            }
        });
        logToFile(`🔄 ${entries.count} ressources mis à jour en non-disponible (UNAVAILABLE)`);

        // Mise à jour des ressources qui ne sont plus utilisées
        const unusedEntries = await prisma.resource.updateMany({
            data: {
                status: "AVAILABLE"
            },
            where: {
                NOT: {
                    status: "AVAILABLE"
                },
                entry: {
                    none: {
                        moderate: 'USED',
                        endDate: {
                            gte: now
                        }
                    }
                }
            }
        });

        logToFile(`🔄 ${unusedEntries.count} ressources mis à jour en disponible (AVAILABLE)`);


        // Mise à jour des ressources qui sont dont la réservation et le pickup sont automatisés
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

        logToFile(`🔄 ${autoReservedEntries.count} ressources mis à jour en utilisées (USED)`);

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



        // Mise à jour des ressources qui sont dont la réservation et la restitution est automatisés
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
        logToFile('---------- 🔍 Détails des réservations -----------');
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
            logToFile(`➡️ ${entry.user.name} ${entry.user.surname} a réservé la ressource : ${entry.resource.name} de ${startDate} au ${endDate}`);
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
        logToFile(`📊 Nombre total de réservations active dans la base: ${allEntries.length}`);


        // Vérification que les ressources modérable ont bien au moins un propriétaire par leur catégorie ou leur domaine
        const resourcesWithNoOwner = await prisma.resource.updateMany({
            data: {
                moderate: false
            },
            where: {
                NOT: {
                    moderate: false
                },
                AND: [
                    {
                        category: {
                            owner: null
                        }
                },
                    {
                        domains: {
                            owner: null
                        }
                    },
                    {
                        owner: null
                    }
                ]
            }
        });

        logToFile(`🔄 ${resourcesWithNoOwner.count} ressources mis à jour en non-modérable`);
    } catch (error) {
        logToFile(`❌ Erreur lors de la vérification: ${error.message}`);
        console.error(error);
    }
});