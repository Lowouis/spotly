'use server';
import prisma from "@/prismaconf/init";

export default async function handler(req, res) {
    if(req.method === "GET"){
        const {id } = req.query;
        const resources = await prisma.resource.findUnique({
            where: {
                id : id,
            }
        });
        return res.status(200).json(resources);
    } else if(req.method === "POST"){
        const {name, description, moderate, domains, categories } = req.body;

        const ressource = await prisma.resource.create({
        data : {
            name : name,
            description : description,
            moderate : moderate === "1",
            domains : {
                connect : {
                    id : domains
                }},
            category : {
                connect : {
                    id : categories
                }},
        }})
        return res.status(200).json(ressource);
    }


}