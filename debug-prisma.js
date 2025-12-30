const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Prisma keys:", Object.keys(prisma));
    try {
        const settings = await prisma.settings.findUnique({ where: { id: "default" } });
        console.log("Settings found:", settings);
    } catch (e) {
        console.error("Error accessing prisma.settings:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
