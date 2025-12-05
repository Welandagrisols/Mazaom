# AgroVet POS System

## Overview

A cross-platform Point of Sale (POS) system built with React Native and Expo for managing agrovet businesses. The application handles sales transactions, inventory management, customer relationships, and reporting for agricultural veterinary supplies including feeds, fertilizers, pesticides, veterinary medicines, and livestock products. The system supports mobile, tablet, and desktop platforms with a responsive design.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Platform**
- React Native with Expo SDK 54 for cross-platform development (iOS, Android, Web)
- React 19.1.0 with experimental React Compiler enabled
- TypeScript for type safety across the codebase
- New React Native architecture enabled for improved performance

**Navigation Structure**
- React Navigation v7 with bottom tabs for primary navigation
- Native stack navigators for nested screen hierarchies
- Four main tabs: POS (Home), Inventory, Reports, and More
- Modal presentations for checkout, product details, and data entry screens
- Deep linking support via `agrovetpos://` scheme

**State Management**
- Context API (`AppContext`) for global application state
- Local component state using React hooks
- Async operations managed with async/await patterns
- No external state management library (Redux, MobX) - keeping it simple with Context

**UI/UX Design Patterns**
- Theme system with light/dark mode support using custom `useTheme` hook
- Consistent design tokens defined in `constants/theme.ts` (colors, spacing, typography, border radius)
- Safe area handling across all platforms using `react-native-safe-area-context`
- Keyboard-aware scroll views for form inputs
- Animated interactions using Reanimated v4 for smooth 60fps animations
- Glass morphism effects on iOS (blur effects on tab bar and headers)
- Gesture handling with React Native Gesture Handler v2.28

**Component Architecture**
- Themed components (`ThemedText`, `ThemedView`) that adapt to light/dark mode
- Reusable UI components (Button, Card, SearchBar, EmptyState, etc.)
- Screen wrapper components for consistent padding and insets
- Separation of business logic from presentation components
- Error boundary implementation for graceful error handling

### Backend Architecture

**Database Layer**
- PostgreSQL database for production data storage
- Drizzle ORM v0.45.0 for type-safe database queries and migrations
- Database schema defined in `server/schema.ts` with tables for:
  - Products (with SKU, barcode, multi-unit pricing)
  - Inventory batches (with expiry tracking and batch numbers)
  - Customers (with loyalty points and credit management)
  - Suppliers (with contact details and payment terms)
  - Transactions and transaction items
  - Users (for authentication and role-based access)

**Data Storage Strategy**
- Hybrid approach: PostgreSQL for persistent data, AsyncStorage for session/cache
- Database connection pooling via `pg` library
- Storage abstraction layer (`utils/storage.ts`) that delegates to database operations
- Migration strategy using Drizzle Kit for schema changes

**Business Logic**
- Centralized in `AppContext` provider
- Core operations: cart management, sales completion, inventory tracking, product CRUD
- Stock calculation across multiple batches with FIFO logic
- Transaction number generation with date-based prefixes
- Low stock alerts based on reorder levels

### Data Models

**Core Entities**
- Product: Multi-unit tracking (kg, liters, bags), retail/wholesale/cost pricing, categories
- InventoryBatch: Batch numbers, expiry dates, supplier tracking, per-unit costs
- Customer: Types (retail/wholesale/VIP), credit limits, loyalty points
- Supplier: Contact management, payment terms
- Transaction: Items, payment methods (Cash, M-Pesa, Airtel, Bank, Credit), discounts
- User: Role-based access (admin, cashier, manager) - authentication ready

**Category System**
- Predefined categories: Feeds, Fertilizers, Pesticides, Herbicides, Veterinary, Seeds, Poultry, Livestock
- Unit types: kg, liters, bags, packets, pieces, bottles, boxes
- Payment methods: Cash, M-Pesa, Airtel Money, Bank Transfer, Credit

### External Dependencies

**Authentication & Backend Services**
- PostgreSQL database with Drizzle ORM (migrated from Supabase)
- Direct database connections using `pg` library with connection pooling
- Email/password authentication with role-based access control
- Session management via AsyncStorage for user sessions

**UI & Platform Libraries**
- Expo modules ecosystem (Camera, Image, Font, Haptics, Symbols, Web Browser, etc.)
- Vector icons via `@expo/vector-icons` (Feather icon set)
- Safe area and keyboard handling for cross-platform compatibility
- Native blur effects on iOS using `expo-blur`

**AI/OCR Capabilities (Planned)**
- Hybrid OCR approach for receipt scanning:
  - Primary: Tesseract OCR (free, offline)
  - Fallback: Google Cloud Vision API (when confidence <75%)
- Receipt parsing for automatic inventory updates from supplier invoices
- Intelligent product matching with fuzzy search algorithms
- Image preprocessing before OCR (not yet implemented)

**Development Tools**
- Babel module resolver for clean import paths (`@/` alias)
- ESLint with Expo and Prettier configurations
- Drizzle Kit for database migrations and schema management
- Environment variables via `dotenv` for configuration

**Third-Party Integrations**
- PostgreSQL database (requires `DATABASE_URL` environment variable)
- Mobile payment APIs (M-Pesa, Airtel Money) - architecture ready, integration pending
- Barcode/QR code scanning via Expo Camera (not yet implemented)
- Document picker for PDF receipts (mentioned in requirements, not implemented)

**Build & Deployment**
- Custom build script for Replit deployment (`scripts/build.js`)
- Web-specific configurations for static hosting
- Metro bundler configuration for React Native
- Edge-to-edge support on Android, adaptive icons