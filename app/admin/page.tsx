'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import type { Order, OrderStatus } from '@/lib/types'

const STORAGE_KEY = 'admin_secret'

const STATUS_LABELS: Record<OrderStatus, string> = {
  ORDER_RECEIVED: 'Order Received',
  PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for Delivery',
}

async function fetchWithAuth<T>(
  url: string,
  secret: string | null,
  options?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string>) ?? {}),
  }
  if (secret) headers['x-admin-secret'] = secret

  const res = await fetch(url, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`)
  return data
}

export default function AdminPage() {
  const [secret, setSecret] = useState<string | null>(null)
  const [passwordInput, setPasswordInput] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadSecret = useCallback(() => {
    if (typeof window === 'undefined') return null
    return sessionStorage.getItem(STORAGE_KEY)
  }, [])

  const fetchOrders = useCallback(async (authSecret: string | null) => {
    setError(null)
    try {
      const data = await fetchWithAuth<Order[]>('/api/admin/orders', authSecret)
      setOrders(data)
      setNeedsLogin(false)
      return true
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('unauthorized')) {
        sessionStorage.removeItem(STORAGE_KEY)
        setSecret(null)
        setNeedsLogin(true)
      } else {
        setError(err.message)
      }
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const s = loadSecret()
    if (s !== null) {
      setSecret(s)
    } else {
      // No secret in session storage, redirect to login
      setNeedsLogin(true)
      setLoading(false)
    }
  }, [loadSecret])

  useEffect(() => {
    if (needsLogin) {
      // Don't fetch orders if login is needed
      return
    }
    const s = secret ?? loadSecret()
    if (s) {
      fetchOrders(s)
    }
  }, [secret, needsLogin, fetchOrders, loadSecret])

  // Auto-refresh orders every 5 seconds when authenticated
  useEffect(() => {
    if (!needsLogin && secret) {
      const interval = setInterval(() => {
        const s = loadSecret()
        if (s) {
          fetchOrders(s)
        }
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [needsLogin, secret, loadSecret, fetchOrders])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // Call login API to verify password
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: passwordInput }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error || `Login failed with status ${res.status}`)
      }

      // If login successful, store the password and set secret
      sessionStorage.setItem(STORAGE_KEY, passwordInput)
      setSecret(passwordInput)
      setNeedsLogin(false)
      setPasswordInput('')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    const s = secret ?? loadSecret()
    if (!s) return setNeedsLogin(true)
    setUpdatingId(orderId)
    setError(null)
    try {
      const updated = await fetchWithAuth<Order>(`/api/admin/orders/${orderId}`, s, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updated : o)),
      )
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  if (needsLogin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: 360 }}>
          <h1>Restaurant Admin</h1>
          <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
            Sign in to manage orders.
          </p>
          <form onSubmit={handleLogin} className="stack">
            <label>
              Password
              <input
                type="password"
                className="input"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Admin password"
                autoComplete="current-password"
              />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="button">
              Sign in
            </button>
          </form>
          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#6b7280' }}>
            If no password is configured (local dev), leave empty and submit.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <header className="layout-header">
        <div className="layout-header-inner">
          <Link href="/" style={{ color: 'white', textDecoration: 'none' }}>
            ← Back to store
          </Link>
          <h1 style={{ margin: 0 }}>Restaurant Admin</h1>
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              sessionStorage.removeItem(STORAGE_KEY)
              setSecret(null)
              setOrders([])
              setNeedsLogin(true)
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <main>
        <div className="card">
          <h2>Open Orders</h2>
          <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
            View and update order status.
          </p>
          {error && <p className="error">{error}</p>}
          {loading ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="card"
                  style={{ padding: '1rem', border: '1px solid #e5e7eb' }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <strong>Order {order.id}</strong>
                      <div style={{ fontSize: '0.9rem', color: '#4b5563', marginTop: 4 }}>
                        {order.customer.name} · {order.customer.phone}
                      </div>
                      <div style={{ fontSize: '0.85rem', marginTop: 4 }}>
                        {order.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
                      </div>
                      <div style={{ fontSize: '0.85rem', marginTop: 2 }}>
                        {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <select
                        className="input"
                        value={order.status}
                        onChange={(e) => {
                          const val = e.target.value as OrderStatus
                          if (val !== order.status) handleUpdateStatus(order.id, val)
                        }}
                        disabled={updatingId === order.id}
                        style={{ minWidth: 180 }}
                      >
                        {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      {updatingId === order.id && (
                        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Updating…</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  )
}
