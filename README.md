# True Astrotalk 🔮

**Complete Astrology Consultation Platform**  
*Flutter Mobile App + Next.js Admin Panel*

[![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)

## 📱 Overview

True Astrotalk is a comprehensive astrology consultation platform that connects customers with verified astrologers for personalized consultations. Built with modern technologies and following industry best practices.

### 🌟 Key Features

- **🔐 Multi-Role Authentication** - Customer, Astrologer, Admin workflows
- **💬 Real-time Consultations** - Chat, Voice & Video calling
- **💰 Wallet System** - Secure payments with commission-based earnings
- **👥 Astrologer Verification** - Multi-step verification process
- **📊 Admin Dashboard** - Complete platform management
- **🎨 Professional UI** - Material Design 3 with custom theming
- **🔄 Real-time Updates** - Socket.IO integration

## 🚀 Quick Start

### Prerequisites

```bash
# Required software
- Node.js 18+
- Flutter 3.10+
- MongoDB 4.4+
- Git
```

### 1. Clone Repository

```bash
git clone https://github.com/akashsahay1/trueastrotalk.git
cd trueastrotalk
```

### 2. Database Setup

```bash
# Start MongoDB service
mongod

# Import sample data (coming soon)
# Sample database exports will be provided for quick setup
```

### 3. Admin Panel Setup

```bash
cd admin
npm install
cp .env.example .env.local

# Configure environment variables in .env.local
MONGODB_URI=mongodb://localhost:27017/trueastrotalkDB

# Start development server
npm run dev
```

### 4. Flutter Mobile App Setup

```bash
cd mobile
flutter pub get
flutter run
```

## 📁 Project Structure

```
trueastrotalk/
├── 📱 mobile/           # Flutter mobile application
├── 🌐 admin/            # Next.js admin panel
├── 📚 docs/             # Documentation
├── 🎨 influence/        # Admin template assets
└── README.md            # This file
```

## 🛠️ Technology Stack

- **Mobile**: Flutter + Dart
- **Admin Panel**: Next.js + TypeScript
- **Database**: MongoDB
- **Real-time**: Socket.IO
- **Authentication**: JWT + Google OAuth
- **Payments**: RazorPay integration ready

## 📊 Features

### Customer App
- Browse verified astrologers
- Multiple consultation types (chat, voice, video)
- Wallet management and secure payments
- Kundli generation and astrology reports

### Astrologer App
- Professional profile setup
- Earnings dashboard and analytics
- Real-time consultation management
- Monthly automated payouts

### Admin Panel
- User and astrologer management
- Verification workflow
- Financial oversight and reporting
- Platform configuration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit pull request

## 📝 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please create an issue in the GitHub repository.

---

**Built with ❤️ using Flutter, Next.js, and MongoDB**

*For detailed technical documentation, see [docs/devdoc.md](docs/devdoc.md)*