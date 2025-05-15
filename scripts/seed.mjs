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

async function main() {

    const existingUser = await prisma.user.findUnique({
        where: {
            email: "admin@spotly.fr"
        }
    });

    if (!existingUser) {
        const password = await bycrypt.hash("admin", 10);
        try {
            await prisma.user.create({
                data: {
                    name: "admin",
                    email: "admin@spotly.fr",
                    surname: "admin",
                    username: "admin",
                    password: password,
                    role: "SUPERADMIN",
                    external: false,
                }
            });
            console.log("Admin user created successfully");
        } catch (e) {
            console.error("Error creating admin user:", e);
        }
    } else {
        console.log("Admin user already exists, skipping creation");
    }

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


}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })