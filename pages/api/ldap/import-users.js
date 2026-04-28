import db from '@/server/services/databaseService';
import {runMiddleware} from '@/services/server/core';
import {decrypt} from '@/services/server/security';
import {listLdapUsers} from '@/services/server/ldap-utils';
import {requireAdmin} from '@/services/server/api-auth';

async function getActiveLdapConfig() {
    const config = await db.ldapConfig.findFirst({
        where: {isActive: true},
        orderBy: {lastUpdated: 'desc'},
    });

    if (!config) throw new Error('Aucune configuration LDAP active trouvée');

    return {
        serverUrl: decrypt(config.serverUrl),
        bindDn: decrypt(config.bindDn),
        adminDn: decrypt(config.adminDn),
        adminPassword: decrypt(config.adminPassword),
    };
}

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method === 'OPTIONS') return res.status(200).json({message: 'OK'});
    if (req.method !== 'POST') return res.status(405).json({message: 'Method not allowed'});
    if (!await requireAdmin(req, res)) return;

    try {
        const ldapUsers = (await listLdapUsers(await getActiveLdapConfig()))
            .filter(user => user.username);

        const summary = {
            imported: 0,
            updated: 0,
            skipped: 0,
            total: ldapUsers.length,
            skippedUsers: [],
        };

        for (const ldapUser of ldapUsers) {
            const existingByUsername = await db.user.findUnique({where: {username: ldapUser.username}});
            const existingByEmail = ldapUser.email ? await db.user.findUnique({where: {email: ldapUser.email}}) : null;

            if (existingByEmail && existingByEmail.username !== ldapUser.username) {
                summary.skipped += 1;
                summary.skippedUsers.push({username: ldapUser.username, reason: 'email déjà utilisé'});
                continue;
            }

            if (existingByUsername) {
                await db.user.update({
                    where: {id: existingByUsername.id},
                    data: {
                        email: ldapUser.email || existingByUsername.email,
                        name: ldapUser.name || existingByUsername.name,
                        surname: ldapUser.surname || existingByUsername.surname,
                        external: true,
                        password: null,
                    },
                });
                summary.updated += 1;
                continue;
            }

            await db.user.create({data: ldapUser});
            summary.imported += 1;
        }

        return res.status(200).json(summary);
    } catch (error) {
        console.error('LDAP import users error:', error);
        return res.status(500).json({
            message: 'Erreur lors de l’import LDAP',
            details: process.env.NODE_ENV === 'development' ? error.message : null,
        });
    }
}
