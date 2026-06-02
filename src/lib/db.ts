import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

let prismaInstance: PrismaClient;

if (globalForPrisma.prisma) {
  // Check if the cached instance has the message model (could be stale)
  if (typeof (globalForPrisma.prisma as any).message === "undefined") {
    console.warn("[PRISMA] Cached client is stale (missing message model). Creating fresh instance.");
    prismaInstance = createPrismaClient();
  } else {
    prismaInstance = globalForPrisma.prisma;
  }
} else {
  prismaInstance = createPrismaClient();
}

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
