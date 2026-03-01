import { z } from "zod"

const usernameSchema = z
  .string()
  .min(1, "Username is required")
  .max(100, "Username must be at most 100 characters")

const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address")
  .max(255, "Email must be at most 255 characters")

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(200, "Password must be at most 200 characters")

export const createUserSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
})

export type CreateUserInput = z.infer<typeof createUserSchema>
