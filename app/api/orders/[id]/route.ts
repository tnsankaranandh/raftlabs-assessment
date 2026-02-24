import { NextResponse } from 'next/server'
import { getOrderById } from '@/lib/store'

type Params = {
  params: {
    id: string
  }
}

export async function GET(_request: Request, { params }: Params) {
  const order = getOrderById(params.id)
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  return NextResponse.json(order)
}

