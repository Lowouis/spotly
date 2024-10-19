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

                if(!user){
                    throw new Error("User not found");
                }

                const isValidPassword = await bycrypt.compare(credentials.password, user.password);


                if(!isValidPassword){
                    throw new Error("Invalid password");
                }



                delete user.password;

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
            return {...token, ...user};
        },
        session: async ({ session, token }) => {
            session.user = token;
            return session;
        },
    },
    options : {
        debug : true
    }
};



export default NextAuth(authConfig);