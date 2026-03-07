import { PrismaClient } from "@prisma/client/wasm";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof makePrisma> };

function makePrisma() {
  return new PrismaClient().$extends(withAccelerate());
}

export const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
