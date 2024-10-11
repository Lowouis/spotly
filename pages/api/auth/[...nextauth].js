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
                );

                if(!user){
                    throw new Error("User not found");
                }

                const isValidPassword = await bycrypt.compare(credentials.password, user.password);

                if(!isValidPassword){
                    throw new Error("Invalid password");
                }
                console.log(user)
                return {...user };
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
        session: async ({ session, token }) => {
            session.id = token.id;
            session.jwt = token.jwt;
            session.error = token.error;
            session.user.username = token.username;
            session.user.createdAt = token.createdAt;

            return Promise.resolve(session);
        },
        jwt: async ({ token, user }) => {
            const isSignUp = !!user;
            if (isSignUp) {
                token.id = user.id;
                token.jwt = user.jwt;
                token.error = user.error;
                token.username = user.username;
                token.createdAt = user.createdAt;
            }
            return Promise.resolve(token);
        }
    },
    options : {
        debug : true
    }
};



export default NextAuth(authConfig);