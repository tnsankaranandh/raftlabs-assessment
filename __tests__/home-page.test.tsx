import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'

jest.mock('@/lib/store', () => ({
  // Avoid hitting real API in this simple component test
}))

describe('HomePage UI', () => {
  it('renders header and sections', () => {
    render(<HomePage />)
    expect(screen.getByText(/Food Order Management/i)).toBeInTheDocument()
    expect(screen.getByText(/Checkout/i)).toBeInTheDocument()
  })
})

