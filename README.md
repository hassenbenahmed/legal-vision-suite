# Legal Vision Suite

A modern legal operations dashboard that centralizes case management, client relations, appointment scheduling, invoicing, and task tracking. The application is built with React, TypeScript, and Tailwind CSS to deliver a responsive, accessible experience for legal teams.

## Features

- **Dashboards** with KPIs, charts, and activity feeds for at-a-glance insights.
- **Case management** including document previews and status tracking.
- **Client directory** with quick search and contact records.
- **Task coordination** with dialogs, assignments, and reminders powered by Supabase.
- **Appointments and invoicing** views for managing the legal workflow end-to-end.

## Tech Stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/) for styling
- [Supabase](https://supabase.com/) integration scaffolding (see `supabase/` and `src/integrations/supabase`)
- [React Router](https://reactrouter.com/) for client-side navigation
- [TanStack Query](https://tanstack.com/query/latest) for data fetching and caching

## Getting Started

### Prerequisites

- Node.js 18+ (or [Bun](https://bun.sh/) 1.1+) installed locally
- Supabase project credentials if you plan to connect to a live backend

### Installation

```powershell
git clone <your-repo-url>
cd legal-vision-suite
# With bun (recommended)
bun install
# or with npm
npm install
```

### Scripts

```powershell
# Start the dev server on http://localhost:5173
bun run dev

# Type-check and build for production
bun run build

# Preview the production build locally
bun run preview

# Lint the codebase
bun run lint
```

> Replace `bun` with `npm` or `pnpm` if you prefer a different package manager.

### Environment Variables

Copy `.env.example` to `.env.local` (create the example file if needed) and populate it with your Supabase URL and anon/public keys.

```powershell
cp .env.example .env.local
```

## Project Structure

- `src/pages/` – route-level screens for dashboard, cases, clients, invoices, tasks, and more.
- `src/components/` – reusable UI blocks, dialogs, charts, forms, and layout scaffolding.
- `src/contexts/` – context providers (e.g., authentication state).
- `src/integrations/supabase/` – Supabase client configuration and generated types.
- `supabase/` – migration history and configuration files for database setup.

## Deployment

Any static hosting platform that supports Vite builds will work (Netlify, Vercel, Cloudflare Pages, etc.).

1. Run `bun run build` (or `npm run build`).
2. Upload the contents of `dist/` to your hosting provider.
3. Configure environment variables on the hosting platform for Supabase credentials.

## Contributing

1. Fork the repository and create a feature branch.
2. Commit changes with clear messages and add tests when applicable.
3. Open a pull request describing the change and screenshots when relevant.

## License

This project is licensed under the MIT License. See `LICENSE` for details.
