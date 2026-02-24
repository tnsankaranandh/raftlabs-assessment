'use client'

import { useEffect, useMemo, useState } from 'react'
import type { MenuItem, Order } from '@/lib/types'

type CartState = Record<string, number>

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed with ${res.status}`)
  }
  return res.json()
}

export default function HomePage() {
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartState>({})
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [placing, setPlacing] = useState(false)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchJSON<MenuItem[]>('/api/menu')
      .then(setMenu)
      .catch((err) => setError(err.message))
  }, [])

  const cartItemsDetailed = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = menu.find((m) => m.id === id)!
        return {
          ...item,
          quantity: qty,
          lineTotal: qty * item.price,
        }
      })
  }, [cart, menu])

  const cartTotal = useMemo(
    () => cartItemsDetailed.reduce((sum, item) => sum + item.lineTotal, 0),
    [cartItemsDetailed],
  )

  function updateQuantity(id: string, delta: number) {
    setCart((prev) => {
      const next = { ...prev }
      const current = next[id] ?? 0
      const updated = current + delta
      if (updated <= 0) {
        delete next[id]
      } else {
        next[id] = updated
      }
      return next
    })
  }

  async function placeOrder() {
    setError(null)
    if (!name.trim() || !address.trim() || !phone.trim()) {
      setError('Please fill in all delivery details.')
      return
    }
    if (cartItemsDetailed.length === 0) {
      setError('Your cart is empty.')
      return
    }
    setPlacing(true)
    try {
      const order = await fetchJSON<Order>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: Object.entries(cart).map(([itemId, quantity]) => ({
            itemId,
            quantity,
          })),
          customer: { name, address, phone },
        }),
      })
      setActiveOrder(order)
      setCart({})
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPlacing(false)
    }
  }

  useEffect(() => {
    if (!activeOrder) return
    const id = activeOrder.id
    const interval = setInterval(() => {
      fetchJSON<Order>(`/api/orders/${id}`)
        .then((updated) => setActiveOrder(updated))
        .catch(() => {
          /* ignore polling errors */
        })
    }, 5000)
    return () => clearInterval(interval)
  }, [activeOrder])

  return (
    <>
      <header className="layout-header">
        <div className="layout-header-inner">
          <div>
            <h1>Food Order Management</h1>
            <p style={{ margin: 0, opacity: 0.8 }}>Place an order and track its status.</p>
          </div>
          <div>
            <span className="badge">
              Cart:{' '}
              {Object.values(cart).reduce((sum, qty) => sum + qty, 0)}
            </span>
          </div>
        </div>
      </header>
      <main className="stack" aria-label="Food ordering experience">
        <section aria-label="Menu and cart" className="stack">
          <div className="card">
            <h2>Menu</h2>
            <p style={{ marginBottom: '1rem', color: '#4b5563' }}>
              Pick your favourites and add them to your cart.
            </p>
            {menu.length === 0 && !error && <p>Loading menu...</p>}
            {error && <p className="error">{error}</p>}
            <div className="grid">
              {menu.map((item) => {
                const quantity = cart[item.id] ?? 0
                return (
                  <article
                    key={item.id}
                    className="card"
                    aria-label={item.name}
                    style={{ padding: '1rem' }}
                  >
                    <div
                      style={{
                        height: 120,
                        borderRadius: 8,
                        background:
                          'linear-gradient(135deg, rgba(251,191,36,0.25), rgba(239,68,68,0.25))',
                        marginBottom: 8,
                      }}
                    />
                    <h3>{item.name}</h3>
                    <p style={{ fontSize: '0.9rem', color: '#4b5563' }}>{item.description}</p>
                    <p style={{ fontWeight: 600 }}>₹{item.price.toFixed(2)}</p>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 8,
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => updateQuantity(item.id, -1)}
                          disabled={quantity === 0}
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          −
                        </button>
                        <span aria-label={`${item.name} quantity`}>{quantity}</span>
                        <button
                          type="button"
                          className="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>

          <div className="card" aria-label="Cart summary">
            <h2>Cart</h2>
            {cartItemsDetailed.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {cartItemsDetailed.map((item) => (
                  <li
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                      fontSize: '0.9rem',
                    }}
                  >
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>₹{item.lineTotal.toFixed(2)}</span>
                  </li>
                ))}
                <li
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 8,
                    fontWeight: 600,
                  }}
                >
                  <span>Total</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </li>
              </ul>
            )}
          </div>
        </section>

        <section aria-label="Checkout and delivery details" className="card">
          <h2>Checkout</h2>
          <p style={{ fontSize: '0.9rem', color: '#4b5563' }}>
            Enter your delivery details to place the order.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void placeOrder()
            }}
            className="stack"
          >
            <div>
              <label>
                Name
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
            </div>
            <div>
              <label>
                Address
                <textarea
                  className="textarea"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  required
                />
              </label>
            </div>
            <div>
              <label>
                Phone
                <input
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </label>
            </div>
            {error && <p className="error">{error}</p>}
            <button
              type="submit"
              className="button"
              disabled={placing}
            >
              {placing ? 'Placing order…' : 'Place order'}
            </button>
          </form>
        </section>

        {activeOrder && (
          <section aria-label="Order status" className="card">
            <h2>Order Status</h2>
            <p style={{ fontSize: '0.9rem', color: '#4b5563' }}>
              Order ID: <code>{activeOrder.id}</code>
            </p>
            <StatusPill status={activeOrder.status} />
            <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
              This status updates automatically every few seconds to simulate a real delivery flow.
            </p>
          </section>
        )}
      </main>
    </>
  )
}

function StatusPill({ status }: { status: Order['status'] }) {
  let label = ''
  let className = 'status-pill '
  if (status === 'ORDER_RECEIVED') {
    label = 'Order Received'
    className += 'status-received'
  } else if (status === 'PREPARING') {
    label = 'Preparing'
    className += 'status-preparing'
  } else {
    label = 'Out for Delivery'
    className += 'status-out-for-delivery'
  }

  return <span className={className}>{label}</span>
}

