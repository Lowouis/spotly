import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
    try {
        // Delete in correct order based on dependencies
        await prisma.entry.deleteMany();
        await prisma.timeScheduleOptions.deleteMany();
        await prisma.resource.deleteMany();
        await prisma.category.deleteMany();
        await prisma.domain.deleteMany();
        await prisma.pickable.deleteMany();
        await prisma.user.deleteMany();

        console.log('✅ Database cleaned successfully');
    } catch (error) {
        console.error('❌ Error while cleaning database:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

resetDatabase();