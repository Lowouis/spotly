import { role } from '@prisma/client';

export default function handler(req, res) {
    const roles = Object.values(role).map((role, index) => ({ id: index + 1, name: role }));
    res.status(200).json(roles);
}