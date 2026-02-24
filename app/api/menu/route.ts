import { NextResponse } from 'next/server'
import { getMenu } from '@/lib/store'

export async function GET() {
  return NextResponse.json(getMenu())
}

