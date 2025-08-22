import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  useParams() {
    return {}
  },
  usePathname() {
    return '/'
  },
}))

// Mock SweetAlert2
jest.mock('sweetalert2', () => ({
  fire: jest.fn(),
  close: jest.fn(),
  showLoading: jest.fn(),
  isLoading: jest.fn(() => false),
}))

// Mock fetch globally
global.fetch = jest.fn()

// Mock Image component from Next.js
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_db'
process.env.JWT_SECRET = 'test_secret_key_for_testing_only'

// Setup global test utilities
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks()
  
  // Reset fetch mock
  fetch.mockClear()
})

afterEach(() => {
  // Cleanup after each test
  jest.restoreAllMocks()
})