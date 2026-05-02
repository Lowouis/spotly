import {PrismaClient} from '@prisma/client'
import dotenv from 'dotenv';

dotenv.config();

const globalForPrisma = globalThis

const cachedPrisma = globalForPrisma.prisma
const prisma = cachedPrisma && cachedPrisma.resourceEvent && cachedPrisma.conversation ? cachedPrisma : new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
