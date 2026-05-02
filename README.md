# WorkVerse Job Portal

WorkVerse is a full-stack job portal that uses a graph database to model candidates, employers, jobs, skills, and applications. The repository is organized as a frontend and backend app, with project notes and PRD assets grouped under `docs/`.

## Suggested GitHub Description

WorkVerse is a graph-powered job portal built with React, Express, and Neo4j for candidate discovery, skill-based matching, employer workflows, and admin graph exploration.

## Suggested GitHub About Section

- Description: WorkVerse is a graph-powered job portal built with React, Express, and Neo4j for candidate discovery, skill-based matching, employer workflows, and admin graph exploration.
- Website: Add your deployed frontend URL once available, for example `https://workverse.vercel.app`
- Topics: `react`, `vite`, `nodejs`, `express`, `neo4j`, `job-portal`, `graph-database`, `jwt-auth`, `full-stack`

## Tech Stack

- Frontend: React, Vite, React Router, Axios
- Backend: Node.js, Express, JWT auth, bcrypt
- Database: Neo4j Aura / Neo4j Driver
- Tooling: ESLint, npm

## Repository Structure

```text
WorkVerse-JobPortal/
|-- backend/        Express API, Neo4j config, routes, seed and utility scripts
|-- frontend/       React + Vite client application
|-- docs/           PRD and supporting project reference files
|-- .gitignore
|-- package.json    Root helper scripts for working with frontend/backend
|-- README.md
```

## Core Features

- Candidate and employer authentication
- Candidate profile management
- Employer job posting and dashboard flows
- Skill-aware job and candidate matching powered by Neo4j relationships
- Application tracking
- Admin graph stats, schema inspection, query console, and graph explorer

## Getting Started

### 1. Install dependencies

```bash
npm run install:all
```

Or install each app separately:

```bash
cd backend
npm install
cd ../frontend
npm install
```

### 2. Configure environment variables

Create `backend/.env` using `backend/.env.example` as a reference.

Required backend variables:

- `PORT`
- `JWT_SECRET`
- `NEO4J_URI`
- `NEO4J_USER`
- `NEO4J_PASSWORD`
- `NEO4J_DATABASE`

### 3. Start the backend

```bash
npm run dev:backend
```

The API runs on `http://localhost:5000`.

### 4. Start the frontend

```bash
npm run dev:frontend
```

The frontend runs on `http://localhost:5173`.

## Available Scripts

### Root

- `npm run install:all` installs dependencies in both apps
- `npm run dev:backend` starts the backend server
- `npm run dev:frontend` starts the frontend dev server
- `npm run build` builds the frontend for production
- `npm run lint` runs frontend linting
- `npm run seed` seeds the Neo4j database from the backend app

### Backend

- `npm start` starts the Express server
- `npm run dev` starts the Express server
- `npm run seed` seeds sample graph data
- `npm run check:jobs` runs the job verification helper
- `npm run check:users` runs the user verification helper

### Frontend

- `npm run dev` starts Vite
- `npm run build` creates a production build
- `npm run preview` previews the production build
- `npm run lint` runs ESLint

## API Overview

The backend is structured by feature area:

- `/api/auth` for register, login, and auth-related admin helpers
- `/api/candidates` for candidate data and profile operations
- `/api/jobs` for browsing, creating, updating, and viewing jobs
- `/api/companies` for company-related data
- `/api/applications` for application submission and tracking
- `/api/matching` for graph-based matching workflows
- `/api/skills` for skill data
- `/api/admin/*` for graph stats, schema inspection, and read-only querying

## Notes for Contributors

- The frontend currently expects the backend at `http://localhost:5000/api`.
- CORS is configured in the backend for `http://localhost:5173`.
- Neo4j seed and probe scripts live in `backend/scripts/`.
- Project planning/reference assets are stored in `docs/`.

## Future Cleanup Ideas

- Add automated tests for API routes and key frontend flows
- Add a root dev script that runs frontend and backend together
- Add screenshots and architecture diagrams to the README
