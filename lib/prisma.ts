import { PrismaClient } from "@prisma/client";

// Dans Node.js, 'global' est un objet global qui existe
// Dans les environnements serverless, on utilise globalThis
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Créer une instance Prisma avec des options de production
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["warn", "error"], // En production, seulement les warnings et erreurs
  });
}

// En développement, on attache au global pour éviter les multiples instances
// En production sur Vercel, cette condition ne sera pas vraie car chaque fonction serverless est isolée
if (process.env.NODE_ENV === "development") {
  globalForPrisma.prisma = prisma;
}

// Fonction utilitaire pour nettoyer les connexions
export async function disconnectPrisma() {
  if (process.env.NODE_ENV === "production") {
    await prisma.$disconnect();
  }
}

// Fonction pour les health checks
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true };
  } catch (error: any) {
    return { connected: false, error: error.message };
  }
}