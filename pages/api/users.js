'use server';
import prisma from "@/prismaconf/init";
import bycrypt from 'bcrypt';
import {runMiddleware} from "@/lib/core";

export default async function handler(req, res) {
    await runMiddleware(req, res);
    if(req.method === "GET"){
        const { id } = req.body;
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { role: "ADMIN" },
                    { role: "SUPERADMIN" },
                    { role: "USER" },
                ],
                ...(id && { id : id })
            },
        });
        const sanitizedUsers = users.map(({ password, ...rest }) => rest);

        res.status(200).json(sanitizedUsers);
    }  else if (req.method === "POST") {

        const { email, name, surname, username, password, role } = req.body;

        if (!username) {
            return res.status(400).json({error: "Username is required"});
        }

        const existingUser = await prisma.user.findUnique({
            where: { username }
        });

        if (existingUser) {
            return res.status(400).json({ error: "This username is already used" });
        }

        const hashedPassword = await bycrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                name,
                surname,
                username,
                password: hashedPassword,
                role: role?.name || "USER",
                external: false
            }
        });

        const { password: _, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
    } else if (req.method === "PUT") {
        const { id, email, name, surname, username, password, role } = req.body;

        const hashedPassword = await bycrypt.hash(password, 10);

        const user = await prisma.user.update({
            where: {
                id: id,
            },
            data: {
                email,
                name,
                surname,
                username,
                ...(password !== "" && password !== null && {password: password !== "" ? hashedPassword : null}),
                ...(role && {role: role.name}),
            }
        });
        const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);



    } else if (req.method === "DELETE") {
        const { ids } = req.body;
        await prisma.user.deleteMany({
            where: {
                id: {
                    in: ids,
                },
            },
        });

        if (ids.length === 1) {
            return res.status(200).json({ message: "User deleted" });
        }

        return res.status(200).json({ message: ids.count+": users deleted" });
    }

}