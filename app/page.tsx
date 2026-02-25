'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { MenuItem } from '@/lib/types'

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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchJSON<MenuItem[]>('/api/menu')
      .then((items) => {
        setMenu(items)
        // Store menu in sessionStorage for other pages
        sessionStorage.setItem('menu', JSON.stringify(items))
      })
      .catch((err) => setError(err.message))
  }, [])

  // Load cart from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('cart')
    if (stored) {
      try {
        setCart(JSON.parse(stored))
      } catch {
        setCart({})
      }
    }
  }, [])

  const cartItemCount = useMemo(
    () => Object.values(cart).reduce((sum, qty) => sum + qty, 0),
    [cart],
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
      // Persist to sessionStorage
      sessionStorage.setItem('cart', JSON.stringify(next))
      return next
    })
  }

  return (
    <>
      <header className="layout-header">
        <div className="layout-header-inner">
          <div>
            <h1>Food Order Management</h1>
            <p style={{ margin: 0, opacity: 0.8 }}>Pick your favourites and place an order.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="badge" style={{ marginRight: '0.5rem' }}>
              Cart: {cartItemCount}
            </span>
            <Link href="/cart" className="button">
              View Cart
            </Link>
            <Link href="/orders" className="button secondary">
              Track Orders
            </Link>
          </div>
        </div>
      </header>
      <main className="stack" aria-label="Food ordering experience">
        <section aria-label="Menu" className="card">
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
        </section>

        {cartItemCount > 0 && (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <p style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
              You have <strong>{cartItemCount}</strong> item{cartItemCount !== 1 ? 's' : ''} in your cart
            </p>
            <Link href="/checkout" className="button">
              Proceed to Checkout →
            </Link>
          </div>
        )}
      </main>
    </>
  )
}

