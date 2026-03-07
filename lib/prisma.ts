import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

let _client: PrismaClient | null = null;

function getClient(): PrismaClient {
  if (_client) return _client;
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
  const pool = new pg.Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  _client = new PrismaClient({ adapter });
  return _client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getClient() as any)[prop];
  },
});
