'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import type { MenuItem } from '@/lib/types'

type CartState = Record<string, number>

interface CartPageProps {
  cartItems: CartState
  menuItems: MenuItem[]
  onUpdateQuantity: (id: string, delta: number) => void
}

export default function CartPage() {
  // Get cart from localStorage or session
  const cartItems = useMemo(() => {
    if (typeof window === 'undefined') return {}
    const stored = sessionStorage.getItem('cart')
    return stored ? JSON.parse(stored) : {}
  }, [])

  const menuItems = useMemo(() => {
    if (typeof window === 'undefined') return []
    const stored = sessionStorage.getItem('menu')
    return stored ? JSON.parse(stored) : []
  }, [])

  const cartItemsDetailed = useMemo(() => {
    return Object.entries(cartItems)
      .filter(([, qty]) => (qty as number) > 0)
      .map(([id, qty]) => {
        const item = menuItems.find((m: MenuItem) => m.id === id)
        if (!item) return null
        return {
          ...item,
          quantity: qty as number,
          lineTotal: (qty as number) * item.price,
        }
      })
      .filter(Boolean)
  }, [cartItems, menuItems])

  const cartTotal = useMemo(
    () => cartItemsDetailed.reduce((sum, item) => sum + (item?.lineTotal || 0), 0),
    [cartItemsDetailed],
  )

  function updateQuantity(id: string, delta: number) {
    const next = { ...cartItems }
    const current = next[id] ?? 0
    const updated = current + delta
    if (updated <= 0) {
      delete next[id]
    } else {
      next[id] = updated
    }
    sessionStorage.setItem('cart', JSON.stringify(next))
    window.location.reload()
  }

  return (
    <>
      <header className="layout-header">
        <div className="layout-header-inner">
          <div>
            <h1>Shopping Cart</h1>
            <p style={{ margin: 0, opacity: 0.8 }}>Review your items before checkout.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link href="/" className="button secondary">
              ← Back to Menu
            </Link>
          </div>
        </div>
      </header>
      <main className="stack" aria-label="Shopping cart">
        <div className="card" aria-label="Cart summary">
          <h2>Cart Items</h2>
          {cartItemsDetailed.length === 0 ? (
            <p>Your cart is empty. <Link href="/">Go back to the menu</Link> to add items.</p>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem', fontWeight: 600 }}>Item</th>
                    <th style={{ textAlign: 'center', padding: '0.5rem', fontWeight: 600 }}>
                      Quantity
                    </th>
                    <th style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 600 }}>
                      Price
                    </th>
                    <th style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 600 }}>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cartItemsDetailed.map((item) => (
                    <tr key={item?.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <strong>{item?.name}</strong>
                        <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
                          {item?.description}
                        </p>
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => updateQuantity(item?.id || '', -1)}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
                          >
                            −
                          </button>
                          <span style={{ minWidth: '2rem', textAlign: 'center' }}>
                            {item?.quantity}
                          </span>
                          <button
                            type="button"
                            className="button"
                            onClick={() => updateQuantity(item?.id || '', 1)}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.75rem' }}>
                        ₹{(item?.price || 0).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.75rem', fontWeight: 600 }}>
                        ₹{(item?.lineTotal || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '0.5rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, color: '#6b7280' }}>Subtotal</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                    ₹{cartTotal.toFixed(2)}
                  </p>
                </div>
              </div>

              <Link href="/checkout" className="button">
                Proceed to Checkout →
              </Link>
            </>
          )}
        </div>
      </main>
    </>
  )
}
