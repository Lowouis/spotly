import {PrismaClient} from '@prisma/client'
import bycrypt from "bcrypt";

const prisma = new PrismaClient()

const pickables = [
    {
        name: "FLUENT",
        description: "Pickable pour les ressources de niveau de confiance élevé",
    },
    {
        name: "HIGH_TRUST",
        description: "Pickable pour les ressources de niveau de confiance élevé",
    },
    {
        name: "LOW_TRUST",
        description: "Pickable pour les ressources de niveau de confiance bas",
    },
    {
        name: "DIGIT",
        description: "Pickable pour les ressources de niveau de confiance nul",
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


}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })