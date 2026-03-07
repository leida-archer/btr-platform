import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof makePrisma> };

function makePrisma() {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
  return new PrismaClient({ accelerateUrl: url }).$extends(withAccelerate());
}

export const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
