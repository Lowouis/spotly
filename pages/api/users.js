'use server';
import db from "@/server/services/databaseService";
import bycrypt from 'bcrypt';
import {runMiddleware} from "@/services/server/core";
import {NextResponse} from 'next/server';
import {requireAdmin} from '@/services/server/api-auth';

export default async function handler(req, res) {
    await runMiddleware(req, res);
    if (req.method !== 'OPTIONS' && !await requireAdmin(req, res)) return;
    if(req.method === "GET"){
        const { id } = req.body;
        const users = await db.user.findMany({
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

        const existingUser = await db.user.findUnique({
            where: { username }
        });

        if (existingUser) {
            return res.status(400).json({ error: "This username is already used" });
        }

        const hashedPassword = await bycrypt.hash(password, 10);

        const user = await db.user.create({
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

        const user = await db.user.update({
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
        await db.user.deleteMany({
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
    } else if (req.method === "OPTIONS") {
        // Gérer la requête preflight OPTIONS
        const response = NextResponse.next();
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
        res.writeHead(204, Object.fromEntries(response.headers.entries()));
        res.end();
    } else {
        // Méthode non autorisée
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE", "OPTIONS"]);
        res.status(405).json({message: `Method ${req.method} not allowed`});
    }
}
