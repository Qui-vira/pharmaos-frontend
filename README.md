# PharmaOS AI — Frontend Dashboard

Next.js 14 dashboard for the PharmaOS AI platform.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Run development server
npm run dev

# Open http://localhost:3000
```

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Login & Registration (pharmacy or distributor) |
| `/dashboard` | Main dashboard — KPIs, recent orders, low stock, active consultations |
| `/inventory` | Product & inventory management with stock levels and margins |
| `/expiry` | Expiry alert tracking with severity tiers (expired/critical/warning) |
| `/sales` | Sales analytics — revenue chart, top products, recent transactions |
| `/orders` | Order management with status lifecycle and filtering |
| `/suppliers` | Supplier catalog with cross-supplier price comparison view |
| `/consultations` | WhatsApp consultation interface with message thread + pharmacist action panel |
| `/reminders` | Patient reminder scheduling and tracking |
| `/settings` | Organization, profile, team, and integration settings |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with custom PharmaOS theme
- **Typography**: Plus Jakarta Sans
- **Icons**: Lucide React
- **API Client**: Custom fetch-based client with JWT token management

## Architecture

```
src/
├── app/                  # Next.js App Router pages
│   ├── login/           # Public login/register
│   ├── dashboard/       # Main dashboard (protected)
│   ├── inventory/       # Product management
│   ├── expiry/          # Expiry alerts
│   ├── sales/           # Sales analytics
│   ├── orders/          # Order management
│   ├── suppliers/       # Supplier catalog
│   ├── consultations/   # Consultation system
│   ├── reminders/       # Patient reminders
│   └── settings/        # Settings
├── components/
│   ├── layout/          # Sidebar, Header
│   └── ui/              # StatCard, DataTable, StatusBadge, Modal, etc.
├── lib/
│   ├── api.ts           # API client with all endpoint functions
│   └── utils.ts         # Formatting, color helpers
└── types/
    └── index.ts         # TypeScript type definitions
```
