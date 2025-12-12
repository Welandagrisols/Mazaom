# AgroVet POS System

## Overview
AgroVet POS is a React Native/Expo Point of Sale application designed for agricultural and veterinary supply businesses. It provides inventory management, sales processing, and reporting capabilities.

## Tech Stack
- **Framework**: React Native with Expo (SDK 54)
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tabs + Native Stack)
- **State Management**: React Context API
- **Storage**: AsyncStorage for local data + Supabase for cloud persistence
- **Database**: Supabase (PostgreSQL)
- **Styling**: React Native StyleSheet with custom theme

## Project Structure
```
├── App.tsx                 # Main application entry point
├── components/             # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── CartItem.tsx
│   ├── ProductCard.tsx
│   └── ...
├── screens/                # Application screens
│   ├── POSScreen.tsx       # Main POS interface
│   ├── InventoryScreen.tsx # Inventory management
│   ├── ReportsScreen.tsx   # Sales and inventory reports
│   └── ...
├── navigation/             # Navigation configuration
│   ├── MainTabNavigator.tsx
│   └── ...
├── context/                # React Context providers
│   ├── AppContext.tsx
│   └── AuthContext.tsx     # Authentication and user management
├── hooks/                  # Custom React hooks
├── constants/              # Theme and category constants
├── utils/                  # Utility functions
└── types/                  # TypeScript type definitions
```

## Features
- **Hybrid Authentication System**: Designed for shared tablet environments
  - **Admin Login**: Email/password for shop owners and administrators (secure, remote-capable)
  - **Staff Login**: Shop code + 4-digit PIN for daily staff access (fast, tablet-friendly)
  - **License Key Registration**: New shops require a valid license key to register
  - **Inactivity Lock**: Screen locks after 5 minutes of inactivity, requiring PIN to unlock
  - Role-based access control (admin, manager, cashier)
  - User management for admins to create staff members with PINs
  - Demo mode fallback when Supabase is not configured
- **Shop Branding**: Dynamic shop name display (currently: Mazao Animal Supplies)
- **POS Interface**: Quick product search, barcode scanning, cart management
- **Dual Inventory Item Types**:
  - **Unit/Countable**: Items sold as whole units only (boxes, bottles, sachets)
  - **Bulk/Divisible**: Items sold by weight/volume (dairy meal by kg, oil by liters)
- **Inventory Management**: Product listing, stock tracking, add/edit products with item type selection
- **Customer Management**: Customer database with contact information
- **Supplier Management**: Supplier records for procurement
- **Reporting**: Sales reports, inventory reports with analytics
- **Receipt Management**: Upload receipts via camera capture, gallery, or batch PDF upload with AI-powered OCR
- **Receipt Processing Modes**:
  - **Historical Data Only**: Records purchase prices and supplier information without adding to current stock
  - **Add to Current Stock**: Records prices and adds quantities to inventory batches
- **Price History Tracking**: Maintains historical purchase price records per product for cost analysis
- **Categories**: Feeds, Fertilizers, Pesticides, Herbicides, Veterinary, Seeds, Poultry, Livestock

## Development

### Running the Application
```bash
npm run dev
```
This starts the Expo development server on port 5000 with web support.

### Available Scripts
- `npm run dev` - Start development server (web mode on port 5000)
- `npm run web` - Start Expo web development server
- `npm run android` - Start Android development
- `npm run ios` - Start iOS development
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Configuration
- **Port**: 5000 (configured for Replit environment)
- **Host**: Configured to accept connections from Replit proxy

## Supabase Database Setup
To enable cloud data persistence, run the SQL script in your Supabase SQL Editor:
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and run the contents of `scripts/supabase-schema.sql`
4. This creates tables for products, customers, suppliers, transactions, inventory batches, and receipts

The app automatically syncs data to Supabase when configured. If Supabase is not available, it falls back to local storage.

## Recent Changes
- December 2024: Added shop personalization - login screen remembers last shop name with "Switch Shop" option
- December 2024: Redesigned authentication with dual login modes (admin email/password, staff shop code + PIN)
- December 2024: Added 5-minute inactivity screen lock with PIN re-entry
- December 2024: Added license key requirement for new shop registration (APK distribution control)
- December 2024: Updated User Management to support creating staff with PINs
- December 2024: Combined Add Product and Add Stock screens into unified AddOrRestockScreen for streamlined workflow
- December 2024: Added receipt processing modes (Historical Data Only vs Add to Current Stock) with price history tracking
- December 2024: Added dual inventory item types (Unit/Countable vs Bulk/Divisible) with proper tracking
- December 2024: Added Supabase database integration for cloud persistence
- December 2024: Added receipt management with camera capture, gallery selection, batch PDF upload, and OpenAI Vision OCR
- December 2024: Initial import and Replit environment configuration

## User Preferences
- None specified yet
