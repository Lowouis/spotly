import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/prismaconf/init';
import bycrypt from 'bcrypt';


const ghId = process.env.AUTH_GITHUB_ID;
const ghSecret = process.env.AUTH_GITHUB_SECRET;

if(!ghId || !ghSecret){
    throw new Error("GITHUB ID or SECRET are not defined");
}

export const authConfig = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name : "Sign in with username",
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
                );
                console.log(user);
                if(!user){
                    throw new Error("User not found");
                }

                const isValidPassword = await bycrypt.compare(credentials.password, user.password);

                if(!isValidPassword){
                    throw new Error("Invalid password");
                }

                return {id: user.id, name : user.username, email : user.email };
            },
        session: {
                strategy : "jwt",
        },
            callbacks: {
                session: async ({ session, token }) => {
                    session.id = token.id;
                    session.jwt = token.jwt;
                    session.error = token.error;
                    return Promise.resolve(session);
                },
                jwt: async ({ token, user }) => {
                    const isSignUp = !!user;
                    if (isSignUp) {
                        token.id = user.id;
                        token.jwt = user.jwt;
                        token.error = user.error;
                    }
                    return Promise.resolve(token);
                },
            }

        }),
        GithubProvider({
            clientId: ghId,
            clientSecret: ghSecret
        })
    ],
    options : {
        debug : true
    }
};



export default NextAuth(authConfig);