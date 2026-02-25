import { NextResponse } from 'next/server'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? ''

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { password } = body

    if (password === undefined || password === null) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 },
      )
    }

    // If no password is configured in env, allow empty password (local dev)
    if (!ADMIN_PASSWORD) {
      return NextResponse.json({ success: true })
    }

    // Check if provided password matches the admin password
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 },
    )
  }
}

export const fetchCache = 'force-no-store';
export const dynamic = 'force-dynamic';
