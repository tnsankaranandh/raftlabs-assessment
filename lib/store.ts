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
  const orders = (await OrderModel.find({}).lean()) as any[]
  return orders.map((o: any) => {
    return {
      id: o.id as string,
      items: o.items as OrderItem[],
      customer: o.customer as OrderCustomer,
      status: o.status as OrderStatus,
      createdAt: o.createdAt as string,
    }
  })
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  await connectDB()
  const existing = (await OrderModel.findOne({ id }).lean()) as any
  if (!existing) return undefined

  return {
    id: existing.id as string,
    items: existing.items as OrderItem[],
    customer: existing.customer as OrderCustomer,
    status: existing.status as OrderStatus,
    createdAt: existing.createdAt as string,
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order | undefined> {
  await connectDB()
  const result = (await OrderModel.findOne({ id }).lean()) as any
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


