import { z } from "zod"

const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(200, "Name must be at most 200 characters")
  .regex(/^[A-Za-z\s]+$/, "Name must contain only letters and spaces")

const registerNoSchema = z
  .string()
  .min(2, "Register number must be at least 2 characters")
  .max(50, "Register number must be at most 50 characters")

const serialNumberSchema = z
  .string()
  .min(2, "Serial number must be at least 2 characters")
  .max(50, "Serial number must be at most 50 characters")

const yearSchema = z
  .coerce.string()
  .refine((s) => s.length === 4 && /^\d{4}$/.test(s), {
    message: "Year must be exactly 4 digits (e.g. 2025)",
  })

export const createStudentSchema = z.object({
  name: nameSchema,
  register_no: registerNoSchema,
  serial_number: serialNumberSchema,
  year: yearSchema,
})

export const updateStudentSchema = z.object({
  id: z.coerce.number().int().positive("Valid student id is required"),
  name: nameSchema,
  register_no: registerNoSchema,
  serial_number: serialNumberSchema,
  year: yearSchema,
})

export const deleteStudentSchema = z.object({
  id: z.coerce.number().int().positive("Valid student id is required"),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>
export type DeleteStudentInput = z.infer<typeof deleteStudentSchema>
