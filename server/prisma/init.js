import prisma from './client';

function generateSixDigitCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

if (!globalThis.prismaEntryCodeMiddlewareRegistered) {
    prisma.$use(async (params, next) => {
        if (params.model === 'entry' && params.action === 'create') {
            params.args.data.returnedConfirmationCode = generateSixDigitCode();
        }
        return next(params);
    });

    globalThis.prismaEntryCodeMiddlewareRegistered = true;
}

export default prisma;
