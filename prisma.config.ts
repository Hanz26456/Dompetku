import path from "node:path"
import { defineConfig } from "prisma/config"

export default defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  migrate: {
    url: "postgresql://postgres:farhanmaulana123@db.qedivoryzwtyfgurvsid.supabase.co:5432/postgres",
    async adapter() {
      const { Pool } = await import("pg")
      const { PrismaPg } = await import("@prisma/adapter-pg")
      const pool = new Pool({
        connectionString: "postgresql://postgres:farhanmaulana123@db.qedivoryzwtyfgurvsid.supabase.co:5432/postgres"
      })
      return new PrismaPg(pool)
    },
  },
})