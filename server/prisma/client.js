import {PrismaClient} from '@prisma/client'
import dotenv from 'dotenv';

dotenv.config();

const globalForPrisma = globalThis

const cachedPrisma = globalForPrisma.prisma
const prisma = cachedPrisma && cachedPrisma.resourceEvent && cachedPrisma.conversation ? cachedPrisma : new PrismaClient()

globalForPrisma.prisma = prisma

export default prisma
