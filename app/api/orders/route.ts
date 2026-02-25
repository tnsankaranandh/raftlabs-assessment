import { NextResponse } from 'next/server'
import { createOrder, getAllOrders } from '@/lib/store'

export async function GET() {
  try {
    const orders = await getAllOrders()
    return NextResponse.json(orders)
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Failed to fetch orders' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items, customer } = body ?? {}
    const order = await createOrder(items ?? [], customer)
    return NextResponse.json(order, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Failed to create order' },
      { status: 400 },
    )
  }
}

