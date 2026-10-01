# Stride Running Club

> High-energy community running club web app featuring verified routes, interactive GPS maps, upcoming group runs, RSVP coordination, and official club member rostering.

---

## 🚀 Overview

**Stride Running Club** is a full-stack web application designed for running communities, clubs, and endurance athletes. It provides a seamless platform for organizing group runs, discovering scenic community routes via Leaflet GPS maps, managing RSVPs, tracking pace and distance metrics, and connecting with fellow runners through an integrated club roster.

---

## ✨ Key Features

- **Group Run Scheduling & RSVP Coordination**: Create, host, and discover group runs with distance, pace category (Recovery, Steady, Tempo, Long Run), start time, and location details. Runners can RSVP ("I'M GOING") with live headcount updates.
- **Interactive GPS Route Explorer**: Browse verified community running routes with interactive Leaflet maps, elevation profiles, distance markers, and route difficulty ratings.
- **Official Club Roster & Athlete Profiles**: Filterable club directory featuring athlete profiles, target paces, verified membership status, pacer badges, and session contribution counts.
- **Secure Authentication**: User authentication backed by Firebase Auth and secure session management.
- **High-Performance UI/UX**: Crafted with a bold athletic design system (Barlow typography, high-contrast borders, custom shadows, and responsive Tailwind CSS v4 styling).

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Leaflet (`react-leaflet`), Lucide React, Motion.
- **Backend**: Node.js, Express, TypeScript, Server-side bundling via `esbuild`.
- **Database & ORM**: PostgreSQL (Cloud SQL ready) managed with Drizzle ORM & Drizzle Kit.
- **Authentication**: Firebase Authentication & Google OAuth integration.
- **Deployment & Build**: Vite, esbuild, Docker / Google Cloud Run compatible container architecture.

---

## 📁 Project Structure

```tree
├── server.ts                 # Express server & API routes
├── drizzle.config.ts         # Drizzle ORM configuration
├── src/
│   ├── App.tsx               # Root component & view router
│   ├── main.tsx              # React entry point
│   ├── index.css             # Tailwind CSS entry & global styles
│   ├── components/           # Reusable UI components (Modals, Navbar, etc.)
│   ├── db/                   # Database schema and connection setup
│   └── views/                # Main feature views (Home, Explore, Runs, Profile, Routes)
├── package.json              # Dependencies and build scripts
└── metadata.json             # Applet capability metadata
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL database (or local instance)
- Firebase project configuration

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in a `.env` file based on your environment:
   ```env
   PORT=3000
   DATABASE_URL=postgres://user:password@localhost:5432/stride_db
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   ```

### Running Locally

Start the development server (runs Express + Vite middleware via `tsx`):
```bash
npm run dev
```

### Production Build

Bundle and build the application for production:
```bash
npm run build
npm start
```

---

## 💼 Portfolio Positioning

**Project Title**: Stride Running Club Connect  
**Description**: A production-grade full-stack web application built with React, TypeScript, Express, and PostgreSQL, featuring interactive GPS route mapping, real-time group run scheduling, RSVP coordination, and secure Firebase authentication.

- Demonstrates robust full-stack architecture with TypeScript end-to-end.
- Implements relational database schema management using Drizzle ORM and PostgreSQL.
- Incorporates third-party geospatial visualization (Leaflet) and user authentication flows.
- Engineered with rapid prototyping, clean component modularity, and production containerization.

---

## 📄 License

MIT License © Stride Running Club Connect.
