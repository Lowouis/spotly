import {runMiddleware} from "@/services/server/core";
import {getAuthorizedLocationForRequest} from "@/services/server/client-ip";

export default async function handler(req, res) {
    await runMiddleware(req, res);

    try {
        const {ip, authorizedLocation} = await getAuthorizedLocationForRequest(req);
        if (!ip) return res.status(400).json({error: 'IP address is required'});

        if (!authorizedLocation) {
            return res.status(401).json({error: 'IP not authorized', ip});
        }

        return res.status(200).json({authorized: true, ip, libelle: authorizedLocation.libelle});
    } catch (error) {
        console.error('Error checking authorized location:', error);
        return res.status(500).json({error: 'Internal server error'});
    }
}
