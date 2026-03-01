import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createHash } from "crypto";

import { createSession } from "@/lib/auth";

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

	const adminEmail = process.env.ADMIN_EMAIL;
	const adminPassword = process.env.ADMIN_PASSWORD;
	const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

	if (!adminEmail || (!adminPassword && !adminPasswordHash)) {
		return NextResponse.json(
			{ error: "Admin credentials are not configured" },
			{ status: 500 },
		);
	}

	let valid = false;

	if (adminPassword && password === adminPassword && email === adminEmail) {
		valid = true;
	} else if (adminPasswordHash) {
		const incomingHash = createHash("sha256")
			.update(password)
			.digest("hex");
		if (email === adminEmail && incomingHash === adminPasswordHash) {
			valid = true;
		}
	}

	if (!valid) {
		return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
	}

	await createSession(email);

	return NextResponse.json({ success: true });
}
