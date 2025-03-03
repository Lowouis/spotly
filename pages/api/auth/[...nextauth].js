import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/prismaconf/init';
import bycrypt from 'bcrypt';
import { authenticate } from 'ldap-authentication';



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
                    where: {
                        username: credentials?.username
                    }
                }).catch((e) => {
                    console.log(e);
                });

                if(!user || user.external === true){
                    const ldapUser = await authenticate({
                        ldapOpts: {
                            url: process.env.NEXT_PUBLIC_LDAP_DOMAIN,
                            //tlsOptions : {rejectUnauthorized: false}
                        },
                        adminDn: process.env.NEXT_PUBLIC_LDAP_ADMIN_DN,
                        adminPassword: process.env.NEXT_PUBLIC_LDAP_ADMIN_PASSWORD,
                        userPassword: credentials.password,
                        userSearchBase: process.env.NEXT_PUBLIC_LDAP_BASEDN,
                        usernameAttribute: 'cn',
                        username: credentials.username,
                        attributes: ['dc','cn', 'givenName', 'sAMAccountName', 'mail', 'sn'],
                    }).catch(e=>{
                        throw new Error("LDAP user search failed / rejected : " + e);
                    });

                    //Creer mettre a jour user dans prisma
                    try {
                           if(!user){
                               return await prisma.user.create({
                                   data: {
                                       email:      ldapUser.mail,
                                       name:       ldapUser.givenName,
                                       surname:    ldapUser.sn,
                                       username:   ldapUser.sAMAccountName,
                                       external :  true,
                                       password :  null,
                                   }
                               });
                           } else {
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



                if(!isValidPassword){
                    throw new Error("Invalid password");
                }



                delete user.password;
                return user;
            },
        }),
    ],
    session: {
        strategy: "jwt",
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
            if (url === '/api/auth/signout') {
                return baseUrl;
            }
            return url;
        },
    },
    options : {
        debug : false
    }
};



export default NextAuth(authConfig);