import prisma from "@/prismaconf/init";
import NextAuth from "next-auth";
import {PrismaAdapter} from "@auth/prisma-adapter";
import GithubProvider from "next-auth/providers/github";


export const { auth, handlers} = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        GithubProvider
    ],

});


