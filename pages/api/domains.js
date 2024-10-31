'use server';
import prisma from "@/prismaconf/init";

export default async function handler(req, res) {
    if(req.method === "GET"){
        const domains = await prisma.domain.findMany();
        res.status(200).json(domains);
    } else if (req.method === "POST"){
        const {name, code, address, street_number, country, city, zip, phone} = req.body;
        const domain = await prisma.domain.create({
            data: {
                name,
                code,
                address,
                street_number,
                country,
                city,
                zip,
                phone
            }
        });
        res.status(200).json(domain);
    }

}