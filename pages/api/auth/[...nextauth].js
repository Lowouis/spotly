import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/prismaconf/init';
import bycrypt from 'bcrypt';
import { authenticate } from 'ldap-authentication';
const ghId = process.env.AUTH_GITHUB_ID;
const ghSecret = process.env.AUTH_GITHUB_SECRET;

if(!ghId || !ghSecret){
    throw new Error("GITHUB ID or SECRET are not defined");
}

export const authConfig = {
    adapter: PrismaAdapter(prisma),
    secret: process.env.AUTH_SECRET,
    providers: [
        CredentialsProvider({
            name : "credentials",
            credentials : {
                username: { label : 'login', type : 'text'},
                password: { label : 'password', type : 'password' }
            },
            async authorize(credentials){

                const user = await prisma.user.findUnique({
                        where : {
                            username: credentials?.username
                        }
                    }
                ).catch((e) => {
                    console.log(e);
                });

                if(!user || user.external === true){
                    const ldapUser = await authenticate({
                        ldapOpts: {
                            url: process.env.LDAP_DOMAIN,
                            //tlsOptions : {rejectUnauthorized: false}
                        },
                        adminDn: process.env.LDAP_ADMIN_DN,
                        adminPassword: process.env.LDAP_ADMIN_PASSWORD,
                        userPassword: credentials.password,
                        userSearchBase: process.env.LDAP_BASEDN,
                        usernameAttribute: 'cn',
                        username: credentials.username,
                        attributes: ['dc','cn', 'givenName', 'sAMAccountName', 'mail', 'sn'],
                    }).catch(e=>{
                        throw new Error("LDAP user search failed / rejected : " + e);
                    });

                    console.log("Founded user from ldap : ", ldapUser)
                    //Creer mettre a jour user dans prisma
                    try {
                           if(!user){
                               const newUser = await prisma.user.create({
                                   data: {
                                       email:      ldapUser.mail,
                                       name:       ldapUser.givenName,
                                       surname:    ldapUser.sn,
                                       username:   ldapUser.sAMAccountName,
                                       external :  true,
                                       password :  null,
                                   }
                               });
                               console.log("NEW USER CREATED:", newUser);
                               return newUser;
                           } else {
                               console.log("Utilisateur trouvé (a mettre à jour) : ", ldapUser);
                               console.log("LDAP USER FOUND + UPDATED", ldapUser, user);
                               return await prisma.user.update({
                                   where : {
                                     id : user.id
                                   },
                                   data : {
                                       email : ldapUser.mail,
                                       username : ldapUser.sAMAccountName,
                                       name : ldapUser.name,
                                       surname:    ldapUser.sn,
                                   }
                               });
                           }
                    } catch (error) {
                        throw new Error("Prisma user creation/update failed: " + error.message);
                    }

                }


                const isValidPassword = await bycrypt.compare(credentials.password, user.password);

                const t = bycrypt.hash("password", 10).then((hash) => {
                    console.log(hash);
                });

                if(!isValidPassword){
                    throw new Error("Invalid password");
                }



                delete user.password;
                console.log("NEXTAUTH RETURN SIDE", user);
                return user;
            },
        }),
        GithubProvider({
            clientId: ghId,
            clientSecret: ghSecret
        })
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {

        jwt: async ({ token, user }) => {
            console.log("JWT SIDE", token, user);
            return {...token, ...user};
        },
        session: async ({ session, token }) => {
            console.log("SESSION SIDE", session);
            session.user = token;
            return session;
        },
    },
    options : {
        debug : true
    }
};



export default NextAuth(authConfig);