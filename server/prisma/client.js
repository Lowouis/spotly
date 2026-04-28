import {PrismaClient} from '@prisma/client'
import dotenv from 'dotenv';

dotenv.config();

const globalForPrisma = globalThis

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
