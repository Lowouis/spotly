import {runMiddleware} from "@/services/server/core";
import {getClientIp} from "@/services/server/client-ip";

export default async function handler(req, res) {
    await runMiddleware(req, res);
    res.json({ip: getClientIp(req)});
}
