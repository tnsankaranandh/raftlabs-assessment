import { NextResponse } from 'next/server'
import { getAllOrders } from '@/lib/store'

export async function GET(request: Request) {
  const orders = await getAllOrders()
  return NextResponse.json(orders)
}
