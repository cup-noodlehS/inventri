# Inventri

A mobile inventory management system built for perfume shops, powered by Expo (React Native) and Supabase.

## About

Inventri helps perfume shop owners track their inventory through deliveries and sales. It provides a real-time dashboard, product catalog management, transaction recording, and inventory reporting — all from a mobile device.

## Features

- **Dashboard** — Overview of stock levels, low-stock alerts, and inventory value
- **Product Management** — Add, edit, and delete perfume products with SKU, volume, and pricing
- **Transactions** — Record deliveries (stock in) and sales (stock out) with line items
- **Barcode Scanning** — Scan product barcodes for quick lookup
- **Barcode Generation** — Generate barcodes for products
- **Export** — Generate inventory ledger reports for any date range
- **Authentication** — Supabase Auth with row-level security

## Tech Stack

- **Expo** ~54 / **React Native** 0.81
- **TypeScript** ~5.9
- **Expo Router** — File-based routing
- **Supabase** — Auth, Postgres database, Row-Level Security, Realtime
- **NativeWind** / **Tailwind CSS** — Styling
- **date-fns** — Date utilities
- **xlsx** — Spreadsheet export

## Prerequisites

- Node.js (LTS recommended)
- npm or yarn
- Expo CLI (`npx expo`)
- A [Supabase](https://supabase.com) project

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd inventri
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_APP_URL=your-app-url
```

### 4. Set up the database

Run the migration files in your Supabase SQL editor (in order):

1. `supabase/migrations/20250109000000_simplified_schema.sql`
2. `supabase/migrations/20250110000000_add_user_insert_policy.sql`
3. `supabase/migrations/20250110000001_allow_product_deletion.sql`

Then optionally run `supabase/seed.sql` for sample data.

### 5. Run the app

```bash
npm start          # Start Expo dev server
npm run android    # Android
npm run ios        # iOS
npm run web        # Web
```

## Project Structure

```
app/
  (tabs)/          # Tab screens (dashboard, products, transactions, export, settings)
  auth/            # Authentication screens
  _layout.tsx      # Root layout
  modal.tsx        # Modal screen
components/        # Reusable UI components (product card, barcode scanner/generator, tabs)
lib/
  api/             # Supabase API functions
  supabase.ts      # Supabase client setup
  types.ts         # TypeScript type definitions
  utils/           # Utility functions
context/
  AuthContext.tsx   # Authentication context provider
supabase/
  migrations/      # SQL migration files
  seed.sql         # Seed data
```

## Database Schema

| Table | Description |
|---|---|
| `user` | User accounts linked to Supabase Auth |
| `product` | Perfume catalog (SKU, name, volume_ml, price, min_stock_threshold) |
| `inventory_transaction` | Transaction headers — type is `Delivery` or `Sale` |
| `transaction_item` | Line items per transaction (positive qty for deliveries, negative for sales) |
| `current_stock` (view) | Real-time stock levels computed from completed transactions |

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start Expo dev server |
| `npm run android` | Start on Android |
| `npm run ios` | Start on iOS |
| `npm run web` | Start on web |
| `npm run lint` | Run ESLint |
| `npm run reset-project` | Reset to blank app directory |
