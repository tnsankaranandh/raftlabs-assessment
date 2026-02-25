'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import type { MenuItem } from '@/lib/types'

type CartState = Record<string, number>

interface MenuResponse {
  items: MenuItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

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

export default function HomePage() {
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartState>({})
  const [cartMenuItemDetails, setCartMenuItemDetails] = useState<MenuItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, startTransition] = useTransition()

  const fetchMenuItems = async (page: number, search: string) => {
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      if (search) params.set('search', search)

      const response = await fetchJSON<MenuResponse>(`/api/menu?${params.toString()}`)
      setMenu(response.items)
      setCurrentPage(response.pagination.page)
      setTotalPages(response.pagination.totalPages)
    } catch (err: any) {
      setError(err.message)
    }
  }

  useEffect(() => {
    fetchMenuItems(1, '')
  }, [])

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        fetchMenuItems(1, searchQuery)
      })
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

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

  function updateQuantity(item: MenuItem, delta: number) {
    setCart((prev) => {
      const next = { ...prev }
      const id = item.id
      const current = next[id] ?? 0
      const updated = current + delta
      const indexInCartDetails = cartMenuItemDetails.findIndex((i) => i.id === id)
      let newCartMenuItemDetails = [...cartMenuItemDetails];
      if (updated <= 0) {
        delete next[id]
        if (indexInCartDetails !== -1) {
          const updatedDetails = [...cartMenuItemDetails]
          updatedDetails.splice(indexInCartDetails, 1)
          newCartMenuItemDetails = updatedDetails
          setCartMenuItemDetails(updatedDetails)
        }
      } else {
        next[id] = updated
        if (indexInCartDetails === -1) {
          newCartMenuItemDetails = [...cartMenuItemDetails, item];
          setCartMenuItemDetails(() => newCartMenuItemDetails)
        }
      }
      sessionStorage.setItem('cart', JSON.stringify(next))
      sessionStorage.setItem('cartMenuItemDetails', JSON.stringify(newCartMenuItemDetails))
      
      return next
    })
  }

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  const handlePaginationChange = (newPage: number) => {
    startTransition(() => {
      fetchMenuItems(newPage, searchQuery)
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
            <a
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="button secondary"
              style={{ backgroundColor: 'rgba(245, 151, 39, 0.8)' }}
            >
              Admin →
            </a>
          </div>
        </div>
      </header>
      <main className="stack" aria-label="Food ordering experience">
        <section aria-label="Menu" className="card">
          <h2>Menu</h2>
          <p style={{ marginBottom: '1rem', color: '#4b5563' }}>
            Pick your favourites and add them to your cart.
          </p>

          {/* Search Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="input"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search menu items"
                style={{ flex: 1 }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={handleClearSearch}
                  disabled={isSearching}
                  aria-label="Clear search"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {menu.length === 0 && !error && !searchQuery && <p>Loading menu...</p>}
          {error && <p className="error">{error}</p>}
          {menu.length === 0 && !isSearching && searchQuery && (
            <p style={{ color: '#4b5563' }}>No items found for "{searchQuery}"</p>
          )}

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
                      background: '#f0f0f0',
                      marginBottom: 8,
                      backgroundImage: `url("${item.image}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
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
                        onClick={() => updateQuantity(item, -1)}
                        disabled={quantity === 0}
                        aria-label={`Decrease ${item.name} quantity`}
                      >
                        −
                      </button>
                      <span aria-label={`${item.name} quantity`}>{quantity}</span>
                      <button
                        type="button"
                        className="button"
                        onClick={() => updateQuantity(item, 1)}
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

          {/* Pagination Section */}
          {totalPages > 1 && menu.length > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e5e7eb',
              }}
            >
              <button
                type="button"
                className="button secondary"
                onClick={() => handlePaginationChange(currentPage - 1)}
                disabled={currentPage === 1 || isSearching}
                aria-label="Previous page"
              >
                ← Previous
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    className="button"
                    onClick={() => handlePaginationChange(page)}
                    disabled={currentPage === page || isSearching}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: currentPage === page ? '#4b5563' : '#f3f4f6',
                      color: currentPage === page ? 'white' : 'inherit',
                    }}
                    aria-label={`Page ${page}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="button secondary"
                onClick={() => handlePaginationChange(currentPage + 1)}
                disabled={currentPage === totalPages || isSearching}
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          )}
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

