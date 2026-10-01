# Cloud Kirana Setup

## Requirements

- Git
- Node.js 20 LTS or newer
- npm (included with Node.js)

## Clone and install

```powershell
git clone https://github.com/deepakmathurtech/CloudKirana.git
Set-Location CloudKirana
npm ci
```

## Configure Firebase

Copy the example environment file to a local-only file:

```powershell
Copy-Item .env.example .env.local
```

Update the `VITE_FIREBASE_*` values in `.env.local` to match your Firebase web app. The values in `.env.example` identify the current demo Firebase project; use your own project if you do not have access to it.

In Firebase Console:

1. Enable Anonymous and Google under Authentication > Sign-in method.
2. Add `localhost` and your deployed hostname under Authentication > Settings > Authorized domains.
3. Create a Firestore database and deploy the rules in `firestore.rules`.
4. Seed `products` and `stores` collections. Use the numeric catalog IDs as document IDs.

Firebase web configuration is included in the client and is not a server credential. Protect data with Firebase Authentication and Firestore rules; never put service-account credentials in `VITE_*` variables.

## Run locally

```powershell
npm run dev
```

Open <http://localhost:5173>. Vite serves the React app and proxies `/api` requests to the Express server on port 4000. The production bundle can be checked with:

```powershell
npm run build
```

The local Express fallback reads `server/data.json`. That file is intentionally gitignored and is not included in this public repository. Obtain a development seed file from the project maintainer and place it at `server/data.json`; do not commit it. Without Firebase catalog data or this local seed file, data-backed screens and API requests will not load.

## Production warning

Do not use the current JSON-file Express API for real customer or business data. It has no API authentication or business-role authorization, and JSON files are not durable storage in serverless deployments. Before launch, use an authenticated backend with durable transactional storage and enforce user, organization, and role permissions on every request. Payment processing is not configured in this project.
