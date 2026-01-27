# AI Coding Assistant Instructions

This is the single source of truth for AI coding assistants working on the DAAM Server project.

## Quick Start

Before starting any work on this codebase:

1. Read this entire file
2. Review `/README.md` for project overview and setup
3. Review `/docs/ARCHITECTURE.md` for system design and patterns
4. Review `/docs/CODING-STANDARDS.md` for language-specific guidelines
5. Review `/docs/CONVENTIONS.md` for project-specific conventions

## Project Overview

DAAM Server is a RESTful API server for a restaurant ordering application. It provides:
- User authentication and registration
- Menu item management
- Food order processing
- Movie ticket reservations
- Mock data generation for testing

## Core Principles

1. **Simplicity First**: This is a teaching/training project. Keep code simple and readable.
2. **Security Awareness**: While this is educational, avoid introducing security vulnerabilities (SQLi, XSS, etc.)
3. **Development-Friendly**: Support bypass modes for easier testing (e.g., --skipAuth flag)
4. **Minimal Dependencies**: Only add dependencies when necessary

## Technology Stack

- **Runtime**: Node.js >= 18.11
- **Framework**: json-server (Express-based)
- **Authentication**: JWT (jsonwebtoken)
- **Module System**: ES Modules (.mjs files)
- **Database**: JSON file-based (lowdb via json-server)
- **Dev Dependencies**: @faker-js/faker, chance (for test data generation)

## Key Files and Directories

- `apiServer.mjs` - Main server entry point
- `database.json` - JSON database (DO NOT edit directly in code)
- `reloadDatabase.mjs` - Database initialization script
- `middlewares/` - Custom middleware (auth, logging, delay)
- `routers/` - Route handlers (orders, reservations, showings)
- `initial_data/` - Seed data files
- `public/` - Static assets
- `unit_tests/` - Bruno API tests

## Common Tasks

### Starting the Server
- Development (no auth): `npm start` or `npm run watch`
- Production (with auth): `node apiServer.mjs`
- With delay simulation: `node apiServer.mjs --delay 2000`

### Database Operations
- Reset database: `npm run load-db`
- Database is auto-created from initial_data/ directory

### Authentication
- All passwords default to "pass"
- JWT tokens in Authorization header: `Bearer <token>`
- Users: "server1", "server2", "server3", "admin", "cmac", "me"
- Bypass auth in dev: use --skipAuth flag

## Important Constraints

1. **Never commit database.json changes** - It's regenerated from initial_data/
2. **Don't modify user privileges client-side** - adminUser and isServer are server-controlled
3. **Keep backwards compatibility** - This is used in training courses
4. **Document TODOs** - Mark incomplete features clearly (see existing TODO comments)

## Testing

- API tests located in `unit_tests/` directory (Bruno format)
- Use Postman, Hoppscotch, or ApiDog for manual testing
- Default port: 3008

## Getting Help

- README.md has comprehensive API documentation
- Each router file has inline documentation
- Database schema documented in README.md
