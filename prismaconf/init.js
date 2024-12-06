import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

let prisma;
dotenv.config();

function generateSixDigitCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
} else {
    if (!globalThis.prisma) {
        globalThis.prisma = new PrismaClient();
    }
    prisma = globalThis.prisma;
}

prisma.$use(async (params, next) => {
    if (params.model === 'entry' && params.action === 'create') {
        params.args.data.returnedConfirmationCode = generateSixDigitCode();
    }
    return next(params);
});

export default prisma;