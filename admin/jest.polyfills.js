// Add polyfills for Next.js server components and edge runtime

// Mock Request and Response for server components
if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(url, options = {}) {
      this.url = url
      this.method = options.method || 'GET'
      this.headers = new Headers(options.headers)
      this.body = options.body
    }
    
    async json() {
      return JSON.parse(this.body || '{}')
    }
  }
}

if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body
      this.status = init.status || 200
      this.statusText = init.statusText || 'OK'
      this.headers = new Headers(init.headers)
      this.ok = this.status >= 200 && this.status < 300
    }
    
    async json() {
      return JSON.parse(this.body || '{}')
    }
    
    async text() {
      return this.body || ''
    }
  }
}

if (typeof Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this.map = new Map()
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this.map.set(key.toLowerCase(), value)
        })
      }
    }
    
    get(name) {
      return this.map.get(name.toLowerCase())
    }
    
    set(name, value) {
      this.map.set(name.toLowerCase(), value)
    }
    
    has(name) {
      return this.map.has(name.toLowerCase())
    }
    
    delete(name) {
      this.map.delete(name.toLowerCase())
    }
    
    forEach(callback) {
      this.map.forEach(callback)
    }
  }
}

// Mock crypto for Node.js environment
if (typeof crypto === 'undefined') {
  global.crypto = {
    randomUUID: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    },
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    }
  }
}

// Mock TextEncoder/TextDecoder
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(input) {
      return new Uint8Array(Buffer.from(input, 'utf8'))
    }
  }
}

if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    decode(input) {
      return Buffer.from(input).toString('utf8')
    }
  }
}