import { clearStore, createOrder, getMenu, getOrderById } from '@/lib/store'

describe('store', () => {
  beforeEach(() => {
    clearStore()
  })

  it('returns a non-empty menu', () => {
    const menu = getMenu()
    expect(menu.length).toBeGreaterThan(0)
  })

  it('creates an order with items and customer details', () => {
    const menu = getMenu()
    const order = createOrder(
      [{ itemId: menu[0].id, quantity: 2 }],
      { name: 'Alice', address: '123 Main St', phone: '1234567890' },
    )
    expect(order.id).toBeTruthy()
    expect(order.items).toHaveLength(1)
    expect(order.customer.name).toBe('Alice')
  })

  it('rejects empty orders', () => {
    expect(() =>
      createOrder([], { name: 'Bob', address: 'Somewhere', phone: '999' }),
    ).toThrow('Order must contain at least one item')
  })

  it('allows fetching order by id', () => {
    const menu = getMenu()
    const created = createOrder(
      [{ itemId: menu[0].id, quantity: 1 }],
      { name: 'Carol', address: 'Street', phone: '111' },
    )
    const fetched = getOrderById(created.id)
    expect(fetched?.id).toBe(created.id)
  })
})

