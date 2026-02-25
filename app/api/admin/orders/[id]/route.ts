import { NextResponse } from 'next/server'
import { updateOrderStatus } from '@/lib/store'
import type { OrderStatus } from '@/lib/types'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? ''

function requireAdmin(request: Request): NextResponse | null {
  if (!ADMIN_PASSWORD) return null
  const secret = request.headers.get('x-admin-secret')
  if (secret !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

const VALID_STATUSES: OrderStatus[] = ['ORDER_RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY']

type Params = { params: { id: string } }

export async function PATCH(request: Request, { params }: Params) {
  const err = requireAdmin(request)
  if (err) return err
  const body = await request.json().catch(() => ({}))
  const { status } = body
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: 'Invalid status. Use ORDER_RECEIVED, PREPARING, or OUT_FOR_DELIVERY' },
      { status: 400 },
    )
  }
  const order = await updateOrderStatus(params.id, status as OrderStatus)
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  return NextResponse.json(order)
}
