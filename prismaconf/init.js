import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

let prisma;
dotenv.config();

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
} else {
    if (!globalThis.prisma) {
        globalThis.prisma = new PrismaClient();
    }
    prisma = globalThis.prisma;
}

export default prisma;
