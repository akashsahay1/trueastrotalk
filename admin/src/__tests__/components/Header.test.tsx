import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Header from '../../components/Header'

// Mock SweetAlert2
const mockSwal = {
  fire: jest.fn(),
  close: jest.fn(),
}
jest.mock('sweetalert2', () => mockSwal)

// Mock next/navigation
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
}
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      userId: 'test-user-id',
      full_name: 'Test User',
      email_address: 'test@example.com',
    }))
  })

  it('should render header with user information', () => {
    render(<Header />)

    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('should show logout confirmation when logout is clicked', async () => {
    mockSwal.fire.mockResolvedValue({ isConfirmed: false })

    render(<Header />)

    const logoutButton = screen.getByRole('button', { name: /logout/i })
    fireEvent.click(logoutButton)

    expect(mockSwal.fire).toHaveBeenCalledWith({
      title: 'Confirm Logout',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel'
    })
  })

  it('should logout user when confirmed', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })

    mockSwal.fire.mockResolvedValue({ isConfirmed: true })

    render(<Header />)

    const logoutButton = screen.getByRole('button', { name: /logout/i })
    fireEvent.click(logoutButton)

    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('adminUser')
      expect(mockRouter.push).toHaveBeenCalledWith('/admin/login')
    })
  })

  it('should handle logout API error gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

    mockSwal.fire.mockResolvedValue({ isConfirmed: true })

    render(<Header />)

    const logoutButton = screen.getByRole('button', { name: /logout/i })
    fireEvent.click(logoutButton)

    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('adminUser')
      expect(mockRouter.push).toHaveBeenCalledWith('/admin/login')
    })
  })

  it('should not logout when user cancels', async () => {
    mockSwal.fire.mockResolvedValue({ isConfirmed: false })

    render(<Header />)

    const logoutButton = screen.getByRole('button', { name: /logout/i })
    fireEvent.click(logoutButton)

    await waitFor(() => {
      expect(localStorageMock.removeItem).not.toHaveBeenCalled()
      expect(mockRouter.push).not.toHaveBeenCalled()
    })
  })

  it('should handle missing user data gracefully', () => {
    localStorageMock.getItem.mockReturnValue(null)

    render(<Header />)

    // Should not crash and should render without user info
    expect(screen.queryByText('Test User')).not.toBeInTheDocument()
  })

  it('should handle corrupted localStorage data', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json')

    render(<Header />)

    // Should not crash
    expect(screen.queryByText('Test User')).not.toBeInTheDocument()
  })
})