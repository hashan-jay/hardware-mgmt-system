# Computer Hardware Management System

ASP.NET Core Web API + React + Tailwind CSS + Microsoft SQL Server system for office hardware tracking, barcodes, and inventory audits.

## Features

- Dynamic hardware components (Monitor, Keyboard, Mouse, Printer, etc.)
- Brands per component (Logitech, MSI, etc.)
- Unique item codes:
  - Existing: `MONI-MSI-67`
  - New acquisition: `NEW-MONI-MSI-1`
- Real-time barcode generation (CODE128)
- Inventory scanning with working / not-working checks and missing-item reports
- Roles:
  - **Network Admin**: create/update/scan (no deletes, no audit logs)
  - **Developer**: full access including deletes and audit logs
- Dashboard counters for components, brands, working and not-working items

## Default users

| Role | Username | Password |
|---|---|---|
| Developer | `developer` | `Dev@12345` |
| Network Admin | `netadmin` | `Admin@12345` |

## Prerequisites

- .NET 10 SDK
- Node.js 20+
- SQL Server LocalDB, Express, or full SQL Server

## Database connection

Edit `backend/HardwareManagement.Api/appsettings.json`:

```json
"DefaultConnection": "Server=.\\SQLEXPRESS;Database=HardwareManagementDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
```

For LocalDB, example:

```text
Server=(localdb)\\mssqllocaldb;Database=HardwareManagementDb;Trusted_Connection=True;TrustServerCertificate=True;
```

The API creates the database and seeds users on first run.

## Run backend

```bash
cd backend/HardwareManagement.Api
dotnet run --launch-profile http
```

API: `http://localhost:5012`  
Scalar API docs: `http://localhost:5012/scalar`  
OpenAPI JSON: `http://localhost:5012/openapi/v1.json`

### Testing with Scalar

1. Open `http://localhost:5012/scalar`
2. Call `POST /api/auth/login` with e.g. `{ "username": "netadmin", "password": "Admin@12345" }`
3. Copy the `token` from the response
4. Open **Authentication** in Scalar, choose **Bearer**, paste the token
5. Test protected endpoints

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

## Typical workflow

1. Sign in as Network Admin
2. Add a component (e.g. Monitor / `MONI`)
3. Open the component and add a brand (e.g. MSI / `MSI`)
4. Open the brand and use **Add Item** or **Add New Item**
5. Select an item to view/print its barcode
6. Open **Inventory Scanning**, start a scan, scan barcodes like `MINI-LENOVO-12`
7. Confirm hardware component and brand in the popup (item number is locked)
8. The item is saved under that component/brand and recorded in the audit scan
