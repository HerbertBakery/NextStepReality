import { NextResponse } from "next/server";
export async function GET() { return NextResponse.text("OK", { status: 200 }); }
