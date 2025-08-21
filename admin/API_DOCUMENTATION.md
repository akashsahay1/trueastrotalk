# TrueAstroTalk API Documentation

## Overview
Complete REST API backend for the TrueAstroTalk application built with Next.js 14 App Router and MongoDB.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require authentication. Include user credentials in request headers or query parameters as specified.

---

## 📦 Products API

### Get All Products
```http
GET /api/products
```

**Query Parameters:**
- `category` (string): Filter by product category
- `search` (string): Search in name, description, tags
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `inStock` (boolean): Filter by stock availability
- `sortBy` (string): Sort field (default: created_at)
- `sortOrder` (string): asc/desc (default: desc)
- `limit` (number): Items per page (default: 20)
- `page` (number): Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "products": [...],
  "categories": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Create Product
```http
POST /api/products
```

**Body:**
```json
{
  "name": "Crystal Healing Set",
  "description": "Premium crystal healing set",
  "price": 2999,
  "original_price": 3999,
  "category": "Crystals",
  "subcategory": "Healing",
  "brand": "SpiritualTools",
  "images": ["url1", "url2"],
  "stock_quantity": 50,
  "sku": "CRYS-001",
  "weight": 1.5,
  "tags": ["healing", "crystals"],
  "is_featured": false,
  "is_bestseller": false
}
```

### Get Single Product
```http
GET /api/products/{id}
```

### Update Product
```http
PUT /api/products/{id}
```

### Delete Product
```http
DELETE /api/products/{id}
```

---

## 🛒 Cart API

### Get User Cart
```http
GET /api/cart?userId={userId}
```

### Add to Cart
```http
POST /api/cart
```

**Body:**
```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "product_id": "507f1f77bcf86cd799439012",
  "quantity": 2
}
```

### Update Cart Item
```http
PUT /api/cart
```

**Body:**
```json
{
  "cart_item_id": "507f1f77bcf86cd799439013",
  "user_id": "507f1f77bcf86cd799439011",
  "quantity": 3
}
```

### Remove from Cart
```http
DELETE /api/cart?cartItemId={id}&userId={userId}
```

---

## 📋 Orders API

### Get User Orders
```http
GET /api/orders?userId={userId}&userType=user
```

### Create Order
```http
POST /api/orders
```

**Body:**
```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "items": [
    {
      "product_id": "507f1f77bcf86cd799439012",
      "quantity": 2,
      "price": 2999
    }
  ],
  "shipping_address": {
    "full_name": "John Doe",
    "phone_number": "9876543210",
    "address_line_1": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400001"
  },
  "payment_method": "online",
  "payment_details": {
    "transaction_id": "TXN123456"
  }
}
```

### Get Order Details
```http
GET /api/orders/{id}?userId={userId}
```

### Update Order Status
```http
PUT /api/orders/{id}
```

**Body:**
```json
{
  "status": "shipped",
  "tracking_number": "TRK123456",
  "admin_id": "507f1f77bcf86cd799439014"
}
```

---

## 🏠 Addresses API

### Get User Addresses
```http
GET /api/addresses?userId={userId}
```

### Create Address
```http
POST /api/addresses
```

**Body:**
```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "label": "Home",
  "full_name": "John Doe",
  "phone_number": "9876543210",
  "address_line_1": "123 Main Street",
  "address_line_2": "Apt 4B",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postal_code": "400001",
  "country": "India",
  "address_type": "home",
  "is_default": true
}
```

### Update Address
```http
PUT /api/addresses
```

### Delete Address
```http
DELETE /api/addresses?addressId={id}&userId={userId}
```

---

## 💬 Chat API

### Get Chat Sessions
```http
GET /api/chat?userId={userId}&userType=user
```

### Create Chat Session
```http
POST /api/chat
```

**Body:**
```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "astrologer_id": "507f1f77bcf86cd799439012"
}
```

### Get Chat Session Details
```http
GET /api/chat/{sessionId}?userId={userId}&userType=user
```

### Update Session Status
```http
PUT /api/chat/{sessionId}
```

**Body:**
```json
{
  "action": "accept",
  "user_id": "507f1f77bcf86cd799439012",
  "user_type": "astrologer"
}
```

---

## 💬 Chat Messages API

### Send Message
```http
POST /api/chat/messages
```

**Body:**
```json
{
  "session_id": "507f1f77bcf86cd799439013",
  "sender_id": "507f1f77bcf86cd799439011",
  "sender_name": "John Doe",
  "sender_type": "user",
  "message_type": "text",
  "content": "Hello, I need guidance about my career",
  "image_url": null
}
```

### Get Messages
```http
GET /api/chat/messages?sessionId={id}&userId={userId}&userType=user
```

### Mark Messages as Read
```http
PUT /api/chat/messages
```

**Body:**
```json
{
  "message_ids": ["507f1f77bcf86cd799439014"],
  "user_id": "507f1f77bcf86cd799439011",
  "user_type": "user"
}
```

---

## 📞 Calls API

### Get Call Sessions
```http
GET /api/calls?userId={userId}&userType=user
```

### Create Call Session
```http
POST /api/calls
```

**Body:**
```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "astrologer_id": "507f1f77bcf86cd799439012",
  "call_type": "voice"
}
```

### Get Call Session Details
```http
GET /api/calls/{sessionId}?userId={userId}&userType=user
```

### Update Call Status
```http
PUT /api/calls/{sessionId}
```

**Body:**
```json
{
  "action": "answer",
  "user_id": "507f1f77bcf86cd799439012",
  "user_type": "astrologer",
  "connection_id": "webrtc_connection_id"
}
```

**Actions:** `ring`, `answer`, `reject`, `end`, `rate`, `missed`

---

## 🔔 Push Notifications API

### Send Push Notification
```http
POST /api/notifications/push
```

**Body:**
```json
{
  "type": "chat_message",
  "recipient_id": "507f1f77bcf86cd799439011",
  "recipient_type": "user",
  "title": "New Message",
  "message": "You have a new message from your astrologer",
  "data": {
    "session_id": "507f1f77bcf86cd799439013"
  },
  "sound": "default"
}
```

### Get User Notifications
```http
GET /api/notifications/push?recipientId={id}&recipientType=user
```

### Mark Notifications as Read
```http
PUT /api/notifications/push
```

**Body:**
```json
{
  "notification_ids": ["507f1f77bcf86cd799439014"],
  "recipient_id": "507f1f77bcf86cd799439011",
  "mark_all": false
}
```

---

## 📧 Email Notifications API

### Send Email
```http
POST /api/notifications/email
```

**Body:**
```json
{
  "type": "order_confirmation",
  "recipient_email": "user@example.com",
  "recipient_name": "John Doe",
  "data": {
    "order_number": "ORD-12345",
    "order_date": "2024-01-01",
    "items": [...],
    "total_amount": 3359
  }
}
```

**Email Types:** `order_confirmation`, `order_status_update`

### Get Email Logs
```http
GET /api/notifications/email?type={type}&status={status}
```

---

## 🔌 Socket.IO API

### Get Socket Status
```http
GET /api/socket
```

### Socket Actions
```http
POST /api/socket
```

**Body:**
```json
{
  "action": "get_online_astrologers",
  "data": {}
}
```

**Actions:**
- `broadcast_notification`
- `get_online_astrologers` 
- `update_user_status`
- `get_active_calls`
- `trigger_call_notification`

---

## 🔌 Socket.IO Events

### Authentication
```javascript
socket.emit('authenticate', {
  userId: 'user_id',
  userType: 'user', // or 'astrologer'
  token: 'auth_token'
});
```

### Chat Events
```javascript
// Send message
socket.emit('send_message', {
  sessionId: 'session_id',
  senderId: 'sender_id',
  senderName: 'Sender Name',
  senderType: 'user',
  messageType: 'text',
  content: 'Hello!'
});

// Listen for new messages
socket.on('new_message', (message) => {
  console.log('New message:', message);
});
```

### Call Events
```javascript
// Initiate call
socket.emit('initiate_call', {
  sessionId: 'call_session_id',
  callerId: 'caller_id',
  callerType: 'user',
  callType: 'voice'
});

// Listen for incoming calls
socket.on('incoming_call', (data) => {
  console.log('Incoming call:', data);
});

// Answer call
socket.emit('answer_call', {
  sessionId: 'call_session_id',
  userId: 'user_id'
});

// Reject call
socket.emit('reject_call', {
  sessionId: 'call_session_id',
  userId: 'user_id'
});

// End call
socket.emit('end_call', {
  sessionId: 'call_session_id',
  userId: 'user_id'
});
```

### WebRTC Signaling
```javascript
// Send offer
socket.emit('webrtc_offer', {
  sessionId: 'call_session_id',
  offer: rtcOffer,
  targetUserId: 'target_user_id'
});

// Send answer
socket.emit('webrtc_answer', {
  sessionId: 'call_session_id',
  answer: rtcAnswer,
  targetUserId: 'target_user_id'
});

// Send ICE candidate
socket.emit('webrtc_ice_candidate', {
  sessionId: 'call_session_id',
  candidate: iceCandidate,
  targetUserId: 'target_user_id'
});
```

---

## 📊 Database Schema

### Collections
- `products` - Product catalog
- `users` - User accounts
- `astrologers` - Astrologer profiles
- `cart_items` - Shopping cart items
- `orders` - Order records
- `order_items` - Order line items
- `user_addresses` - User addresses
- `chat_sessions` - Chat sessions
- `chat_messages` - Chat messages
- `call_sessions` - Call sessions
- `notifications` - Push notifications
- `email_logs` - Email notification logs

---

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   ```env
   MONGODB_URL=mongodb://localhost:27017
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   FCM_SERVER_KEY=your-fcm-server-key
   SOCKET_URL=ws://localhost:3001
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Test API Endpoints**
   ```bash
   node test-api.js
   ```

---

## 📝 Notes

- All endpoints return JSON responses
- Error responses include `success: false` and error details
- Pagination is available on list endpoints
- Real-time features require Socket.IO connection
- MongoDB ObjectIds are used for all entity references
- Soft deletes are implemented for products and other entities
- Input validation and sanitization is implemented
- Proper error handling and logging throughout

---

## 🔒 Security Features

- Input validation and sanitization
- MongoDB injection prevention
- Rate limiting (can be added)
- Authentication middleware (can be enhanced)
- CORS configuration
- Environment variable protection
- Error message sanitization