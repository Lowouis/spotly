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
        description: "Aucune action nécessaire de la part de l'utilisateur.",
        cgu: "En utilisant cette ressource, vous acceptez que la réservation soit automatiquement validée sans action supplémentaire de votre part. Vous restez responsable du respect des horaires de début et de fin de réservation."
    },
    {
        name: "HIGH_TRUST",
        description: "L'utilisateur doit cliquer sur sa réservation, pour confirmer que la ressource est restitué.",
        cgu: "En utilisant cette ressource, vous vous engagez à confirmer manuellement la restitution de la ressource via l'interface de l'application. La non-confirmation sera considérée comme un retard de restitution."
    },
    {
        name: "LOW_TRUST",
        description: "Pickable pour les ressources de niveau de confiance bas",
        cgu: "En utilisant cette ressource à niveau de confiance bas, vous acceptez d'être soumis à des vérifications supplémentaires. Tout manquement aux règles d'utilisation pourra entraîner une suspension temporaire de vos droits de réservation."
    },
    {
        name: "DIGIT",
        description: "Récupération et restitution de la ressource par un code à 6 chiffres envoyé par mail.",
        cgu: "En utilisant cette ressource, vous vous engagez à utiliser le code à 6 chiffres qui vous sera envoyé par email pour confirmer la prise et le retour de la ressource. Sans la saisie de ce code, la ressource sera considérée comme non-restituée."
    },
    {
        name: "LOW_AUTH",
        description: "Pickable pour les ressources de niveau de confiance bas",
        cgu: "En utilisant cette ressource à authentification simple, vous acceptez de suivre les procédures de base de vérification. Toute utilisation non conforme sera signalée et pourra entraîner des restrictions d'accès."
    },
    {
        name: "HIGH_AUTH",
        description: "Pickable pour les ressources de niveau de confiance élevé",
        cgu: "En utilisant cette ressource à authentification renforcée, vous acceptez de vous soumettre à des procédures de vérification strictes. Le non-respect des procédures d'authentification entraînera un refus immédiat d'accès à la ressource."
    }
];

async function main() {
    // First check if admin user exists
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
        // First delete existing pickables
        await prisma.pickable.deleteMany({});
        console.log("Existing pickables deleted");

        // Then create new pickables with CGU
        await prisma.pickable.createMany({
            data: pickables
        });
        console.log("New pickables created with CGU");
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