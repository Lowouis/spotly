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

const runCronCycle = async () => {
    logToFile('⏳ Vérification des mises à jour...');

    try {
        const now = new Date();
        logToFile(`${now.toLocaleString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`);

        // Sécurité rétroactive si la cron a été interrompue
        // 1) Passer en USED les réservations ACCEPTED éligibles à l'auto-pickup dont la période a déjà commencé
        const retroAcceptedToUsedResource = await prisma.entry.updateMany({
            data: {moderate: "USED"},
            where: {
                moderate: "ACCEPTED",
                startDate: {lte: now},
                endDate: {gt: now},
                resource: {
                    pickable: {name: {in: ["FLUENT", "HIGH_TRUST"]}}
                }
            }
        });
        const retroAcceptedToUsedCategory = await prisma.entry.updateMany({
            data: {moderate: "USED"},
            where: {
                moderate: "ACCEPTED",
                startDate: {lte: now},
                endDate: {gt: now},
                resource: {
                    pickable: null,
                    category: {pickable: {name: {in: ["FLUENT", "HIGH_TRUST"]}}}
                }
            }
        });
        const retroAcceptedToUsedDomain = await prisma.entry.updateMany({
            data: {moderate: "USED"},
            where: {
                moderate: "ACCEPTED",
                startDate: {lte: now},
                endDate: {gt: now},
                resource: {
                    pickable: null,
                    category: {pickable: null},
                    domains: {pickable: {name: {in: ["FLUENT", "HIGH_TRUST"]}}}
                }
            }
        });
        const totalRetroAcceptedToUsed = retroAcceptedToUsedResource.count + retroAcceptedToUsedCategory.count + retroAcceptedToUsedDomain.count;
        logToFile(`🛟 Rattrapage: ${totalRetroAcceptedToUsed} réservations ACCEPTED passées en USED (auto-pickup)`);

        // 2) Passer en ENDED + returned=true les réservations ACCEPTED éligibles à l'auto-return (FLUENT) dont la fin est passée
        const retroAcceptedToEndedResource = await prisma.entry.updateMany({
            data: {moderate: "ENDED", returned: true},
            where: {
                moderate: "ACCEPTED",
                endDate: {lt: now},
                resource: {pickable: {name: "FLUENT"}}
            }
        });
        const retroAcceptedToEndedCategory = await prisma.entry.updateMany({
            data: {moderate: "ENDED", returned: true},
            where: {
                moderate: "ACCEPTED",
                endDate: {lt: now},
                resource: {
                    pickable: null,
                    category: {pickable: {name: "FLUENT"}}
                }
            }
        });
        const retroAcceptedToEndedDomain = await prisma.entry.updateMany({
            data: {moderate: "ENDED", returned: true},
            where: {
                moderate: "ACCEPTED",
                endDate: {lt: now},
                resource: {
                    pickable: null,
                    category: {pickable: null},
                    domains: {pickable: {name: "FLUENT"}}
                }
            }
        });
        const totalRetroAcceptedToEnded = retroAcceptedToEndedResource.count + retroAcceptedToEndedCategory.count + retroAcceptedToEndedDomain.count;
        logToFile(`🛟 Rattrapage: ${totalRetroAcceptedToEnded} réservations ACCEPTED passées en ENDED (auto-return FLUENT)`);

        // 3) Information: ACCEPTED expirées non auto-return (HIGH_TRUST / sans FLUENT)
        const acceptedExpiredNonAuto = await prisma.entry.count({
            where: {
                moderate: "ACCEPTED",
                endDate: {lt: now},
                OR: [
                    {resource: {pickable: {name: {in: ["HIGH_TRUST"]}}}},
                    {resource: {pickable: null, category: {pickable: {name: {in: ["HIGH_TRUST"]}}}}},
                    {
                        resource: {
                            pickable: null,
                            category: {pickable: null},
                            domains: {pickable: {name: {in: ["HIGH_TRUST"]}}}
                        }
                    },
                    {
                        resource: {
                            pickable: null,
                            category: {pickable: null},
                            domains: {pickable: {name: {notIn: ["FLUENT", "HIGH_TRUST"]}}}
                        }
                    }
                ]
            }
        });
        if (acceptedExpiredNonAuto > 0) {
            logToFile(`ℹ️ ${acceptedExpiredNonAuto} réservations ACCEPTED expirées non auto-return (à traiter manuellement)`);
        }

        // Mise à jour des ressources qui sont dont la réservation et le pickup sont automatisés avec priorité pickable > category > domains
        // Cas 1 : priorité ressource
        const autoReservedEntriesResource = await prisma.entry.updateMany({
            data: {moderate: "USED"},
            where: {
                resource: {
                    pickable: {name: {in: ["FLUENT", "HIGH_TRUST"]}}
                },
                moderate: "ACCEPTED",
                startDate: {lte: now},
                endDate: {gt: now}
            }
        });

        // Cas 2 : priorité catégorie (seulement si resource.pickable est null)
        const autoReservedEntriesCategory = await prisma.entry.updateMany({
            data: {moderate: "USED"},
            where: {
                resource: {
                    pickable: null,
                    category: {pickable: {name: {in: ["FLUENT", "HIGH_TRUST"]}}}
                },
                moderate: "ACCEPTED",
                startDate: {lte: now},
                endDate: {gt: now}
            }
        });

        // Cas 3 : priorité domaine (seulement si resource.pickable et category.pickable sont null)
        const autoReservedEntriesDomain = await prisma.entry.updateMany({
            data: {moderate: "USED"},
            where: {
                resource: {
                    pickable: null,
                    category: {pickable: null},
                    domains: {pickable: {name: {in: ["FLUENT", "HIGH_TRUST"]}}}
                },
                moderate: "ACCEPTED",
                startDate: {lte: now},
                endDate: {gt: now}
            }
        });

        const totalAutoReserved = autoReservedEntriesResource.count + autoReservedEntriesCategory.count + autoReservedEntriesDomain.count;
        logToFile(`🔄 ${totalAutoReserved} réservations mis à jour en utilisées (USED)`);
        // Mise à jour des ressources dont la réservation et la restitution est automatisée (priorité pickable > category > domains, uniquement FLUENT)
        // Cas 1 : priorité ressource
        const autoReturnedEntriesResource = await prisma.entry.updateMany({
            data: {moderate: "ENDED", returned: true},
            where: {
                resource: {
                    pickable: {name: "FLUENT"}
                },
                moderate: "USED",
                AND: [
                    {endDate: {lt: now}},
                    {startDate: {lt: now}}
                ]
            }
        });

        // Cas 2 : priorité catégorie (seulement si resource.pickable est null)
        const autoReturnedEntriesCategory = await prisma.entry.updateMany({
            data: {moderate: "ENDED", returned: true},
            where: {
                resource: {
                    pickable: null,
                    category: {pickable: {name: "FLUENT"}}
                },
                moderate: "USED",
                AND: [
                    {endDate: {lt: now}},
                    {startDate: {lt: now}}
                ]
            }
        });

        // Cas 3 : priorité domaine (seulement si resource.pickable et category.pickable sont null)
        const autoReturnedEntriesDomain = await prisma.entry.updateMany({
            data: {moderate: "ENDED", returned: true},
            where: {
                resource: {
                    pickable: null,
                    category: {pickable: null},
                    domains: {pickable: {name: "FLUENT"}}
                },
                moderate: "USED",
                AND: [
                    {endDate: {lt: now}},
                    {startDate: {lt: now}}
                ]
            }
        });

        const totalAutoReturned = autoReturnedEntriesResource.count + autoReturnedEntriesCategory.count + autoReturnedEntriesDomain.count;
        logToFile(`🔄 ${totalAutoReturned} ressources mis à jour en terminé (ENDED)`);

        // Mise à jour des réservations en retard (après auto-return)
        const lateEntriesCount = await prisma.entry.count({
            where: {
                moderate: "USED",
                endDate: {lt: now}
            }
        });
        logToFile(`ℹ️ ${lateEntriesCount} réservations en retard (toujours en USED)`);

    } catch (error) {
        logToFile(`❌ Erreur lors de la vérification: ${error.message}`);
        console.error(error);
    }
};

// Planification horaire
const task = cron.schedule('*/30 * * * *', runCronCycle);

// Exécution immédiate au démarrage si demandé
if (process.env.RUN_AT_START === '1') {
    runCronCycle().catch(() => {
    });
}

// Exécution unique pour test rapide
if (process.env.RUN_ONCE === '1') {
    runCronCycle()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}