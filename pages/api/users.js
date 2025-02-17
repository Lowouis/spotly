'use server';
import prisma from "@/prismaconf/init";

export default async function handler(req, res) {
    if(req.method === "GET"){
        const {ownerable} = req.query;
        console.log(ownerable);
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