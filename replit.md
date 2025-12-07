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
│   └── AppContext.tsx
├── hooks/                  # Custom React hooks
├── constants/              # Theme and category constants
├── utils/                  # Utility functions
└── types/                  # TypeScript type definitions
```

## Features
- **POS Interface**: Quick product search, barcode scanning, cart management
- **Inventory Management**: Product listing, stock tracking, add/edit products
- **Customer Management**: Customer database with contact information
- **Supplier Management**: Supplier records for procurement
- **Reporting**: Sales reports, inventory reports with analytics
- **Receipt Management**: Upload receipts via camera capture, gallery, or batch PDF upload
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
- December 2024: Added Supabase database integration for cloud persistence
- December 2024: Added receipt management with camera capture, gallery selection, and batch PDF upload
- December 2024: Initial import and Replit environment configuration

## User Preferences
- None specified yet
