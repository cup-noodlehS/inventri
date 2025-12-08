# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an inventory management mobile application built with **React Native**, **Expo**, and **Supabase**. The app allows users to manage products, track inventory transactions (Stock In, Stock Out, Adjustments), and export data in various formats (CSV, Excel, PDF). It features authentication, real-time updates, and barcode scanning capabilities.

## Development Commands

### Start Development Server
```bash
npm start
# or
expo start
```

### Platform-Specific Commands
```bash
npm run android    # Start on Android emulator
npm run ios        # Start on iOS simulator
npm run web        # Start web version
```

### Linting
```bash
npm run lint
```

## Environment Configuration

The app requires Supabase credentials configured via environment variables:

- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

These should be set in your environment or `.env` file (not committed to git).

## Architecture

### Routing Structure (Expo Router)

The app uses file-based routing with Expo Router:

- `app/(tabs)/` - Main authenticated screens (tab navigation)
  - `index.tsx` - Dashboard (home screen with inventory stats)
  - `products.tsx` - Product listing and search
  - `transactions.tsx` - Transaction history
  - `export.tsx` - Data export functionality
  - `settings.tsx` - App settings
- `app/auth/` - Authentication screens (login, signup)
- `app/_layout.tsx` - Root layout with AuthProvider wrapper

### State Management

- **AuthContext** ([context/AuthContext.tsx](context/AuthContext.tsx)) - Global authentication state using React Context
  - Handles user sessions, sign in, sign up, and sign out
  - Automatically creates/updates user records in the database
  - Persists sessions using AsyncStorage

### Database Layer

The app interacts with Supabase PostgreSQL database through API functions in `lib/api/`:

- **products.ts** - Product CRUD operations, search functionality
  - Uses the `current_stock` view for read operations (joins product + inventory data)
  - Direct `product` table manipulation for writes
- **transactions.ts** - Inventory transaction management
  - Creates transactions with items in a single operation
  - Automatically normalizes quantities based on transaction type
  - Implements manual rollback on errors (no database transactions)
- **users.ts** - User record management
- **categories.ts** - Product category operations

Key views and tables:
- `current_stock` - View combining product and inventory data with computed fields
- `product` - Product master data (SKU is the primary key)
- `inventory_transaction` - Transaction header
- `transaction_item` - Transaction line items (links to products)

### Real-Time Updates

The dashboard ([app/(tabs)/index.tsx](app/(tabs)/index.tsx)) subscribes to Supabase real-time changes:
- Listens for INSERT events on `inventory_transaction` table
- Automatically refreshes product data when new transactions are created

### Data Export

Export functionality ([lib/utils/exportData.ts](lib/utils/exportData.ts)) supports:
- **CSV** - Uses custom CSV generation with proper escaping
- **Excel** - Uses `xlsx` library to generate spreadsheets
- **PDF** - Uses `expo-print` to generate PDFs from HTML templates

All exports use the native sharing API via `expo-sharing`.

### Key TypeScript Types

All types are defined in [lib/types.ts](lib/types.ts):
- `Product` - Product entity
- `CurrentStock` - Extended product with inventory data (from view)
- `Transaction` - Transaction header
- `TransactionItem` - Transaction line item
- `CreateTransactionInput` - Input for creating transactions

### UI Components

- Themed components ([components/themed-view.tsx](components/themed-view.tsx), [components/themed-text.tsx](components/themed-text.tsx)) - Support light/dark mode
- `BarcodeScanner` - Camera-based barcode scanning using `expo-barcode-scanner`
- Custom tab navigation components in `components/`

## Important Development Notes

### SKU Handling
- SKUs are always normalized to **UPPERCASE** and **trimmed** in all API functions
- SKU is the primary key for products (not an integer ID)

### Transaction Quantity Normalization
- "Stock In" transactions: quantities are made positive
- "Stock Out" transactions: quantities are made negative
- "Adjustment" transactions: quantities remain as provided
- This normalization happens in [lib/api/transactions.ts](lib/api/transactions.ts):createTransaction

### Input Sanitization
- All string inputs are trimmed before database operations
- Numeric inputs are validated for positive values where appropriate
- Search queries use parameterized PostgREST filters (not vulnerable to injection)

### Authentication Flow
- Uses Supabase Auth with email/password
- Custom user records are created in the `users` table
- Legacy user handling: backfills user records on first login if missing
- Default role is "Staff" (role_id: 3)

### File System Workaround
The export utilities use a workaround for `expo-file-system` v19 type definitions:
```typescript
const getDocumentDirectory = (): string => {
  const docDir = (FileSystem as any).documentDirectory;
  const cacheDir = (FileSystem as any).cacheDirectory;
  return docDir || cacheDir || '';
};
```

## Path Aliases

The project uses `@/` as an alias for the root directory:
```typescript
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
```

## Styling

- Uses **NativeWind** (Tailwind for React Native) configured in [tailwind.config.js](tailwind.config.js)
- Also uses React Native StyleSheet for component-specific styles
- Supports light/dark themes via `@react-navigation/native`
- Custom fonts: Poppins (Regular, SemiBold, Bold)

## Data Migration Notes

The `data/` directory contains legacy mock data that is no longer used in the application. The app now exclusively uses Supabase for all data operations.
