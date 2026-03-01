import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { destroySession } from "@/lib/auth";

export async function GET(request: NextRequest) {
	await destroySession();
	const url = request.nextUrl.clone();
	url.pathname = "/login";
	return NextResponse.redirect(url);
}

export async function POST() {
	await destroySession();
	return NextResponse.json({ success: true });
}
