export default async function handler(req, res) {
    // Log des infos de la requête entrante
    const debug = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        cookies: req.cookies,
        body: req.body,
    };

    // Appel du SSO local (ou adapter l'URL si besoin)
    let ssoResponse, ssoData, ssoHeaders = {};
    try {
        ssoResponse = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/auth/check-sso`, {
            method: 'GET',
            headers: req.headers,
            credentials: 'include',
        });
        ssoHeaders = Object.fromEntries(ssoResponse.headers.entries());
        ssoData = await ssoResponse.text();
    } catch (e) {
        ssoData = `Erreur lors du fetch SSO: ${e.message}`;
    }

    res.status(200).json({
        debug_request: debug,
        sso_status: ssoResponse?.status,
        sso_headers: ssoHeaders,
        sso_body: ssoData,
    });
} 