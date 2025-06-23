import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import {PrismaAdapter} from '@next-auth/prisma-adapter';
import prisma from '@/prismaconf/init';
import bycrypt from 'bcrypt';
import {authenticate} from 'ldap-authentication';
import {validateKerberosTicket} from '@/lib/kerberos-auth';
import nextConfig from '../../../next.config.mjs';
import {decrypt} from '@/lib/security';

const SESSION_EXPIRATION_TIME = 60 * 20; // 20 minutes

const basePath = nextConfig.basePath || '';

// Fonction pour récupérer la configuration LDAP active
async function getActiveLdapConfig() {
    const config = await prisma.ldapConfig.findFirst({
        where: {
            isActive: true
        },
        orderBy: {
            lastUpdated: 'desc'
        }
    });
    if (!config) {
        throw new Error('Aucune configuration LDAP active trouvée');
    } 
    return {
        serverUrl: decrypt(config.serverUrl),
        bindDn: decrypt(config.bindDn),
        adminCn: decrypt(config.adminCn),
        adminDn : decrypt(config.adminDn),
        adminPassword: decrypt(config.adminPassword)
    };
}

const authConfig = {
    adapter: PrismaAdapter(prisma),
    secret: process.env.AUTH_SECRET,
    debug: true,
    providers: [
        CredentialsProvider({
            id: 'kerberos',
            name: 'Kerberos',
            credentials: {
                ticket: {label: "Kerberos Ticket", type: "text"}
            },
            async authorize(credentials) {
                console.log('Kerberos authorize called with credentials:', credentials ? 'Present' : 'Missing');

                // Bypass si aucune config Kerberos active
                const kerberosConfig = await prisma.kerberosConfig.findFirst({
                    where: { isActive: true },
                    orderBy: { lastUpdated: 'desc' }
                });
                if (!kerberosConfig) {
                    console.log('Aucune configuration Kerberos active trouvée, bypass de la vérification Kerberos.');
                    return null;
                }

                if (!credentials?.ticket) {
                    console.log('No ticket provided');
                    return null;
                }

                try {
                    const result = await validateKerberosTicket(credentials.ticket);
                    console.log('Kerberos validation result:', result);

                    if (!result || !result.username) {
                        console.log('Invalid or missing username in Kerberos result');
                        return null;
                    }

                    let user = await prisma.user.findUnique({
                        where: {
                            username: result.username
                        }
                    });

                    if (!user) {
                        console.log('User not found in database, attempting LDAP lookup...');
                        const ldapConfig = await getActiveLdapConfig();

                        const ldapUser = await authenticate({
                            ldapOpts: {
                                url: ldapConfig.serverUrl,
                            },
                            adminDn: ldapConfig.adminCn,
                            adminPassword: ldapConfig.adminPassword,
                            userSearchBase: ldapConfig.bindDn,
                            usernameAttribute: 'cn',
                            username: result.username,
                            attributes: ['dc', 'cn', 'givenName', 'sAMAccountName', 'mail', 'sn'],
                        }).catch(e => {
                            console.error("LDAP user search failed:", e);
                            return null;
                        });

                        if (ldapUser) {
                            console.log('LDAP user found, creating user in database...');
                            user = await prisma.user.create({
                                data: {
                                    email: ldapUser.mail,
                                    name: ldapUser.givenName,
                                    surname: ldapUser.sn,
                                    username: ldapUser.sAMAccountName,
                                    external: true,
                                    password: null,
                                }
                            });
                            console.log('User created in database:', user);
                        } else {
                            console.log('LDAP user not found');
                        }
                    }

                    return user;
                } catch (error) {
                    console.error('Kerberos validation error:', error);
                    return null;
                }
            }
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                username: {label: 'login', type: 'text'},
                password: {label: 'password', type: 'password'}
            },
            async authorize(credentials) {
                const user = await prisma.user.findUnique({
                    where: {
                        username: credentials?.username
                    }
                }).catch((e) => {
                    console.log(e);
                });

                if (!user || user.external === true) {
                    try {
                        const ldapConfig = await getActiveLdapConfig();

                        const ldapUser = await authenticate({
                            ldapOpts: {
                                url: ldapConfig.serverUrl,
                            },
                            adminDn: ldapConfig.adminDn,
                            adminPassword: ldapConfig.adminPassword,
                            userPassword: credentials.password,
                            userSearchBase: ldapConfig.bindDn,
                            usernameAttribute: 'cn',
                            username: credentials.username,
                            attributes: ['dc', 'cn', 'givenName', 'sAMAccountName', 'mail', 'sn'],
                        }).catch(e => {
                            throw new Error("LDAP user search failed / rejected : " + e);
                        });

                        if (!user) {
                            return await prisma.user.create({
                                data: {
                                    email: ldapUser.mail,
                                    name: ldapUser.givenName,
                                    surname: ldapUser.sn,
                                    username: ldapUser.sAMAccountName,
                                    external: true,
                                    password: null,
                                }
                            });
                        } else {
                            return await prisma.user.update({
                                where: {
                                    id: user.id
                                },
                                data: {
                                    email: ldapUser.mail,
                                    username: ldapUser.sAMAccountName,
                                    name: ldapUser.name,
                                    surname: ldapUser.sn,
                                }
                            });
                        }
                    } catch (error) {
                        throw new Error("Prisma user creation/update failed: " + error.message);
                    }
                }

                const isValidPassword = await bycrypt.compare(credentials.password, user.password);

                if (!isValidPassword) {
                    throw new Error("Invalid password");
                }

                delete user.password;
                return user;
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: SESSION_EXPIRATION_TIME,
    },
    callbacks: {
        jwt: async ({ token, user }) => {
            console.log('JWT Callback - Token:', token);
            console.log('JWT Callback - User:', user);
            return {...token, ...user};
        },
        session: async ({ session, token }) => {
            console.log('Session Callback - Session:', session);
            console.log('Session Callback - Token:', token);
            session.user = token;
            return session;
        },
        redirect: async ({ url, baseUrl }) => {
            console.log('Redirect Callback - URL:', url);
            console.log('Redirect Callback - BaseURL:', baseUrl);

            // Si l'URL est relative, utiliser le baseUrl
            if (url.startsWith('/')) {
                return `${baseUrl}${url}`;
            }
            // Si l'URL est absolue et contient le domaine de base, l'utiliser telle quelle
            if (url.startsWith(baseUrl)) {
                return url;
            }
            return url;
        },
    },
    pages: {
        signIn: `$/login`,
        signOut: `/`,
        error: `/error`,
    },
    events: {
        async signIn(message) {
            console.log('SignIn Event:', message);
        },
        async signOut(message) {
            console.log('SignOut Event:', message);
        },
        async error(message) {
            console.log('Error Event:', message);
        },
    },
    logger: {
        error(code, metadata) {
            console.error('NextAuth Error:', code, metadata);
        },
        warn(code) {
            console.warn('NextAuth Warning:', code);
        },
        debug(code, metadata) {
            console.log('NextAuth Debug:', code, metadata);
        },
    },
};

export default NextAuth(authConfig);