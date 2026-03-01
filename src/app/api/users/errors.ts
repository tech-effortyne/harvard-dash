/**
 * Parse Postgres/database errors and return a user-friendly message and status.
 */
type PgError = { code?: string; constraint?: string; message?: string }

export function parseDbError(err: unknown): { status: number; message: string } {
  const pg = err as PgError
  const code = pg?.code
  const constraint = pg?.constraint ?? ""
  const rawMessage = pg?.message ?? String(err)
  const message = rawMessage.toLowerCase()

  if (code === "23505" || message.includes("unique") || message.includes("duplicate key")) {
    if (constraint.includes("email") || message.includes("email")) {
      return { status: 409, message: "A user with this email already exists." }
    }
    if (constraint.includes("username") || message.includes("username")) {
      return { status: 409, message: "A user with this username already exists." }
    }
    return { status: 409, message: "A user with this username or email already exists." }
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
