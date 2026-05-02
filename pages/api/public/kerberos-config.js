import {runMiddleware} from "@/services/server/core";

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'GET') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    return res.status(200).json({enabled: false});
} 
