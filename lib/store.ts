import type { MenuItem, Order, OrderCustomer, OrderItem, OrderStatus } from './types'
import { connectDB } from './mongodb'
import { MenuItem as MenuItemModel } from './models/MenuItem'
import { Order as OrderModel } from './models/Order'

const defaultMenu: MenuItem[] = [
  {
    id: 'margherita-pizza',
    name: 'Margherita Pizza',
    description: 'Classic pizza with fresh mozzarella, basil, and tomato sauce.',
    price: 10.99,
    imageUrl: '/images/margherita.jpg',
  },
  {
    id: 'cheeseburger',
    name: 'Cheeseburger',
    description: 'Juicy beef patty, cheddar cheese, lettuce, and tomato.',
    price: 8.49,
    imageUrl: '/images/cheeseburger.jpg',
  },
  {
    id: 'veggie-bowl',
    name: 'Veggie Bowl',
    description: 'Roasted vegetables with quinoa and tahini drizzle.',
    price: 9.25,
    imageUrl: '/images/veggie-bowl.jpg',
  },
]

export async function getMenu(): Promise<MenuItem[]> {
  await connectDB()
  let items = await MenuItemModel.find({}).lean()

  // Initialize menu if empty
  if (items.length === 0) {
    await MenuItemModel.insertMany(defaultMenu)
    items = await MenuItemModel.find({}).lean()
  }

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    imageUrl: item.imageUrl,
  }))
}

export function computeStatusForOrder(order: Order, now = new Date()): OrderStatus {
  const created = new Date(order.createdAt).getTime()
  const elapsedSeconds = (now.getTime() - created) / 1000

  if (elapsedSeconds < 20) return 'ORDER_RECEIVED'
  if (elapsedSeconds < 60) return 'PREPARING'
  return 'OUT_FOR_DELIVERY'
}

export async function createOrder(
  items: { itemId: string; quantity: number }[],
  customer: OrderCustomer,
): Promise<Order> {
  if (!customer.name.trim() || !customer.address.trim() || !customer.phone.trim()) {
    throw new Error('Missing required customer details')
  }
  if (items.length === 0) {
    throw new Error('Order must contain at least one item')
  }

  await connectDB()
  const menuItems = await MenuItemModel.find({}).lean()

  const orderItems: OrderItem[] = items.map(({ itemId, quantity }) => {
    const menuItem = menuItems.find((m) => m.id === itemId)
    if (!menuItem) {
      throw new Error(`Invalid menu item: ${itemId}`)
    }
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than zero')
    }
    return {
      itemId,
      name: menuItem.name,
      price: menuItem.price,
      quantity,
    }
  })

  const order: Order = {
    id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    items: orderItems,
    customer,
    status: 'ORDER_RECEIVED',
    createdAt: new Date().toISOString(),
  }

  await OrderModel.create(order)
  return order
}

export async function getAllOrders(): Promise<Order[]> {
  await connectDB()
  const orders = await OrderModel.find({}).lean()
  return orders.map((o) => {
    const status = computeStatusForOrder(o)
    if (status !== o.status) {
      // Note: Update is not awaited here to maintain compatibility with caller
      OrderModel.findByIdAndUpdate(o._id, { status }).catch(() => {})
    }
    return {
      id: o.id,
      items: o.items,
      customer: o.customer,
      status,
      createdAt: o.createdAt,
    }
  })
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order | undefined> {
  await connectDB()
  const result = await OrderModel.findOne({ id }).lean()
  if (!result) return undefined

  await OrderModel.updateOne({ id }, { status })

  return {
    id: result.id as string,
    items: result.items as OrderItem[],
    customer: result.customer as OrderCustomer,
    status: status as OrderStatus,
    createdAt: result.createdAt as string,
  }
}

export async function clearStore(): Promise<void> {
  await connectDB()
  await OrderModel.deleteMany({})
}


