import type { MenuItem, Order, OrderCustomer, OrderItem, OrderStatus } from './types'
import { connectDB } from './mongodb'
import { MenuItem as MenuItemModel } from './models/MenuItem'
import { Order as OrderModel } from './models/Order'

export async function getMenu(page = 1, pageSize = 10): Promise<MenuItem[]> {
  await connectDB()
  const skip = (page - 1) * pageSize
  const items = await MenuItemModel.find({})
    .skip(skip)
    .limit(pageSize)
    .lean()

  return items.map((item: any) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    image: item.image,
  }))
}

export async function searchMenuItems(query: string, page = 1, pageSize = 10): Promise<MenuItem[]> {
  await connectDB()

  const searchRegex = new RegExp(query, 'i')
  const skip = (page - 1) * pageSize
  
  const items = await MenuItemModel.find({
    $or: [
      { name: searchRegex },
      { description: searchRegex },
    ],
  })
    .skip(skip)
    .limit(pageSize)
    .lean()

  return items.map((item: any) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    image: item.image,
  }))
}

export async function getMenuCount(): Promise<number> {
  await connectDB()
  return MenuItemModel.countDocuments({})
}

export async function getSearchResultCount(query: string): Promise<number> {
  await connectDB()
  const searchRegex = new RegExp(query, 'i')
  return MenuItemModel.countDocuments({
    $or: [
      { name: searchRegex },
      { description: searchRegex },
    ],
  })
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
  
  // Fetch the updated document to ensure we return the latest data
  const updated = (await OrderModel.findOne({ id }).lean()) as any
  if (!updated) return undefined

  return {
    id: updated.id as string,
    items: updated.items as OrderItem[],
    customer: updated.customer as OrderCustomer,
    status: updated.status as OrderStatus,
    createdAt: updated.createdAt as string,
  }
}

export async function clearStore(): Promise<void> {
  await connectDB()
  await OrderModel.deleteMany({})
}


