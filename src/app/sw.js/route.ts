import { NextResponse } from "next/server";

// Handle service worker requests (often from browser extensions)
export async function GET() {
  return new NextResponse(null, { status: 204 });
}

