import {runMiddleware} from "@/lib/core";

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'GET') {
        return res.status(405).json({message: 'Méthode non autorisée'});
    }

    const recursiveUnits = [
        {id: 0, name: "jour"},
        {id: 1, name: "hebdomadaire"},
        {id: 2, name: "mensuel"},
    ];

    return res.status(200).json(recursiveUnits);
}
