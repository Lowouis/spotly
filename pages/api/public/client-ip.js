import {runMiddleware} from "@/lib/core";

export default async function handler(req, res) {
    await runMiddleware(req, res);
    let ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    ip = ip.substring(ip.lastIndexOf(':') + 1);
    
    res.status(200).json({ip});
}