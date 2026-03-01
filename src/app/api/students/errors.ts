/**
 * Parse Postgres/database errors and return a user-friendly message and status.
 * Handles unique constraint (23505), not null, foreign key, etc.
 */
type PgError = { code?: string; constraint?: string; detail?: string; message?: string }

export function parseDbError(err: unknown): { status: number; message: string } {
  const pg = err as PgError
  const code = pg?.code
  const constraint = pg?.constraint ?? ""
  const rawMessage = pg?.message ?? String(err)
  const message = rawMessage.toLowerCase()
  const detail = (pg?.detail ?? "").toLowerCase()

  if (code === "23505" || message.includes("unique") || message.includes("duplicate key")) {
    // unique_violation
    if (constraint.includes("students") || message.includes("unique") || detail.includes("Key") || message.includes("duplicate")) {
      return {
        status: 409,
        message: "A student with this serial number and register number already exists.",
      }
    }
    return {
      status: 409,
      message: "A record with this value already exists.",
    }
  }

  if (code === "23503") {
    return { status: 400, message: "Referenced record not found." }
  }
  if (code === "23502") {
    return { status: 400, message: "Required field is missing." }
  }
  if (code === "22P02") {
    return { status: 400, message: "Invalid data format." }
  }

  return {
    status: 500,
    message: "A database error occurred. Please try again.",
  }
}
