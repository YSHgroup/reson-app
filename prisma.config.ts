import { config as loadDotenv } from 'dotenv'
import { defineConfig } from 'prisma/config'

loadDotenv({ path: ['.env.local', '.env'] })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5432/reson?schema=public',
  },
})
