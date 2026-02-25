export type MenuItem = {
  id: string
  name: string
  description: string
  price: number
  image: string // base64 encoded image
}

export type CartItem = {
  itemId: string
  quantity: number
}

export type OrderStatus = 'ORDER_RECEIVED' | 'PREPARING' | 'OUT_FOR_DELIVERY'

export type OrderCustomer = {
  name: string
  address: string
  phone: string
}

export type OrderItem = {
  itemId: string
  name: string
  price: number
  quantity: number
}

export type Order = {
  id: string
  items: OrderItem[]
  customer: OrderCustomer
  status: OrderStatus
  createdAt: string
}

