'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { MenuItem, Order } from '@/lib/types'

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    cache: 'no-store',
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

export default function CheckoutPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cartItems = useMemo(() => {
    if (typeof window === 'undefined') return {}
    const stored = sessionStorage.getItem('cart')
    return stored ? JSON.parse(stored) : {}
  }, [])

  const cartMenuItemDetails = useMemo(() => {
    if (typeof window === 'undefined') return []
    const stored = sessionStorage.getItem('cartMenuItemDetails')
    return stored ? JSON.parse(stored) : []
  }, [])

  const cartItemsDetailed = useMemo(() => {
    return Object.entries(cartItems)
      .filter(([, qty]) => (qty as number) > 0)
      .map(([id, qty]) => {
        const item = cartMenuItemDetails.find((m: MenuItem) => m.id === id)
        if (!item) return null
        return {
          ...item,
          quantity: qty as number,
          lineTotal: (qty as number) * item.price,
        }
      })
      .filter(Boolean)
  }, [cartItems, cartMenuItemDetails])

  const cartTotal = useMemo(
    () => cartItemsDetailed.reduce((sum, item) => sum + (item?.lineTotal || 0), 0),
    [cartItemsDetailed],
  )

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault()
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
          items: Object.entries(cartItems).map(([itemId, quantity]) => ({
            itemId,
            quantity,
          })),
          customer: { name, address, phone },
        }),
      })

      // Clear cart and store order ID
      sessionStorage.removeItem('cart')
      sessionStorage.setItem('lastOrderId', order.id)

      // Redirect to order tracking
      router.push(`/orders/${order.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPlacing(false)
    }
  }

  return (
    <>
      <header className="layout-header">
        <div className="layout-header-inner">
          <div>
            <h1>Checkout</h1>
            <p style={{ margin: 0, opacity: 0.8 }}>Complete your order with delivery details.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link href="/cart" className="button secondary">
              ← Back to Cart
            </Link>
          </div>
        </div>
      </header>
      <main className="stack" aria-label="Checkout">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Order Summary */}
          <div className="card" aria-label="Order summary">
            <h2>Order Summary</h2>
            {cartItemsDetailed.length === 0 ? (
              <p>Your cart is empty. <Link href="/">Add items first</Link>.</p>
            ) : (
              <>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '1rem' }}>
                  {cartItemsDetailed.map((item) => (
                    <li
                      key={item?.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem',
                      }}
                    >
                      <span>
                        {item?.name} × {item?.quantity}
                      </span>
                      <span>₹{(item?.lineTotal || 0).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ paddingTop: '1rem', borderTop: '2px solid #e5e7eb' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                    }}
                  >
                    <span>Total</span>
                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Delivery Form */}
          <div className="card" aria-label="Delivery details form">
            <h2>Delivery Details</h2>
            <p style={{ fontSize: '0.9rem', color: '#4b5563' }}>
              Enter your information to complete the order.
            </p>
            <form onSubmit={placeOrder} className="stack">
              <div>
                <label>
                  Full Name *
                  <input
                    className="input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </label>
              </div>
              <div>
                <label>
                  Delivery Address *
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
                  Phone Number *
                  <input
                    className="input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </label>
              </div>
              {error && <p className="error">{error}</p>}
              <button type="submit" className="button" disabled={placing || cartItemsDetailed.length === 0}>
                {placing ? 'Placing order…' : `Place Order (₹${cartTotal.toFixed(2)})`}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  )
}

export const fetchCache = 'force-no-store';
export const dynamic = 'force-dynamic';
