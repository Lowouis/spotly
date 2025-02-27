import { PickStatus } from '@prisma/client';

export default function handler(req, res) {
    const ps = Object.values(PickStatus).map((status, index) => ({ id: index + 1, name: status }));
    res.status(200).json(ps);
}
