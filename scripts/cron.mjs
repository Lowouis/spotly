import cron from 'node-cron';
import {PrismaClient} from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';


dotenv.config();

const prisma = new PrismaClient();


const logsDir = process.env.LOGS_DIR
    ? path.resolve(process.env.LOGS_DIR)
    : path.resolve(__dirname, '..', 'logs');
try {
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, {recursive: true});
    }
} catch (e) {
    console.error('[cron] Unable to create logs directory:', logsDir, e.message);
}
console.log('[cron] Logs directory:', logsDir);

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

    try {
        fs.appendFileSync(logFile, logMessage);
    } catch (e) {
        console.error('[cron] Failed to write log file:', e.message);
    }
    console.log(logMessage.trim());
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

        // Auto-return FLUENT
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

        // Information retard
        const lateEntriesCount = await prisma.entry.count({
            where: {
                moderate: "USED",
                returned: false,
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

// Vérification journalière des retards (alerte e-mail)
const runDailyLateCheck = async () => {
    try {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const lateEntries = await prisma.entry.findMany({
            where: {
                moderate: 'USED',
                returned: false,
                endDate: {lt: now, gte: yesterday},
            },
            include: {
                user: true,
                resource: true,
            },
        });
        if (!lateEntries.length) {
            logToFile('📬 Daily late-check: aucun nouvel envoi');
            return;
        }
        for (const e of lateEntries) {
            try {
                await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/mail/sendEmail`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        to: e.user.email,
                        subject: `Retard de restitution - ${e.resource.name}`,
                        templateName: 'reservationDelayedAlert',
                        data: {resource: e.resource, endDate: e.endDate},
                    }),
                });
                logToFile(`📧 Alerte retard envoyée à ${e.user.email} (${e.resource.name})`);
            } catch (err) {
                logToFile(`⚠️ Échec envoi e-mail retard à ${e.user.email}: ${err.message}`);
            }
        }
    } catch (err) {
        logToFile(`❌ Daily late-check error: ${err.message}`);
    }
};

// Tous les jours à 07:00
cron.schedule('0 7 * * *', runDailyLateCheck);