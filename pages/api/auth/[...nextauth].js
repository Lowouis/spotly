import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import {PrismaAdapter} from '@next-auth/prisma-adapter';
import db from "@/server/services/databaseService";
import bycrypt from 'bcrypt';
import {publicEnv} from '@/config/publicEnv';
import {decrypt} from '@/services/server/security';
import {findLdapUser} from '@/services/server/ldap-utils';
import {validateKerberosTicket} from '@/services/server/kerberos-auth';
import {sanitizeUser} from '@/services/server/user-sanitizer';

const SESSION_EXPIRATION_TIME = 60 * 20; // 20 minutes
const loginAttempts = new Map();

const basePath = publicEnv.basePath;

// Fonction pour récupérer la configuration LDAP active
async function getActiveLdapConfig() {
    const config = await db.ldapConfig.findFirst({
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
        adminPassword: decrypt(config.adminPassword),
        emailDomain: config.emailDomain ? decrypt(config.emailDomain) : null,
    };
}

async function getOrCreateKerberosUser(ticket) {
    const validationResult = await validateKerberosTicket(ticket);

    if (!validationResult?.success || !validationResult.username) {
        throw new Error('Ticket Kerberos invalide');
    }

    const login = validationResult.username.split('@')[0];
    const existingUser = await db.user.findUnique({where: {username: login}});

    if (existingUser) {
        return sanitizeUser(existingUser);
    }

    const ldapConfig = await getActiveLdapConfig();
    const ldapResult = await findLdapUser(ldapConfig, login, false, null, true);

    if (!ldapResult.success || !ldapResult.user) {
        throw new Error(`Utilisateur non trouvé dans l'annuaire d'entreprise : ${login}`);
    }

    const ldapUser = ldapResult.user;
    const createdUser = await db.user.create({
        data: {
            username: login,
            email: ldapUser.mail || (ldapConfig.emailDomain ? `${login}@${ldapConfig.emailDomain}` : null),
            name: ldapUser.givenName || login,
            surname: ldapUser.sn || '',
            external: true,
            password: null,
        },
    });

    return sanitizeUser(createdUser);
}

function assertLoginRateLimit(username) {
    const key = String(username || '').toLowerCase();
    const now = Date.now();
    const windowMs = 60_000;
    const limit = 10;
    const bucket = loginAttempts.get(key) || {count: 0, resetAt: now + windowMs};

    if (bucket.resetAt <= now) {
        bucket.count = 0;
        bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    loginAttempts.set(key, bucket);

    if (bucket.count > limit) {
        throw new Error('Trop de tentatives de connexion, veuillez réessayer plus tard');
    }
}

export const authConfig = {
    adapter: PrismaAdapter(db),
    secret: process.env.AUTH_SECRET,
    debug: process.env.NODE_ENV !== 'production',
    
    providers: [
        CredentialsProvider({
            id: 'sso-login',
            name: 'SSO Login',
            credentials: {
                ticket: { label: "Kerberos ticket", type: "text" }
            },
            async authorize(credentials) {
                if (!credentials?.ticket) {
                    return null;
                }
                return getOrCreateKerberosUser(credentials.ticket);
            }
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                username: {label: 'login', type: 'text'},
                password: {label: 'password', type: 'password'}
            },
            async authorize(credentials) {
                if (!credentials?.username) {
                    throw new Error("Nom d'utilisateur requis");
                }
                assertLoginRateLimit(credentials.username);

                // Rechercher l'utilisateur dans la base de données
                const user = await db.user.findUnique({
                    where: {
                        username: credentials.username
                    }
                }).catch(() => null);

                // Si l'utilisateur existe et n'est pas externe, vérifier le mot de passe local
                if (user && !user.external) {
                    if (!credentials.password) {
                        throw new Error("Mot de passe requis");
                    }

                    const isValidPassword = await bycrypt.compare(credentials.password, user.password);
                    if (!isValidPassword) {
                        throw new Error("Mot de passe invalide");
                    }

                    const userWithoutPassword = {...user};
                    delete userWithoutPassword.password;
                    return userWithoutPassword;
                }

                // Sinon, essayer l'authentification LDAP
                try {
                    if (!credentials.password) {
                        throw new Error("Mot de passe requis pour l'authentification LDAP");
                    }

                    const ldapConfig = await getActiveLdapConfig();

                    // Authentifier l'utilisateur avec LDAP
                    const ldapResult = await findLdapUser(
                        ldapConfig,
                        credentials.username,
                        true, // avec authentification par mot de passe
                        credentials.password
                    );

                    if (!ldapResult.success || !ldapResult.user) {
                        throw new Error("Échec de l'authentification LDAP: " + (ldapResult.error || "Utilisateur ou mot de passe incorrect"));
                    }

                    const ldapUser = ldapResult.user;

                    // Si l'utilisateur n'existe pas dans la base de données, le créer
                    if (!user) {
                        const ldapUsername = ldapUser.sAMAccountName || ldapUser.uid || credentials.username;
                        const newUser = await db.user.create({
                            data: {
                                username: ldapUsername,
                                email: ldapUser.mail,
                                name: ldapUser.givenName || '',
                                surname: ldapUser.sn || '',
                                external: true,
                                password: null,
                            }
                        });
                        return sanitizeUser(newUser);
                    }

                    // Sinon, mettre à jour l'utilisateur existant
                    const updatedUser = await db.user.update({
                        where: {id: user.id},
                        data: {
                            email: ldapUser.mail,
                            name: ldapUser.givenName || user.name,
                            surname: ldapUser.sn || user.surname,
                        }
                    });

                    return sanitizeUser(updatedUser);
                } catch (error) {
                    console.error("Erreur d'authentification LDAP:", error);
                    throw new Error("Échec de l'authentification: " + error.message);
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: SESSION_EXPIRATION_TIME,
    },
    callbacks: {
        jwt: async ({ token, user }) => {
            if (!user) return token;
            return {...token, ...sanitizeUser(user)};
        },
        session: async ({ session, token }) => {
            session.user = token;
            return session;
        },
        redirect: async ({ url, baseUrl }) => {
            const basePath = publicEnv.basePath;
            if (url.startsWith(baseUrl)) return url;
            if (basePath && url.startsWith(basePath)) {
                return baseUrl + url.slice(basePath.length);
            }
            if (url.startsWith('/')) return baseUrl + url;
            return baseUrl;
        },
    },
    pages: {
        signIn: `${basePath}/login`,
        signOut: `/`,
        error: `${basePath}/error`,
    },
    events: {
        async signIn(message) {
        },
        async signOut(message) {
        },
        async error(message) {
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
        },
    },
};


export default NextAuth(authConfig);
