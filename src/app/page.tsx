import { redirect } from "next/navigation"
import { LayoutDashboard, Users, Database, ShieldCheck } from "lucide-react"

import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ThemeToggle } from "@/components/theme-toggle"

type StudentRow = {
  name: string
  register_no: string
  serial_number: string
  year: string | null
}

export const dynamic = "force-dynamic"

export default async function Home() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const students =
    ((await sql`
      SELECT name, register_no, serial_number, year
      FROM students
      ORDER BY created_at DESC NULLS LAST
      LIMIT 50
    `) as StudentRow[]) ?? []

  const totalStudents = students.length
  const recentYearCount = students.filter((s) => s.year === "2025").length

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 border-r bg-sidebar text-sidebar-foreground p-4 md:flex md:flex-col">
          {/* Brand */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold">
              HF
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Admin
              </p>
              <p className="text-sm font-semibold">Harvard Fire Safety</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="space-y-1 text-sm">
            <div className="rounded-md bg-sidebar-primary text-sidebar-primary-foreground px-3 py-2 flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span>Overview</span>
            </div>
            <div className="rounded-md px-3 py-2 flex items-center gap-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-default">
              <Users className="h-4 w-4" />
              <span>Students</span>
            </div>
            <div className="rounded-md px-3 py-2 flex items-center gap-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-default">
              <Database className="h-4 w-4" />
              <span>Database</span>
            </div>
            <div className="rounded-md px-3 py-2 flex items-center gap-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-default">
              <ShieldCheck className="h-4 w-4" />
              <span>Security</span>
            </div>
          </nav>

          {/* Footer */}
          <div className="mt-auto pt-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Harvard Fire Safety
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 py-6 md:px-8">
          <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Signed in as <span className="font-medium">{session.email}</span>
              </p>
            </div>
            <ThemeToggle />
          </header>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total students
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStudents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Year 2025
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentYearCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Records source
                </CardTitle>
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Data synced from local Postgres.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Latest students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Register No</TableHead>
                    <TableHead>Serial No</TableHead>
                    <TableHead>Year</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No students found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((student) => (
                      <TableRow
                        key={`${student.serial_number}-${student.register_no}`}
                      >
                        <TableCell className="font-medium">
                          {student.name}
                        </TableCell>
                        <TableCell>{student.register_no}</TableCell>
                        <TableCell>{student.serial_number}</TableCell>
                        <TableCell>{student.year ?? "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
