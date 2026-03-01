import { neon } from "@neondatabase/serverless"
import { Pool } from "pg"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set")
}

// If DB_SERVERLESS=true or we're in production, use Neon serverless (fetch-based).
// Otherwise, default to a normal pg Pool for local/dev.
const useServerless =
  process.env.DB_SERVERLESS === "true" ||
  process.env.NODE_ENV === "production"

let sql: any

if (useServerless) {
  sql = neon(connectionString)
} else {
  const pool = new Pool({ connectionString })

  sql = async (strings: TemplateStringsArray, ...values: any[]) => {
    const text = strings.reduce(
      (acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ""),
      ""
    )

    const res = await pool.query(text, values)
    return res.rows
  }
}

export { sql }

