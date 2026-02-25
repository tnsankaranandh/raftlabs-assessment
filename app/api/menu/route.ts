import { NextResponse } from 'next/server'
import { getMenu } from '@/lib/store'

export async function GET() {
  const menu = await getMenu()
  return NextResponse.json(menu)
}

