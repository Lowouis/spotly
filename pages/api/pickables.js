import { PickStatus } from '@prisma/client';
import {runMiddleware} from "@/lib/core";

export default async function handler(req, res) {
    await runMiddleware(req, res);
    const ps = Object.values(PickStatus).map((status, index) => ({id: index + 1, name: status}));
    res.status(200).json(ps);
}
