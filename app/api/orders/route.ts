import { NextResponse } from 'next/server'
import { createOrder } from '@/lib/store'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items, customer } = body ?? {}
    const order = createOrder(items ?? [], customer)
    return NextResponse.json(order, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Failed to create order' },
      { status: 400 },
    )
  }
}

