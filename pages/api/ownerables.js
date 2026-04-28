'use server';
import db from "@/server/services/databaseService";
import {runMiddleware} from "@/services/server/core";

export default async function handler(req, res) {
    await runMiddleware(req, res);
    if(req.method === "GET"){
        const users = await db.user.findMany({
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