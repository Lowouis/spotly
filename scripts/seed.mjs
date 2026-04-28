import {PrismaClient} from '@prisma/client'
import bycrypt from "bcrypt";

const prisma = new PrismaClient()

const default_time_options = [{
    id: 1,
    onPickup: 0,
    onReturn: 0,
    authorizedDelay: 0
}]

const pickables = [
    {
        name: "FLUENT",
        distinguishedName: "SANS PROTECTION",
        description: "Aucune action nécessaire de la part de l'utilisateur.",
        cgu: "En utilisant cette ressource, vous acceptez que la réservation soit automatiquement validée sans action supplémentaire de votre part. Vous restez responsable du respect des horaires de début et de fin de réservation."
    },
    {
        name: "HIGH_TRUST",
        distinguishedName: "CLIQUE DE RÉSTITUTION",
        description: "L'utilisateur doit cliquer sur sa réservation, pour confirmer que la ressource est restitué.",
        cgu: "En utilisant cette ressource, vous vous engagez à confirmer manuellement la restitution de la ressource via l'interface de l'application. La non-confirmation sera considérée comme un retard de restitution."
    },
    {
        name: "LOW_TRUST",
        distinguishedName: "PAR CLIQUE",
        description: "Pickable pour les ressources de niveau de confiance bas",
        cgu: "En utilisant cette ressource, vous acceptez de récupèrer et restituer la ressource en cliquant sur le bouton 'Récupérer' ou 'Restituer' dans l'interface de l'application. Tout manquement pourra entraîner une suspension temporaire de vos droits de réservation."
    },
    {
        name: "DIGIT",
        distinguishedName: "PAR CODE",
        description: "Récupération et restitution de la ressource par un code à 6 chiffres envoyé par mail.",
        cgu: "En utilisant cette ressource, vous vous engagez à utiliser le code à 6 chiffres qui vous sera envoyé par email pour confirmer la récupération et le réstitution de la ressource dans la section Réservations de l'application."
    },
    {
        name: "LOW_AUTH",
        distinguishedName: "SANS CONNEXION",
        description: "Pickable pour les ressources de niveau de confiance bas",
        cgu: "En utilisant cette ressource, vous vous engagez à utiliser le code à 6 chiffres qui vous sera envoyé par email pour confirmer la récupération et le réstitution de la ressource dans la section Réservations de l'application ou sans connexion à l'application via l'onglet J'ai deja réservé."
    },
    {
        name: "HIGH_AUTH",
        distinguishedName: "RESTRICTION PAR IP",
        description: "Pickable pour les ressources de niveau de confiance élevé",
        cgu: "En utilisant cette ressource, vous acceptez qu'elle doit être récupérée et restituée uniquement depuis des machines spécifiques. vous vous engagez à utiliser le code à 6 chiffres qui vous sera envoyé par email pour confirmer la récupération et le réstitution de la ressource dans la section Réservations de l'application ou sans connexion à l'application via l'onglet J'ai deja réservé."
    }
];

const withTestData = process.argv.includes('--with-test-data');
const isProduction = process.env.NODE_ENV === 'production';
const hasProductionConfirmation = process.argv.includes('--confirm-production');
const adminSeed = {
    name: process.env.SEED_ADMIN_NAME || 'admin',
    surname: process.env.SEED_ADMIN_SURNAME || 'admin',
    username: process.env.SEED_ADMIN_USERNAME || 'admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@spotly.fr',
    password: process.env.SEED_ADMIN_PASSWORD || 'admin',
};

const testDomains = Array.from({length: 10}, (_, i) => ({
    name: `Site Test ${i + 1}`
}));

const testCategories = Array.from({length: 10}, (_, i) => ({
    name: `Catégorie Test ${i + 1}`,
    description: `Description de la catégorie ${i + 1}`
}));

const resourcesPerCategory = 6;

const testUsers = [
    {
        name: "Alice",
        surname: "Martin",
        username: "alice",
        email: "alice.martin@spotly.test",
        role: "USER",
    },
    {
        name: "Karim",
        surname: "Benali",
        username: "karim",
        email: "karim.benali@spotly.test",
        role: "USER",
    },
    {
        name: "Sophie",
        surname: "Durand",
        username: "sophie",
        email: "sophie.durand@spotly.test",
        role: "ADMIN",
    },
    {
        name: "Thomas",
        surname: "Petit",
        username: "thomas",
        email: "thomas.petit@spotly.test",
        role: "USER",
    },
    {
        name: "Nadia",
        surname: "Robert",
        username: "nadia",
        email: "nadia.robert@spotly.test",
        role: "ADMIN",
    },
];

const testLocations = [
    {libelle: "Accueil", ip: "192.168.1.10"},
    {libelle: "Salle informatique", ip: "192.168.1.20"},
    {libelle: "Atelier", ip: "192.168.1.30"},
];

function addDays(date, days) {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
}

async function upsertFirst(model, where, data) {
    const existing = await prisma[model].findFirst({where});

    if (existing) {
        return prisma[model].update({
            where: {id: existing.id},
            data,
        });
    }

    return prisma[model].create({data});
}

function assertProductionAdminSeed() {
    const required = ['SEED_ADMIN_EMAIL', 'SEED_ADMIN_USERNAME', 'SEED_ADMIN_PASSWORD'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Production seed requires ${missing.join(', ')}`);
    }

    if (adminSeed.password.length < 12) {
        throw new Error('Production seed requires SEED_ADMIN_PASSWORD with at least 12 characters');
    }
}

async function seedAdminUser() {
    if (isProduction) {
        assertProductionAdminSeed();
    }

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                {email: adminSeed.email},
                {username: adminSeed.username},
            ],
        },
    });

    if (existingUser) {
        await prisma.user.update({
            where: {id: existingUser.id},
            data: {
                name: adminSeed.name,
                surname: adminSeed.surname,
                username: adminSeed.username,
                email: adminSeed.email,
                role: 'SUPERADMIN',
                external: false,
            },
        });
        console.log('Admin user already exists, updated profile and role');
        return;
    }

    const password = await bycrypt.hash(adminSeed.password, 10);

    await prisma.user.create({
        data: {
            name: adminSeed.name,
            email: adminSeed.email,
            surname: adminSeed.surname,
            username: adminSeed.username,
            password,
            role: 'SUPERADMIN',
            external: false,
        },
    });
    console.log('Admin user created successfully');
}

async function main() {

    if (isProduction && !hasProductionConfirmation) {
        throw new Error('Production seed requires --confirm-production');
    }

    await seedAdminUser();

    try {
        for (const pickable of pickables) {
            await prisma.pickable.upsert({
                where: {name: pickable.name},
                update: pickable,
                create: pickable,
            });
        }
        console.log("Pickables upserted (créés ou mis à jour)");
    } catch (e) {
        console.error("Error managing pickables:", e);
    }

    try {
        await prisma.timeScheduleOptions.createMany({
            data: default_time_options
        })
        console.log("Times schedules options created")
    } catch (e) {
        console.log("Times schedules options already created");
    }

    // Ajout des données de test si demandé
    if (withTestData) {
        const demoPassword = await bycrypt.hash("password", 10);

        for (const user of testUsers) {
            await prisma.user.upsert({
                where: {username: user.username},
                update: {
                    ...user,
                    external: false,
                },
                create: {
                    ...user,
                    password: demoPassword,
                    external: false,
                },
            });
        }
        console.log("Données de test : utilisateurs créés ou mis à jour");

        for (const location of testLocations) {
            await prisma.authorizedLocation.upsert({
                where: {ip: location.ip},
                update: location,
                create: location,
            });
        }
        console.log("Données de test : localisations autorisées créées ou mises à jour");

        const fluentPickable = await prisma.pickable.findUnique({where: {name: "FLUENT"}});
        const lowTrustPickable = await prisma.pickable.findUnique({where: {name: "LOW_TRUST"}});
        const highAuthPickable = await prisma.pickable.findUnique({where: {name: "HIGH_AUTH"}});
        const adminOwner = await prisma.user.findUnique({where: {username: "sophie"}});

        // Domains (sites)
        for (let i = 0; i < testDomains.length; i++) {
            const domain = testDomains[i];
            await upsertFirst('domain', {name: domain.name}, {
                ...domain,
                pickableId: i % 3 === 0 ? highAuthPickable.id : fluentPickable.id,
                ownerId: i % 2 === 0 ? adminOwner.id : null,
            });
        }
        console.log("Données de test : sites créés ou mis à jour");

        // Categories
        for (let i = 0; i < testCategories.length; i++) {
            const category = testCategories[i];
            await upsertFirst('category', {name: category.name}, {
                ...category,
                pickableId: i % 2 === 0 ? lowTrustPickable.id : fluentPickable.id,
                ownerId: i % 3 === 0 ? adminOwner.id : null,
            });
        }
        console.log("Données de test : catégories créées ou mises à jour");

        // Resources (liées à des sites et catégories existants)
        const allDomains = await prisma.domain.findMany();
        const allCategories = await prisma.category.findMany();
        let resourceIndex = 0;
        for (const category of allCategories) {
            for (let i = 0; i < resourcesPerCategory; i++) {
                resourceIndex += 1;
                const domain = allDomains[resourceIndex % allDomains.length];
                await upsertFirst('resource', {name: `${category.name} - Ressource ${i + 1}`}, {
                    name: `${category.name} - Ressource ${i + 1}`,
                    description: `Ressource de démonstration ${i + 1} pour ${category.name}`,
                    moderate: false,
                    domainId: domain.id,
                    categoryId: category.id,
                    pickableId: resourceIndex % 5 === 0 ? highAuthPickable.id : null,
                    ownerId: resourceIndex % 4 === 0 ? adminOwner.id : null,
                    status: resourceIndex % 7 === 0 ? "UNAVAILABLE" : "AVAILABLE",
                });
            }
        }
        console.log("Données de test : ressources créées ou mises à jour");

        const demoUsers = await prisma.user.findMany({
            where: {username: {in: testUsers.map(user => user.username)}},
        });
        const demoResources = await prisma.resource.findMany({
            where: {description: {startsWith: "Ressource de démonstration"}},
            take: 10,
            orderBy: {id: 'asc'},
        });

        for (let i = 0; i < Math.min(demoUsers.length, demoResources.length); i++) {
            const startDate = addDays(new Date(), i + 1);
            startDate.setHours(9 + (i % 4), 0, 0, 0);
            const endDate = new Date(startDate);
            endDate.setHours(startDate.getHours() + 2);

            const existingEntry = await prisma.entry.findFirst({
                where: {
                    userId: demoUsers[i].id,
                    resourceId: demoResources[i].id,
                    startDate,
                    endDate,
                },
            });

            if (!existingEntry) {
                await prisma.entry.create({
                    data: {
                        userId: demoUsers[i].id,
                        resourceId: demoResources[i].id,
                        startDate,
                        endDate,
                        moderate: i % 3 === 0 ? "WAITING" : "ACCEPTED",
                        comment: `Réservation fictive ${i + 1}`,
                    },
                });
            }
        }
        console.log("Données de test : réservations fictives créées");
    }


}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
