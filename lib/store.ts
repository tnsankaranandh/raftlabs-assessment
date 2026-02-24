import type { MenuItem, Order, OrderCustomer, OrderItem, OrderStatus } from './types'

const menu: MenuItem[] = [
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

let orders: Order[] = []

export function getMenu(): MenuItem[] {
  return menu
}

function nextStatus(status: OrderStatus): OrderStatus {
  if (status === 'ORDER_RECEIVED') return 'PREPARING'
  if (status === 'PREPARING') return 'OUT_FOR_DELIVERY'
  return 'OUT_FOR_DELIVERY'
}

export function computeStatusForOrder(order: Order, now = new Date()): OrderStatus {
  const created = new Date(order.createdAt).getTime()
  const elapsedSeconds = (now.getTime() - created) / 1000

  if (elapsedSeconds < 20) return 'ORDER_RECEIVED'
  if (elapsedSeconds < 60) return 'PREPARING'
  return 'OUT_FOR_DELIVERY'
}

export function createOrder(
  items: { itemId: string; quantity: number }[],
  customer: OrderCustomer,
): Order {
  if (!customer.name.trim() || !customer.address.trim() || !customer.phone.trim()) {
    throw new Error('Missing required customer details')
  }
  if (items.length === 0) {
    throw new Error('Order must contain at least one item')
  }

  const orderItems: OrderItem[] = items.map(({ itemId, quantity }) => {
    const menuItem = menu.find((m) => m.id === itemId)
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

  orders.push(order)
  return order
}

export function getOrderById(id: string): Order | undefined {
  const existing = orders.find((o) => o.id === id)
  if (!existing) return undefined

  const status = computeStatusForOrder(existing)
  if (status !== existing.status) {
    existing.status = status
  }
  return existing
}

export function updateOrderStatus(id: string, status: OrderStatus): Order | undefined {
  const order = orders.find((o) => o.id === id)
  if (!order) return undefined
  order.status = status
  return order
}

export function clearStore() {
  orders = []
}

