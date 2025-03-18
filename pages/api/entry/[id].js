import prisma from "@/prismaconf/init";
import {runMiddleware} from "@/lib/core";

export default async function handler(req, res) {

    await runMiddleware(req, res);

    const { id } = req.query;

    if (req.method === "PUT") {
        try {
            const {moderate, returned, adminNote} = req.body;
            console.log(returned);
            const entry = await prisma.entry.update({
                where: {
                    id: parseInt(id)
                },
                data: {
                    ...(moderate && { moderate }),
                    ...(adminNote && {adminNote}),
                    ...(returned && {
                        returned: returned,
                        endDate: new Date()
                    })
                }
            });
            
            return res.status(200).json(entry);
        } catch (error) {
            console.error("Failed to update entry:", error);
            return res.status(500).json({error: "Failed to update entry"});
        }
    } else if(req.method === "DELETE"){
        const { id } = req.query;
        const entry = await prisma.entry.delete({
            where: {
                id: parseInt(id)
            }
        });

        res.status(200).json(entry);
    }

    return res.status(405).json({ message: "Method not allowed" });
}