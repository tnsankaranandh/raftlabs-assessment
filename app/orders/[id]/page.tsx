'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
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

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params?.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return

    async function fetchOrder() {
      try {
        setLoading(true)
        const fetchedOrder = await fetchJSON<Order>(`/api/orders/${orderId}`)
        setOrder(fetchedOrder)
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to load order')
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
    const interval = setInterval(fetchOrder, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [orderId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <>
      <header className="layout-header">
        <div className="layout-header-inner">
          <div>
            <h1>Order Details</h1>
            <p style={{ margin: 0, opacity: 0.8 }}>Track your order status in real-time.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link href="/orders" className="button secondary">
              ← Back to All Orders
            </Link>
          </div>
        </div>
      </header>
      <main className="stack" aria-label="Order details">
        {loading ? (
          <div className="card">
            <p>Loading order details...</p>
          </div>
        ) : error ? (
          <div className="card">
            <p className="error">{error}</p>
            <Link href="/orders">View all orders</Link>
          </div>
        ) : order ? (
          <>
            {/* Status and Summary */}
            <div className="card" aria-label="Order status">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h2>Order Status</h2>
                  <p style={{ fontSize: '0.9rem', color: '#4b5563', margin: 0 }}>
                    Order ID: <code>{order.id}</code>
                  </p>
                </div>
                <StatusPill status={order.status} />
              </div>
              <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#6b7280' }}>
                This status updates automatically every 5 seconds. Order was created on{' '}
                {formatDate(order.createdAt)}.
              </p>
            </div>

            {/* Customer Info */}
            <div className="card" aria-label="Customer information">
              <h2>Delivery Information</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: '#6b7280' }}>
                    Name
                  </p>
                  <p style={{ margin: 0, fontWeight: 500 }}>{order.customer.name}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: '#6b7280' }}>
                    Phone
                  </p>
                  <p style={{ margin: 0, fontWeight: 500 }}>{order.customer.phone}</p>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: '#6b7280' }}>
                  Delivery Address
                </p>
                <p style={{ margin: 0, fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                  {order.customer.address}
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div className="card" aria-label="Order items">
              <h2>Order Items</h2>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: 600 }}>Item</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', fontWeight: 600 }}>
                      Qty
                    </th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: 600 }}>
                      Price
                    </th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: 600 }}>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <strong>{item.name}</strong>
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', padding: '0.75rem' }}>₹{item.price.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '0.75rem', fontWeight: 600 }}>
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div
                style={{
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '2px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Order Total</p>
                  <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                    ₹
                    {order.items
                      .reduce((sum, item) => sum + item.price * item.quantity, 0)
                      .toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <Link href="/orders" className="button secondary">
                View All Orders
              </Link>
            </div>
          </>
        ) : null}
      </main>
    </>
  )
}
