import { NextResponse } from 'next/server'
import { getAllOrders } from '@/lib/store'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? ''

function requireAdmin(request: Request): NextResponse | null {
  if (!ADMIN_PASSWORD) return null
  const secret = request.headers.get('x-admin-secret')
  if (secret !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export async function GET(request: Request) {
  const err = requireAdmin(request)
  if (err) return err
  const orders = await getAllOrders()
  return NextResponse.json(orders)
}
