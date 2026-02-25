'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Order } from '@/lib/types'

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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true)
        const adminSecret = sessionStorage.getItem('adminSecret') || ''
        const allOrders = await fetchJSON<Order[]>('/api/admin/orders')
        setOrders(allOrders)
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to load orders')
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
    const interval = setInterval(fetchOrders, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      <header className="layout-header">
        <div className="layout-header-inner">
          <div>
            <h1>Order Tracking</h1>
            <p style={{ margin: 0, opacity: 0.8 }}>View all orders and their live status.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link href="/" className="button secondary">
              ← Back to Menu
            </Link>
          </div>
        </div>
      </header>
      <main className="stack" aria-label="Orders tracking">
        <div className="card" aria-label="Orders list">
          <h2>All Orders</h2>
          {loading ? (
            <p>Loading orders...</p>
          ) : error ? (
            <div>
              <p className="error">{error}</p>
              <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                Note: You may need admin access to view all orders. Try setting the admin secret in
                sessionStorage.
              </p>
            </div>
          ) : orders.length === 0 ? (
            <p>No orders found. <Link href="/">Place an order</Link> to get started.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.9rem',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: 600 }}>
                      Order ID
                    </th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: 600 }}>
                      Customer Name
                    </th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: 600 }}>
                      Items
                    </th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: 600 }}>
                      Total
                    </th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', fontWeight: 600 }}>
                      Status
                    </th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: 600 }}>
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
                    return (
                      <tr
                        key={order.id}
                        style={{
                          borderBottom: '1px solid #e5e7eb',
                          
                        }}
                      >
                        <td style={{ padding: '0.75rem' }}>
                          <Link
                            href={`/orders/${order.id}`}
                            style={{
                              color: '#3b82f6',
                              textDecoration: 'none',
                              fontFamily: 'monospace',
                              fontSize: '0.85rem',
                            }}
                          >
                            {order.id}
                          </Link>
                        </td>
                        <td style={{ padding: '0.75rem' }}>{order.customer.name}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                            {order.items.map((item, idx) => (
                              <div key={idx}>
                                {item.name} × {item.quantity}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                          ₹{total.toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <StatusPill status={order.status} />
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

export const fetchCache = 'force-no-store';
export const dynamic = 'force-dynamic';
