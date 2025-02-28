import { role } from '@prisma/client';
import {runMiddleware} from "@/lib/core";

export default async function handler(req, res) {
    await runMiddleware(req, res);
    const roles = Object.values(role).map((role, index) => ({ id: index + 1, name: role }));
    res.status(200).json(roles);
}