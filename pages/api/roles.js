import {runMiddleware} from "@/services/server/core";
import {listRoles} from '@/server/services/roleService';

export default async function handler(req, res) {
    await runMiddleware(req, res);
    const roles = listRoles();
    res.status(200).json(roles);
}
