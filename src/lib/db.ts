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

let pool: Pool | null = null

if (useServerless) {
  sql = neon(connectionString)
} else {
  pool = new Pool({ connectionString })

  sql = async (strings: TemplateStringsArray, ...values: any[]) => {
    const text = strings.reduce(
      (acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ""),
      ""
    )

    const res = await pool!.query(text, values)
    return res.rows
  }
}

/** Run a parameterized raw query. Only available when using pg Pool (non-serverless). Use for dynamic ORDER BY with whitelisted columns. */
export async function queryRaw(
  text: string,
  values: unknown[],
): Promise<unknown[]> {
  if (!pool) {
    throw new Error("queryRaw is only available when using pg Pool (DB_SERVERLESS=false)")
  }
  const res = await pool.query(text, values)
  return res.rows as unknown[]
}

export { sql }

