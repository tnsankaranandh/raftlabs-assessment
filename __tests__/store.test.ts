import { clearStore, createOrder, getMenu, getOrderById, updateOrderStatus } from '@/lib/store'

// Mock MongoDB and Mongoose
jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn().mockResolvedValue(null),
}))

jest.mock('@/lib/models/MenuItem', () => {
  const allItems = [
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
  ]

  return {
    MenuItem: {
      countDocuments: jest.fn().mockResolvedValue(2),
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(allItems),
      }),
      insertMany: jest.fn().mockResolvedValue(allItems),
    },
  }
})

jest.mock('@/lib/models/Order', () => {
  const mockOrders: any[] = []

  return {
    Order: {
      create: jest.fn((order) => {
        mockOrders.push({ ...order, _id: order.id })
        return Promise.resolve({ ...order, _id: order.id })
      }),
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockImplementation(() => Promise.resolve(mockOrders)),
      }),
      findOne: jest.fn((query) =>
        Promise.resolve(mockOrders.find((o) => o.id === query.id) || null),
      ),
      deleteMany: jest.fn(async () => {
        mockOrders.length = 0
      }),
      findByIdAndUpdate: jest.fn(async (id, update) => {
        const order = mockOrders.find((o) => o.id === id)
        if (order) Object.assign(order, update)
      }),
      updateOne: jest.fn(async (query, update) => {
        const order = mockOrders.find((o) => o.id === query.id)
        if (order) Object.assign(order, update)
      }),
    },
  }
})

describe('store', () => {
  beforeEach(async () => {
    await clearStore()
  })

  it('returns a non-empty menu', async () => {
    const menu = await getMenu()
    expect(menu.length).toBeGreaterThan(0)
  })

  it('creates an order with items and customer details', async () => {
    const menu = await getMenu()
    const order = await createOrder(
      [{ itemId: menu[0].id, quantity: 2 }],
      { name: 'Alice', address: '123 Main St', phone: '1234567890' },
    )
    expect(order.id).toBeTruthy()
    expect(order.items).toHaveLength(1)
    expect(order.customer.name).toBe('Alice')
  })

  it('rejects empty orders', async () => {
    await expect(
      createOrder([], { name: 'Bob', address: 'Somewhere', phone: '999' }),
    ).rejects.toThrow('Order must contain at least one item')
  })

  it('allows fetching order by id', async () => {
    const menu = await getMenu()
    const created = await createOrder(
      [{ itemId: menu[0].id, quantity: 1 }],
      { name: 'Carol', address: 'Street', phone: '111' },
    )
    const fetched = await getOrderById(created.id)
    expect(fetched?.id).toBe(created.id)
  })

  it('updates order status', async () => {
    const menu = await getMenu()
    const created = await createOrder(
      [{ itemId: menu[0].id, quantity: 1 }],
      { name: 'David', address: 'Avenue', phone: '222' },
    )
    const updated = await updateOrderStatus(created.id, 'PREPARING')
    expect(updated?.status).toBe('PREPARING')
  })
})

