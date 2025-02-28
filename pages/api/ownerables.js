'use server';
import prisma from "@/prismaconf/init";
import {runMiddleware} from "@/lib/core";

export default async function handler(req, res) {
    await runMiddleware(req, res);
    if(req.method === "GET"){
        const users = await prisma.user.findMany({
            where : {
                OR: [
                    {
                        role : "ADMIN"
                    },
                    {
                        role : "SUPERADMIN"
                    }
                ]
            }
        });
        const sanitizedUsers = users.map(({ password, ...rest }) => rest);

        res.status(200).json(sanitizedUsers);
    }

}