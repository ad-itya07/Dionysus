import { NextResponse } from "next/server";

// Handle SSE endpoint requests (often from development tools or browser extensions)
export async function GET() {
  return new NextResponse(null, { status: 204 });
}

