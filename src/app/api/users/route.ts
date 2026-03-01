import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createHash } from "crypto"

import { sql } from "@/lib/db"

import { parseDbError } from "./errors"
import { createUserSchema } from "./validations"

const DEFAULT_PAGE_SIZE = 15
const SORT_COLUMNS = ["username", "email"] as const
type SortColumn = (typeof SORT_COLUMNS)[number]
type SortOrder = "asc" | "desc"

function parseSort(sortBy: string | null): SortColumn | null {
  if (!sortBy || !SORT_COLUMNS.includes(sortBy as SortColumn)) return null
  return sortBy as SortColumn
}

function parseSortOrder(sortOrder: string | null): SortOrder {
  if (sortOrder === "desc") return "desc"
  return "asc"
}

export type UserRow = {
  id: number
  username: string
  email: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE),
    )
    const search = searchParams.get("search")?.trim() ?? null
    const sortBy = parseSort(searchParams.get("sortBy"))
    const sortOrder = parseSortOrder(searchParams.get("sortOrder"))
    const offset = (page - 1) * pageSize
    const searchPattern = search ? `%${search}%` : null

    let total = 0
    let rows: UserRow[] = []

    if (searchPattern) {
      const countResult = await sql`
        SELECT COUNT(*)::int AS total
        FROM users
        WHERE (username ILIKE ${searchPattern} OR email ILIKE ${searchPattern})
      `
      total = (countResult as { total: number }[])[0]?.total ?? 0
    } else {
      const countResult = await sql`
        SELECT COUNT(*)::int AS total FROM users
      `
      total = (countResult as { total: number }[])[0]?.total ?? 0
    }

    const orderAsc = sortOrder === "asc"
    if (searchPattern) {
      if (sortBy === "username") {
        rows = (orderAsc
          ? await sql`SELECT id, username, email FROM users WHERE (username ILIKE ${searchPattern} OR email ILIKE ${searchPattern}) ORDER BY username ASC LIMIT ${pageSize} OFFSET ${offset}`
          : await sql`SELECT id, username, email FROM users WHERE (username ILIKE ${searchPattern} OR email ILIKE ${searchPattern}) ORDER BY username DESC LIMIT ${pageSize} OFFSET ${offset}`) as UserRow[]
      } else if (sortBy === "email") {
        rows = (orderAsc
          ? await sql`SELECT id, username, email FROM users WHERE (username ILIKE ${searchPattern} OR email ILIKE ${searchPattern}) ORDER BY email ASC LIMIT ${pageSize} OFFSET ${offset}`
          : await sql`SELECT id, username, email FROM users WHERE (username ILIKE ${searchPattern} OR email ILIKE ${searchPattern}) ORDER BY email DESC LIMIT ${pageSize} OFFSET ${offset}`) as UserRow[]
      } else {
        rows = (await sql`
          SELECT id, username, email
          FROM users
          WHERE (username ILIKE ${searchPattern} OR email ILIKE ${searchPattern})
          ORDER BY id DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `) as UserRow[]
      }
    } else {
      if (sortBy === "username") {
        rows = (orderAsc
          ? await sql`SELECT id, username, email FROM users ORDER BY username ASC LIMIT ${pageSize} OFFSET ${offset}`
          : await sql`SELECT id, username, email FROM users ORDER BY username DESC LIMIT ${pageSize} OFFSET ${offset}`) as UserRow[]
      } else if (sortBy === "email") {
        rows = (orderAsc
          ? await sql`SELECT id, username, email FROM users ORDER BY email ASC LIMIT ${pageSize} OFFSET ${offset}`
          : await sql`SELECT id, username, email FROM users ORDER BY email DESC LIMIT ${pageSize} OFFSET ${offset}`) as UserRow[]
      } else {
        rows = (await sql`
          SELECT id, username, email
          FROM users
          ORDER BY id DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `) as UserRow[]
      }
    }

    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      data: rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    })
  } catch (err) {
    console.error("GET /api/users error:", err)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    )
  }
}

/** Expects users table with: id, username, email, password_hash. Add column if needed:
 *  ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) {
      const message =
        parsed.error.issues.map((i) => i.message).join(" ") || "Validation failed"
      return NextResponse.json({ error: message }, { status: 400 })
    }
    const { username, email, password } = parsed.data
    const passwordHash = createHash("sha256").update(password).digest("hex")

    await sql`
      INSERT INTO users (username, email, password_hash)
      VALUES (${username.trim()}, ${email.trim().toLowerCase()}, ${passwordHash})
    `
    return NextResponse.json(
      { success: true, message: "User created." },
      { status: 201 },
    )
  } catch (err) {
    const { status, message } = parseDbError(err)
    return NextResponse.json({ error: message }, { status })
  }
}
