import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import {PrismaAdapter} from '@next-auth/prisma-adapter';
import prisma from '@/prismaconf/init';
import bycrypt from 'bcrypt';
import nextConfig from '../../../next.config.mjs';
import {decrypt} from '@/lib/security';
import {findLdapUser} from '@/lib/ldap-utils';

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
            id: 'sso-login',
            name: 'SSO Login',
            credentials: {
                username: { label: "Username", type: "text" }
            },
            async authorize(credentials) {
                if (!credentials?.username) {
                    return null;
                }
                const user = await prisma.user.findUnique({
                    where: { username: credentials.username }
                });
                return user;
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

                // Rechercher l'utilisateur dans la base de données
                const user = await prisma.user.findUnique({
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
                        const newUser = await prisma.user.create({
                            data: {
                                username: ldapUser.sAMAccountName,
                                email: ldapUser.mail,
                                name: ldapUser.givenName || '',
                                surname: ldapUser.sn || '',
                                external: true,
                                password: null,
                            }
                        });
                        return newUser;
                    }

                    // Sinon, mettre à jour l'utilisateur existant
                    const updatedUser = await prisma.user.update({
                        where: {id: user.id},
                        data: {
                            email: ldapUser.mail,
                            name: ldapUser.givenName || user.name,
                            surname: ldapUser.sn || user.surname,
                        }
                    });

                    return updatedUser;
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
            return {...token, ...user};
        },
        session: async ({ session, token }) => {
            session.user = token;
            return session;
        },
        redirect: async ({ url, baseUrl }) => {
            const basePath = nextConfig.basePath || '';
            if (url.startsWith(baseUrl)) return url;
            if (basePath && url.startsWith(basePath)) {
                return baseUrl + url.slice(basePath.length);
            }
            if (url.startsWith('/')) return baseUrl + url;
            return url;
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