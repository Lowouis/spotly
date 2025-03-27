import {runMiddleware} from "@/lib/core";

export default async function handler(req, res) {
    await runMiddleware(req, res);
    // Get the client's IP from the X-Forwarded-For header or the remote address
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    res.status(200).json({ip});
}