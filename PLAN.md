## Global Requirement
- Every user-facing control (buttons, inputs, toggles, filters) must be fully wired to live data or meaningful app behavior by the end of each phase, so no placeholder interactions remain anywhere in the Home, Products, Transactions, Export, or Settings tabs.

## Phase 1 – UX & Theming Foundation
- **Color System Refresh:** Replace the hard-coded high-contrast colors in `app/(tabs)/*`, `components/tabs.tsx`, and the various card styles with a neutral-forward palette defined in `constants/theme.ts`, reserving bold tints for CTAs, alerts, and status badges only.
- **Design Tokens & Primitives:** Add spacing/radius/typography tokens plus lightweight primitives (card, badge, list row) so `ThemedText`, `ThemedView`, dashboard tiles, and list items can share consistent styling instead of repeating inline StyleSheet values.
- **Accessibility & Dark Mode:** Re-test light/dark combinations with the new palette, add focus/pressed states to touchables, and ensure typography scales meet WCAG contrast—especially on the Home stats grid, Transactions form buttons, and Settings inputs.
- **Navigation & Layout Polish:** Standardize safe-area padding, scroll behaviors, and skeleton loaders across `index.tsx`, `products.tsx`, `transactions.tsx`, `export.tsx`, and `settings.tsx`, making the app feel cohesive before layering new functionality.
- **Sample Data Cleanup:** Remove the unused mocks in `data/` and guarantee every surface sources live Supabase data so future work (exports, dashboards, logistics) can rely on a single source of truth.

## Phase 2 – Data Layer & Supabase Alignment
- **Schema Review:** Document the existing Supabase structures referenced in `lib/types.ts` (`product`, `category`, `current_stock`, `inventory_transaction`, `transaction_item`, `user`, `role`) along with column meanings, defaults, and RLS policies so the app and DB stay in lockstep.
- **Logistics & Sales Extensions:** Introduce tables for supplier purchase orders and outbound shipments (carrier, tracking, ETA, status, related `inventory_transaction_id`) to cover the “sales + logistics” scope; extend the `current_stock` view or add a new `inventory_kpis` view for aggregated metrics.
- **User Preferences Storage:** Create a `user_preferences` table keyed by `user_id` to persist defaults (transaction type, barcode format, low-stock threshold, notification toggles, theme choice) that Settings can read/write.
- **API Client Updates:** Expand `lib/api/*` with typed helpers for the new tables plus pagination/filter params, reuse centralized error handling, and expose optimistic mutation hooks to keep the UI responsive.
- **Realtime & Caching Layer:** Wrap Supabase channel subscriptions (inventory + shipments) in reusable hooks and adopt a cache layer (e.g., TanStack Query) for `getProducts`, `getTransactions`, shipment feeds, and preferences to minimize redundant fetches.
- **Data Validation:** Normalize SKUs/barcodes, ensure quantities stay positive at the UI layer while the API handles sign normalization, and keep `inventory_transaction.status` transitions (pending/completed/cancelled) aligned between Supabase and the UI.

## Phase 3 – Feature Delivery by Tab

### Home (Dashboard)
- Surface KPIs for inventory value, sales over selectable windows, low-stock counts, and logistics (inbound purchase orders, outbound shipments) by aggregating `current_stock`, `inventory_transaction`, and the new shipment tables.
- Replace static quick-action buttons with deep links into the Transactions tab prefilled for Stock In/Out/Adjustment and add a “recent shipments” timeline card that shows carrier, ETA, and status pills.
- Keep the existing realtime listener but extend it to listen for shipment status changes, add pull-to-refresh/background refresh, and use animated skeletons while data loads.

### Products
- Deliver full CRUD: add/edit/delete modals tied to `product` + `category`, barcode assignment via `BarcodeScanner`, supplier linkage, and optional multi-location stock fields if warehouse support is introduced.
- Implement advanced filters (category, stock status, supplier, logistical tags), virtualized lists for large catalogs, pagination, and server-side search via `searchProducts`.
- Display logistics metadata (preferred supplier, lead time, reorder quantity) per product and expose quick actions for low-stock reorder suggestions leveraging the upcoming supplier tables.

### Transactions
- Redesign the form into a multi-line builder supporting multiple SKUs, per-line notes, and attachments; keep Stock In/Out/Adjustment and add Sale/Transfer types to better represent sales + logistics flows.
- Add date/time pickers, reference + notes fields, validation feedback, success toasts, and ensure navigation guards prevent users from losing progress mid-edit.
- Integrate barcode scanning per line, allow selecting source/destination warehouses or shipment IDs, and expose transaction detail sheets with status updates plus audit trails.
- Expand history with pagination, filters (type, date range, SKU, shipment), and drill-in views that show linked shipments/purchase orders.

### Export
- Replace the mock `transactions` array with live Supabase data and wire the UI buttons to the helpers in `lib/utils/exportData.ts`, showing progress/error states for CSV/Excel/PDF flows.
- Offer export scopes (products, transactions, shipments, combined), add preset date-range filters (Last 7 days, Last 30 days, Last 60 days, Custom with a range picker), allow type filters, and surface inline confirmations once sharing completes.
- Ensure exported data includes the new logistics columns (carrier, tracking, warehouse) so external stakeholders get the full picture.

### Settings
- Remove the unnecessary business name/contact inputs; instead show authenticated user info (name, username, email, role, last login) pulled from Supabase.
- Provide controls for default barcode type, default transaction type, low-stock threshold, notification toggles (low stock, shipment delays), theme selection, and account security (password reset link, sign-out).
- Persist everything through the new `user_preferences` API, sync on login, and propagate preference changes to other tabs (e.g., dashboard thresholds, transaction defaults).

## Phase 4 – Quality, Testing, and Release
- **Testing Matrix:** Add unit tests for helpers (`lib/utils/exportData`, API validators), component tests for the tab screens, and happy-path E2E flows (auth → add product → record transaction → export) using Testing Library or Detox.
- **Performance & Resilience:** Profile large inventories/transaction histories, add pagination or infinite scroll where needed, debounce network calls, and support offline-friendly cues (cached lists, queued mutations) for spotty connectivity.
- **Observability:** Centralize logging/toast handling, surface Supabase errors consistently, and consider lightweight analytics to understand how often exports/transactions/logistics features are used.
- **Documentation & Handoff:** Update `README.md`/internal docs with environment setup, Supabase schema changes, logistics workflows, and the refreshed theming system so future contributors can ramp quickly.
