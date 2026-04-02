# Backend

This folder contains the Express API for WorkVerse and the Neo4j integration used for graph-powered hiring workflows.

## Responsibilities

- Authentication with JWT
- Candidate, employer, company, job, and application APIs
- Neo4j graph queries for skills and matching
- Admin graph stats, schema inspection, and read-only query endpoints
- Seed and graph maintenance scripts

## Important Files

- `server.js` boots the API and mounts routes
- `config/neo4j.js` creates the Neo4j driver and session helpers
- `middleware/auth.js` handles JWT authentication
- `routes/` contains feature-based API modules
- `scripts/` contains seeding and graph utility scripts

## Environment Setup

Copy `backend/.env.example` to `backend/.env` and fill in your Neo4j and JWT values.

## Run Locally

```bash
npm install
npm run dev
```

The server defaults to `http://localhost:5000`.
