# GPS Dozor - Fleet Management App

## Environment Setup
- Always run `nvm use 22` before any node/npm commands
- Node.js 22, npm 10+

## Tech Stack
- **Framework**: React 19 + TypeScript
- **Build**: Vite 7
- **UI Library**: Ant Design 6 (primary component library)
- **Styling**: Tailwind CSS 4 (utility supplement alongside antd)
- **State/Data**: TanStack Query (server state), React state (local)
- **Routing**: React Router v7
- **Maps**: @vis.gl/react-google-maps
- **i18n**: react-intl (default locale: cs, supported: cs, en)
- **API**: GPS Dozor REST API (Basic Auth over HTTPS)

## Project Structure
```
src/
├── api/          # API client and request functions
├── components/   # Shared/reusable components
│   └── layout/   # App shell, sidebar, header
├── hooks/        # Custom React hooks
├── modules/      # Feature modules (one folder per app section)
│   ├── dashboard/  # Fleet overview + live map
│   ├── drivers/    # Driver scorecards & eco-driving
│   ├── fleet/      # Vehicle list, trips, position history
│   ├── fuel/       # Fuel consumption & cost analytics
│   └── health/     # Vehicle sensor monitoring & alerts
├── i18n/         # Localization (messages, locale context)
├── routes/       # Router configuration
├── types/        # TypeScript type definitions
└── utils/        # Utility functions
```

## Conventions
- Use `@/` path alias for imports from `src/` (e.g., `import { apiGet } from '@/api/client'`)
- Use Ant Design components for UI elements (tables, forms, modals, layout)
- Use Tailwind only for custom spacing, layout utilities, and gaps antd doesn't cover
- All API calls go through `src/api/client.ts` using `apiGet`, `apiPost`, `apiPut`
- Use TanStack Query hooks for all server data fetching
- Keep module pages in their respective `modules/<name>/` folder
- TypeScript strict mode is enabled — no `any` types
- All user-facing strings must use react-intl `<FormattedMessage>` or `useIntl().formatMessage()`
- Translation keys go in `src/i18n/cs.json` (primary) and `src/i18n/en.json`
- Use `useLocale()` from `@/i18n/LocaleContext` to access/change locale

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Type-check + production build
- `npm run lint` — ESLint
- `npm run preview` — Preview production build

## API
- Base URL: `https://a1.gpsguard.eu/api/v1`
- Auth: Basic auth (credentials in `.env`)
- Demo credentials available in `.env.example`
