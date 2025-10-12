import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    upstash: !!(process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN),
    groq: !!process.env.GROQ_API_KEY,
  })
}
