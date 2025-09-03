# Mining Syndicate Presentation Platform

## Overview
This project is a full-stack presentation platform for a mining syndicate business. It provides an interactive viewer for investment opportunities, lead capture, and an admin dashboard for content management. The platform aims to streamline the showcasing of mining investment opportunities, manage leads efficiently, and provide robust content control for administrators.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
**August 30, 2025**: Database migration issue caused data loss. Resolved by manually recreating tables and restoring functionality. However, site-specific slide data was lost and needs to be re-uploaded.

## System Architecture
### Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **UI/UX**: Shadcn/UI (built on Radix UI) for components, Tailwind CSS for styling with a custom dark theme.
- **State Management**: TanStack Query for server state and caching.
- **Routing**: Wouter for client-side routing.
- **Form Handling**: React Hook Form with Zod validation.

### Backend
- **Framework**: Node.js with Express.js.
- **Authentication**: Passport.js with Google OAuth 2.0 (Google Strategy).
- **Session Management**: Express sessions with PostgreSQL storage.
- **Security**: Built-in crypto module with scrypt for password hashing.
- **API**: RESTful endpoints with error handling.

### Database
- **Database**: PostgreSQL (Neon serverless hosting).
- **ORM**: Drizzle ORM for type-safe operations.
- **Schema Management**: Drizzle Kit for migrations.
- **Data Models**: Includes tables for users, leads (site-specific), slide settings, access requests, access lists, and sessions.

### Authentication & Authorization
- **Strategy**: Google OAuth 2.0 via Passport.js.
- **Access Control**: Admin-managed access list system; role-based access for site managers.
- **Session Persistence**: Enhanced session management for seamless navigation.
- **Route Protection**: Middleware and frontend guards for secure access.

### Content & Site Management
- **Multi-Site System**: Supports rapid deployment of customized mining syndicate sites with unique IDs, custom content, and site-specific lead tracking.
- **Admin Panels**: Dedicated admin panels for each site (`/site/{siteId}/admin`) with lead analytics and configuration.
- **Content Controls**: Dynamic slide visibility, lead tracking, and contact management via admin dashboard.
- **Lead Segmentation**: Leads categorized into Information Requests, Mining Pool, and Lending Pool.
- **Landing Page**: A simplified landing page at the root URL with a hero section and investment opportunity forms.

## External Dependencies
### Database Services
- **Neon Database**: Serverless PostgreSQL.

### UI & Styling
- **Radix UI**: Headless UI components.
- **Tailwind CSS**: Utility-first CSS framework.
- **Google Fonts**: Inter and JetBrains Mono.
- **Lucide React**: Icon library.

### Development Tools
- **TypeScript**: For type safety.
- **Vite**: Fast development server and build tool.
- **ESBuild**: Server-side bundling.
- **PostCSS**: CSS processing.

### Integrations
- **HubSpot CRM**: For automated lead management and form submissions, including site-specific lead attribution.