'use server';
import prisma from "@/prismaconf/init";

export default async function handler(req, res) {
    try {
        const { userId, otherParams } = req.query;

        const entries = await prisma.entry.findMany({
            where: {
                userId: userId
            },
            include: { resource: { include: { domains : true } } }
        });
        console.log(entries);
        res.status(200).json(entries);
    } catch (error) {
        console.error("Failed to parse JSON:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}