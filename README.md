# Cloud Kirana

React + Express conversion of the Cloud Kirana verified local commerce prototype.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite client proxies `/api` to the Express API on port 4000.

## API

- `GET /api/health`
- `GET /api/catalog`
- `GET /api/orders`
- `GET /api/orders/store/:storeId`
- `POST /api/orders`
- `PATCH /api/orders/:code/status`
- `GET /api/delivery-partners?storeId=:storeId`
- `POST /api/delivery-partners`
- `GET /api/orders/delivery/:partnerId`
- `PATCH /api/orders/:code/assign-delivery`
- `GET /api/transfers?role=:role`
- `POST /api/transfers`
- `PATCH /api/transfers/:id/status`
- `GET /api/wholesale-stock`
- `GET /api/purchase-requests?role=:role`
- `POST /api/purchase-requests`
- `PATCH /api/purchase-requests/:id/status`
- `GET /api/relationships?role=:role`
- `POST /api/relationships`
- `PATCH /api/relationships/:id`
- `GET /api/accounting?role=:role`
- `POST /api/accounting/entries`
- `GET /api/analytics`
- `POST /api/products`
- `GET /api/batches`
- `POST /api/batches`
- `GET /api/batches/:batch`
- `POST /api/batches/:batch/events`

Orders persist to `server/data.json` during local development. Replace that adapter with Supabase/Postgres when deploying; the route contract is intentionally small and stable.

## Frontend structure

- `src/App.jsx` owns API loading, navigation, cart, wishlist, theme, and order state.
- `src/data.js` contains shared UI configuration such as categories, roles, and reviews.
- `src/components/customer.jsx` contains store discovery, store details, and product rows.
- `src/components/commerce.jsx` contains cart, checkout, confirmation, order history, and wishlist.
- `src/components/operations.jsx` contains retailer, wholesaler, manufacturer, verification, and delivery views.
- `src/components/supplyChain.jsx` contains product registration, batch registration, role handoffs, analytics, and trace timelines.
- `src/components/personalization.jsx` contains saved customer and operational-role workspace preferences.
- `src/components/layout.jsx` contains the shell, headers, navigation, and search field.
- `src/components/ui.jsx` contains reusable visual primitives.

## Firebase setup

The client uses Firebase in production. During local development only, it falls back to the Express API when the Firestore catalog is empty or Firebase Auth is unavailable. Enable **Anonymous** and **Google** providers in Firebase Console for guest sessions and Google login. Add `localhost` and your deployed hostname under Authentication > Settings > Authorized domains. Google login is available from the role selector; signing in refreshes the account-scoped Firestore order history.

The current Vercel API deployment is not production-ready: it uses `server/data.json`, has no API authentication or business-role authorization, and serverless files are not durable storage. Do not expose it to real customer or business data. Before launching operational workflows, replace it with an authenticated backend using durable transactional storage and enforce organization membership and role permissions on every request. The client intentionally does not fall back to this API in production.

Create `.env` from `.env.example`, then deploy the rules and hosting config with the Firebase CLI:

```powershell
npm install -g firebase-tools
firebase login
firebase use hirelens-43306
firebase deploy --only firestore:rules,storage,hosting
```

Seed Firestore with two collections using the records in `server/data.json`:

- `products`: one document per product, using the numeric product id as the document id.
- `stores`: one document per store, using the numeric store id as the document id.

The Firestore rules allow public catalog reads, restrict catalog writes to users with the `admin` custom claim, and restrict orders and user files to their authenticated owner.

Workspace personalization currently persists per role in browser storage: display name, location, daily operating focus, and chain handoff alerts. The component accepts the Firebase user identity and is ready to move these preferences into `/users/{uid}` when account-profile persistence is enabled.

## Supply-chain flow

`Manufacturer` registers a product and batch, `Wholesaler` receives and sends it to the `Distributor`, `Distributor` receives and sends it to the `Shopkeeper`, and the `Shopkeeper` receives and sends it to `Delivery`. The delivery partner records pickup and delivery against the batch. Customers can inspect the resulting origin, custody timeline, status, and verification checks from the traceable product data.
