import { PrismaClient } from "@prisma/client"
import { PrismaBetterSQLite } from "@prisma/adapter-better-sqlite3"
import path from "node:path"

function createPrismaClient(): PrismaClient {
  const rawUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db"
  const dbPath = rawUrl.startsWith("file:") ? rawUrl.slice(5) : rawUrl
  const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath)
  const adapter = new PrismaBetterSQLite(resolvedPath)
  return new PrismaClient({ adapter })
}

export const prisma = createPrismaClient()
