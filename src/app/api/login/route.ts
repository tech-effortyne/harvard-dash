import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createHash } from "crypto";

import { createSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function POST(request: NextRequest) {
	const body = await request.json().catch(() => null);

	const email = body?.email as string | undefined;
	const password = body?.password as string | undefined;

	if (!email || !password) {
		return NextResponse.json(
			{ error: "Email and password are required" },
			{ status: 400 },
		);
	}

	const normalizedEmail = email.trim().toLowerCase();

	try {
		const rows = await sql`
			SELECT id, username, email, password_hash
			FROM users
			WHERE email = ${normalizedEmail}
			LIMIT 1
		` as { id: number; username: string; email: string; password_hash: string | null }[];

		const user = rows[0];
		if (!user) {
			return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
		}

		const passwordHash = createHash("sha256").update(password).digest("hex");
		if (user.password_hash !== passwordHash) {
			return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
		}

		await createSession(user.email, user.username);
		return NextResponse.json({ success: true });
	} catch (err) {
		console.error("Login error:", err);
		return NextResponse.json(
			{ error: "Authentication failed" },
			{ status: 500 },
		);
	}
}
