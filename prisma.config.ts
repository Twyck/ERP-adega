import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: "postgresql://postgres.sarjdaamedcjunysaijg:57756835875@aws-0-sa-east-1.pooler.supabase.com:5432/postgres",
  },
})