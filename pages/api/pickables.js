import { PickStatus } from '@prisma/client';

export default function handler(req, res) {
    const ps = Object.values(PickStatus);
    res.status(200).json({ ps });
}
