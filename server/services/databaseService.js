import {PrismaClient} from '@prisma/client';

function generateSixDigitCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function registerMiddlewares(prisma) {
    if (globalThis.prismaMiddlewareClients?.has(prisma)) return prisma;

    prisma.$use(async (params, next) => {
        if (params.model === 'entry' && params.action === 'create') {
            params.args.data.returnedConfirmationCode = generateSixDigitCode();
        }
        return next(params);
    });

    if (!globalThis.prismaMiddlewareClients) globalThis.prismaMiddlewareClients = new WeakSet();
    globalThis.prismaMiddlewareClients.add(prisma);
    return prisma;
}

function getPrismaClient() {
    const cached = globalThis.prisma;
    if (cached?.resourceEvent && cached?.conversation) return registerMiddlewares(cached);

    const prisma = registerMiddlewares(new PrismaClient());
    if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
    return prisma;
}

const databaseService = new Proxy({}, {
    get(_target, property) {
        return getPrismaClient()[property];
    },
});

export default databaseService;
