import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setAdmins() {
    const emails = ['gerazayisti@gmail.com', 'azayisti@gmail.com'];

    console.log('Setting admin roles...');

    for (const email of emails) {
        const result = await prisma.user.updateMany({
            where: { email },
            data: { role: 'ADMIN' }
        });
        console.log(`Updated ${result.count} users with email: ${email}`);
    }

    console.log('✅ Admin roles set successfully');
    await prisma.$disconnect();
}

setAdmins()
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    })
    .finally(() => {
        process.exit(0);
    });
