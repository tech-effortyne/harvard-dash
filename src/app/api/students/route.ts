import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { queryRaw, sql } from "@/lib/db"

import { parseDbError } from "./errors"
import {
  createStudentSchema,
  deleteStudentSchema,
  updateStudentSchema,
} from "./validations"

const DEFAULT_PAGE_SIZE = 15
const SORT_COLUMNS = ["name", "serial_number", "register_no", "year"] as const
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

export type StudentRow = {
  id: number
  name: string
  register_no: string
  serial_number: string
  year: string | null
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
    let rows: StudentRow[] = []

    if (searchPattern) {
      const countResult = await sql`
        SELECT COUNT(*)::int AS total
        FROM students
        WHERE (name ILIKE ${searchPattern} OR serial_number::text ILIKE ${searchPattern} OR register_no ILIKE ${searchPattern})
      `
      total = (countResult as { total: number }[])[0]?.total ?? 0
    } else {
      const countResult = await sql`
        SELECT COUNT(*)::int AS total FROM students
      `
      total = (countResult as { total: number }[])[0]?.total ?? 0
    }

    let usedRaw = false
    if (sortBy) {
      const orderDir = sortOrder.toUpperCase()
      const safeOrder = `"${sortBy}"`
      try {
        if (searchPattern) {
          const text = `
            SELECT id, name, register_no, serial_number, year
            FROM students
            WHERE (name ILIKE $1 OR serial_number::text ILIKE $1 OR register_no ILIKE $1)
            ORDER BY ${safeOrder} ${orderDir}
            LIMIT $2 OFFSET $3
          `
          rows = (await queryRaw(text, [searchPattern, pageSize, offset])) as StudentRow[]
        } else {
          const text = `
            SELECT id, name, register_no, serial_number, year
            FROM students
            ORDER BY ${safeOrder} ${orderDir}
            LIMIT $1 OFFSET $2
          `
          rows = (await queryRaw(text, [pageSize, offset])) as StudentRow[]
        }
        usedRaw = true
      } catch {
        // queryRaw not available (e.g. serverless); fall through to sql with default order
      }
    }
    if (!usedRaw) {
      if (searchPattern) {
        rows = (await sql`
          SELECT id, name, register_no, serial_number, year
          FROM students
          WHERE (name ILIKE ${searchPattern} OR serial_number::text ILIKE ${searchPattern} OR register_no ILIKE ${searchPattern})
          ORDER BY id DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `) as StudentRow[]
      } else {
        rows = (await sql`
          SELECT id, name, register_no, serial_number, year
          FROM students
          ORDER BY id DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `) as StudentRow[]
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
    console.error("GET /api/students error:", err)
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = createStudentSchema.safeParse(body)
    if (!parsed.success) {
      const message =
        parsed.error.issues.map((i) => i.message).join(" ") || "Validation failed"
      return NextResponse.json({ error: message }, { status: 400 })
    }
    const { name, register_no, serial_number, year } = parsed.data
    const yearVal = year ?? null

    await sql`
      INSERT INTO students (name, register_no, serial_number, year)
      VALUES (${name}, ${register_no}, ${serial_number}, ${yearVal})
    `
    return NextResponse.json(
      { success: true, message: "Student created." },
      { status: 201 },
    )
  } catch (err) {
    const { status, message } = parseDbError(err)
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = updateStudentSchema.safeParse(body)
    if (!parsed.success) {
      const message =
        parsed.error.issues.map((i) => i.message).join(" ") || "Validation failed"
      return NextResponse.json({ error: message }, { status: 400 })
    }
    const { id, name, register_no, serial_number, year } = parsed.data

    const result = await sql`
      UPDATE students
      SET name = ${name}, register_no = ${register_no}, serial_number = ${serial_number}, year = ${year}
      WHERE id = ${id}
      RETURNING 1
    `
    if (Array.isArray(result) && result.length === 0) {
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 },
      )
    }
    return NextResponse.json({ success: true, message: "Student updated." })
  } catch (err) {
    const { status, message } = parseDbError(err)
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = deleteStudentSchema.safeParse(body)
    if (!parsed.success) {
      const message =
        parsed.error.issues.map((i) => i.message).join(" ") || "Validation failed"
      return NextResponse.json({ error: message }, { status: 400 })
    }
    const { id } = parsed.data

    const result = await sql`
      DELETE FROM students
      WHERE id = ${id}
      RETURNING 1
    `
    if (Array.isArray(result) && result.length === 0) {
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 },
      )
    }
    return NextResponse.json({ success: true, message: "Student deleted." })
  } catch (err) {
    const { status, message } = parseDbError(err)
    return NextResponse.json({ error: message }, { status })
  }
}
