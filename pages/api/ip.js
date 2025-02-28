import {runMiddleware} from "@/lib/core";

export default async function handler(req, res) {
    await runMiddleware(req, res);
    let ip =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.connection?.socket?.remoteAddress;

    // Supprime le préfixe IPv6 `::ffff:` si présent
    if (ip.startsWith("::ffff:")) {
        ip = ip.substring(7);
    }

    res.json({ ip });
}
