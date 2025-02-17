// pages/api/save-ldap-config.js

import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { serverUrl, bindDn, adminCn, adminPassword } = req.body;

    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envConfig = fs.readFileSync(envPath, 'utf8');

        const updatedEnvConfig = envConfig
            .replace(/NEXT_PUBLIC_LDAP_DOMAIN=.*/, `NEXT_PUBLIC_LDAP_DOMAIN=${serverUrl}`)
            .replace(/NEXT_PUBLIC_LDAP_BASEDN=.*/, `NEXT_PUBLIC_LDAP_BASEDN=${bindDn}`)
            .replace(/NEXT_PUBLIC_LDAP_ADMIN_DN=.*/, `NEXT_PUBLIC_LDAP_ADMIN_DN=${adminCn}`)
            .replace(/NEXT_PUBLIC_LDAP_ADMIN_PASSWORD=.*/, `NEXT_PUBLIC_LDAP_ADMIN_PASSWORD=${adminPassword}`);

        fs.writeFileSync(envPath, updatedEnvConfig, 'utf8');

        return res.status(200).json({ message: 'Configuration saved successfully!' });
    } catch (error) {
        console.error('Error saving configuration:', error);
        return res.status(500).json({ message: 'Failed to save configuration', error });
    }
}