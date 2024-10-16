'use server';
import prisma from "@/prismaconf/init";

export default async function handler(req, res) {
    const domains = await prisma.domain.findMany();
    res.status(200).json(domains);
}