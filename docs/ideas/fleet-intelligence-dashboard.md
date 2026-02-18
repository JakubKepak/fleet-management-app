# GPS Dozor — Fleet Intelligence Dashboard

## Problem Statement
How might we give fleet managers a single, clear dashboard to monitor vehicles, drivers, costs, and vehicle health — turning raw GPS tracking data into actionable decisions?

## Recommended Direction
Build all 5 modules for full breadth, but elevate the experience with an intelligence layer that surfaces anomalies and insights proactively. The app is a **Classic Dashboard + Intelligence Hub**: every module has a solid data layer (tables, maps, charts) plus smart cards that highlight what needs attention.

This approach works for an assignment because it demonstrates both technical breadth (5 modules, real API integration, maps, charts, AI) and product thinking (don't just show data — tell the user what matters). It also works as a real product because a fleet manager can open the app and immediately see alerts instead of hunting through raw data.

## Modules & Scope

| Module | Data Layer | Intelligence Layer | AI (Gemini) |
|---|---|---|---|
| **Dashboard** | Live map with vehicle markers, fleet status counters | Alert cards: speeding, low battery, fuel anomalies | AI summary of fleet status, predicted issues |
| **Fleet** | Vehicle list, trip history table, position history playback on map | Distance/trip trends per vehicle | Unusual mileage/route anomaly detection |
| **Drivers** | Driver list, eco-driving events table with severity | Driver score ranking, worst/best performers, event breakdown | Driver risk trending, behavior predictions |
| **Fuel & Costs** | Consumption data per vehicle and trip | Cost trend charts, high-consumption flagging | Fuel cost forecasting, waste identification |
| **Vehicle Health** | Sensor readings per vehicle (temp, battery, RPM, etc.) | Threshold alerts (battery low, temp high), status indicators | Predictive maintenance, sensor anomaly detection |

## AI Integration

### Architecture
```
Browser (React) → Vercel Edge Functions → Gemini 3 Flash API
                                               ↓
Fleet data from GPS Dozor API ──────→ Context for prompts
```

### Two AI Surfaces
1. **Insight Cards (Proactive)** — AI-generated cards on each module page analyzing current data
2. **Chat Assistant (Reactive)** — Global slide-out panel for ad-hoc fleet questions

### AI Model
- **Gemini 3 Flash** — fast, cheap ($0.50/1M input tokens), structured output for insight cards
- Proxy via **Vercel Edge Functions** to keep API key server-side

### How Data Flows to AI
1. Frontend fetches fleet data from GPS Dozor API (via TanStack Query)
2. When AI insight is needed, frontend sends relevant data subset to Vercel Edge Function
3. Edge function constructs prompt with fleet data context + calls Gemini 3 Flash
4. Structured response returned → rendered as insight cards or chat messages

## Key Assumptions to Validate
- [ ] Demo API account has multiple vehicles with recent data — test with `/groups` and `/vehicles/group/<code>`
- [ ] Sensor data is populated for demo vehicles — test with `/vehicle/<code>/sensors`
- [ ] Eco-driving events exist in demo data — test with `/vehicle/<code>/eco-driving-events`
- [ ] Trip history has fuel/cost data populated — test with `/vehicle/<code>/trips`
- [ ] Gemini 3 Flash API is accessible from Google AI Studio account

## MVP Scope (Module Build Order)
1. **Dashboard** — fleet overview + live map + alert cards (foundation for everything)
2. **Fleet** — vehicle list + trip history + position history on map
3. **Drivers** — eco-driving events + driver scoring
4. **Fuel & Costs** — consumption analytics + cost trends
5. **Health** — sensor monitoring + threshold alerts
6. **AI Layer** — integrate Gemini insight cards + chat across all modules

## Not Doing (and Why)
- **Engine relay control (immobilizer)** — destructive action, risky for a demo, low showcase value
- **Branch/organization management** — admin feature, not user-facing insight
- **Refueling card management** — niche admin feature
- **Trip purpose setting** — write operation with limited demo value
- **Real-time WebSocket updates** — API is REST-only; we'll poll on interval instead
- **Mobile-first design** — desktop dashboard is the primary target; responsive is nice-to-have
- **Fine-tuned AI model** — use prompt engineering with Gemini 3 Flash, no custom training needed

## Resolved Questions
- **Charts**: Recharts
- **Google Maps**: placeholder key for now
- **Polling interval**: TBD (30-60s)
- **AI proxy**: Vercel Edge Functions
- **AI model**: Gemini 3 Flash
- **AI UX**: Insight cards on each module + global chat assistant

## Tech Stack
React 19, TypeScript, Vite 7, Ant Design 6, Tailwind CSS 4, TanStack Query, React Router v7, @vis.gl/react-google-maps, react-intl (cs/en), Recharts, Gemini 3 Flash (via Vercel Edge Functions)
