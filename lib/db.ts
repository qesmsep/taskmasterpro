import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure prepared statements are disabled to avoid 42P05 errors in dev/hot-reload
const RAW_DB_URL = process.env.DATABASE_URL || ''
const DB_URL = RAW_DB_URL.includes('?') ? `${RAW_DB_URL}&pgbouncer=true` : `${RAW_DB_URL}?pgbouncer=true`

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: DB_URL,
    },
  },
  log: ['error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
