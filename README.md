# SEVA (सेवा) - Home Services Platform

> **SEVA** means "service" in Sanskrit - A comprehensive home services marketplace connecting customers with verified service providers.

## 🌟 Overview

SEVA is a full-stack home services platform that enables customers to discover, book, and pay for various home services while providing service providers with a comprehensive dashboard to manage their business. The platform features real-time booking, location-based service discovery, secure payments, and a robust admin panel.

## ✨ Features

### For Customers
- 🔍 **Smart Service Discovery** - Location-based search with radius filtering
- 📱 **Real-time Booking** - Seamless booking experience with instant confirmations
- 💳 **Secure Payments** - Stripe integration for safe and secure transactions
- 📊 **Booking Management** - Track booking history and status
- ⭐ **Reviews & Ratings** - Rate and review service providers
- 🔐 **Profile Management** - Complete profile and preferences management

### For Service Providers
- 🏢 **Provider Dashboard** - Comprehensive business management interface
- 📝 **Service Management** - Add, edit, and manage service offerings
- 📅 **Booking Management** - Accept, decline, and manage bookings
- 💰 **Earnings Tracking** - Monitor income and transaction history
- 📍 **Service Areas** - Define and manage service coverage areas
- ✅ **Verification System** - Provider verification and trust badges

### For Administrators
- 🎛️ **Admin Dashboard** - Complete platform oversight
- 👥 **User Management** - Manage customers, providers, and roles
- 🛍️ **Service Categories** - Create and manage service categories
- 📊 **Analytics** - Platform performance and usage analytics
- 🔧 **System Configuration** - Platform settings and configurations

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and context
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality, accessible UI components
- **React Router DOM** - Client-side routing
- **React Query** - Server state management
- **React Hook Form** - Form handling with validation

### Backend & Database
- **Supabase** - Backend-as-a-Service platform
- **PostgreSQL** - Relational database
- **Row Level Security (RLS)** - Database-level security
- **Real-time subscriptions** - Live updates
- **Authentication** - Email/OTP authentication

### Payment & Integration
- **Stripe** - Payment processing
- **Geolocation APIs** - Location services
- **Email Services** - Transactional emails

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Vitest** - Unit testing framework
- **Testing Library** - Component testing utilities

## 🏗️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   ├── AdminDashboard.tsx
│   ├── ProviderDashboard.tsx
│   ├── BookingPage.tsx
│   └── ...
├── contexts/            # React contexts
│   ├── AuthContext.tsx  # Authentication state
│   └── CartContext.tsx  # Shopping cart state
├── hooks/               # Custom React hooks
│   ├── useServices.ts
│   ├── useAuth.ts
│   └── ...
├── lib/                 # Utility functions
│   ├── auth.ts
│   ├── locationUtils.ts
│   └── utils.ts
├── pages/               # Page components
├── types/               # TypeScript type definitions
│   └── database.types.ts
├── integrations/        # External integrations
│   └── supabase/
└── App.tsx             # Main application component
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd seva
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_APP_URL=http://localhost:8080
   ```

4. **Database Setup**
   - Set up your Supabase project
   - Run the database migrations (see `NEW_DATABASE_SETUP_INSTRUCTIONS.md`)
   - Configure authentication settings (see `SUPABASE_AUTH_CONFIG.md`)

5. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:8080`

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build for development
npm run preview      # Preview production build

# Testing
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once

# Code Quality
npm run lint         # Run ESLint
```

## 🔐 Authentication & Security

- **Multi-role authentication** (Customer, Provider, Admin)
- **OTP-based verification** for secure login
- **Row Level Security (RLS)** for database access control
- **Protected routes** based on user roles
- **Session management** with automatic refresh

## 🗄️ Database Schema

The application uses a comprehensive database schema including:

- **Users & Profiles** - User authentication and profile management
- **Service Categories** - Hierarchical service categorization
- **Services** - Service listings with pricing and availability
- **Bookings** - Booking management with status tracking
- **Reviews** - Customer feedback and rating system
- **Transactions** - Payment and financial records

## 🎨 UI/UX Features

- **Responsive Design** - Works on all device sizes
- **Dark/Light Mode** - Theme switching capability
- **Progressive Web App** - PWA features for mobile
- **Accessibility** - WCAG compliant components
- **Modern Animations** - Smooth transitions and micro-interactions
- **Loading States** - Comprehensive loading and error states

## 📱 Mobile Support

- Fully responsive design
- Touch-friendly interactions
- Mobile-optimized navigation
- PWA capabilities for app-like experience

## 🔧 Configuration

The project includes several configuration files:
- `vite.config.ts` - Vite configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `components.json` - shadcn/ui configuration
- `tsconfig.json` - TypeScript configuration

## 📋 Development Guidelines

See additional documentation:
- `ADMIN_SETUP_GUIDE.md` - Admin setup instructions
- `SUPABASE_AUTH_CONFIG.md` - Authentication configuration
- `NEW_DATABASE_SETUP_INSTRUCTIONS.md` - Database setup guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check existing issues
2. Review documentation files
3. Create a new issue with detailed information
---

**Built with ❤️ for connecting communities through quality home services**
