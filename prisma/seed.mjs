import {PrismaClient} from '@prisma/client'
import bycrypt from "bcrypt";

const prisma = new PrismaClient()

const default_time_options = [{
    id: 1,
    onPickup: 0,
    onReturn: 0
}]

const pickables = [
    {
        name: "FLUENT",
        description: "Aucune action nécessaire de la part de l’utilisateur.",
    },
    {
        name: "HIGH_TRUST",
        description: "L’utilisateur doit cliquer sur sa réservation, pour confirmer que la ressource est restitué.",
    },
    {
        name: "LOW_TRUST",
        description: "Pickable pour les ressources de niveau de confiance bas",
    },
    {
        name: "DIGIT",
        description: "Récupération et restitution de la ressource par un code à 6 chiffres envoyé par mail.",
    },
    {
        name: "LOW_AUTH",
        description: "Pickable pour les ressources de niveau de confiance bas",
    },
    {
        name: "HIGH_AUTH",
        description: "Pickable pour les ressources de niveau de confiance élevé",
    }
];

async function main() {

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
        console.log("Users created");
    } catch (e) {
        console.log("User already exists");
    }

    try {
        await prisma.pickable.createMany({
            data: pickables
        });
        console.log("Pickables created");

    } catch (e) {
        console.log("Pickables already exists");
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