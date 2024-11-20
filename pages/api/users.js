'use server';
import prisma from "@/prismaconf/init";

export default async function handler(req, res) {
    if(req.method === "GET"){
        const users = await prisma.user.findMany();
        const sanitizedUsers = users.map(({ password, ...rest }) => rest);

        res.status(200).json(sanitizedUsers);
    }

}