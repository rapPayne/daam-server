# DAAM Server Architecture

## System Overview

DAAM Server is a RESTful API server built on top of json-server, providing a mock backend for restaurant ordering and movie ticket reservation applications.

## Technology Stack

### Core
- **Node.js**: v18.11+ (ES Modules)
- **json-server**: v0.17.0 - Provides REST API scaffolding
- **Express.js**: (via json-server) - Web framework
- **lowdb**: (via json-server) - JSON file database

### Authentication & Security
- **jsonwebtoken**: v9.0.1 - JWT token generation and validation
- **cookie-parser**: v1.4.6 - Cookie parsing middleware

### Middleware
- **cors**: v2.8.5 - Cross-origin resource sharing
- **body-parser**: (via json-server) - Request body parsing

### Development
- **@faker-js/faker**: v9.7.0 - Mock data generation
- **chance**: v1.1.8 - Random data generation

## Architecture Patterns

### Middleware Pattern

The server uses Express middleware for cross-cutting concerns:

1. **CORS** - Allows all origins (`*`) for development flexibility
2. **URL Rewriting** - Maps `/api/*` to `/*` for cleaner URLs
3. **Body Parser** - Parses JSON request bodies
4. **Logging** - Custom logging middleware for request tracking
5. **Delay** - Optional artificial delay for network simulation
6. **Cookie Parser** - Parses cookies from requests
7. **Authentication** - JWT validation on every request

Middleware execution order (in `apiServer.mjs`):
```
cors → urlRewrite → bodyParser → logging → delay? → defaults → cookieParser → auth
```

### Router Pattern

Custom routers handle specific domain logic:
- `authRouter` - Authentication endpoints (login, register, account)
- `orderRouter` - Food order management
- `reservationsRouter` - Movie ticket reservations
- `showingsRouter` - Movie showing information

### Repository Pattern

`repository.mjs` provides database access abstraction:
- `readDatabase()` - Loads database.json
- `saveDatabase(data)` - Persists changes to database.json

This keeps data access logic separate from business logic.

## Data Flow

### Authentication Flow
```
Client → POST /login
       → authRouter validates credentials
       → JWT token generated
       → Token in Authorization header
       → Client stores token
       → Subsequent requests include: "Authorization: Bearer <token>"
       → authRouter middleware validates JWT
       → req.user populated with decoded user data
```

### Order Flow
```
Client → POST /placeOrder
       → authRouter checks authentication
       → orderRouter validates order data
       → Order saved to database.json
       → Response sent to client
```

### Bypass Mode (Development)
```
Server started with --skipAuth
  → app.skipAuth = true
  → req.skipAuth = true in middleware
  → Authorization checks skipped
  → All endpoints accessible
```

## Database Schema

### Physical Storage
- Single JSON file: `database.json`
- In-memory updates via lowdb
- Atomic writes on save

### Collections
- `users` - User accounts, authentication, profiles
- `menuItems` - Restaurant menu with pricing
- `oldOrders` - Historical food orders (read-only via GET)
- `orders` - Active food orders (full CRUD)
- `showings` - Movie showings schedule
- `reservations` - Movie ticket reservations

See README.md for detailed schema definitions.

## Security Considerations

### Current Implementation
- JWT tokens for authentication
- Bearer token in Authorization header
- Password validation (plaintext - NOT production-ready)
- User privilege separation (adminUser, isServer flags)

### Known Limitations (By Design - Educational Project)
- Passwords stored in plaintext
- Weak JWT secret (hardcoded)
- No rate limiting
- No input sanitization
- No HTTPS enforcement
- CORS set to allow all origins

**These are acceptable for a training/educational environment but would need hardening for production.**

## Extensibility

### Adding New Endpoints
1. Create router in `/routers/[name].router.mjs`
2. Export router function that takes `app` as parameter
3. Import and call in `apiServer.mjs`
4. Use `req.user` for authenticated user
5. Use `req.skipAuth` to check bypass mode

### Adding Middleware
1. Create in `/middlewares/[name]-middleware.mjs`
2. Export middleware function
3. Add to middleware chain in `apiServer.mjs` (order matters!)

### Modifying Database Schema
1. Update seed data in `/initial_data/`
2. Update `reloadDatabase.mjs` generation logic
3. Run `npm run load-db`
4. Update README.md schema documentation

## Configuration

### Command Line Arguments
- `--skipAuth` or `-s` - Bypass all authentication
- `--delay <ms>` or `-d <ms>` - Add artificial delay to responses

### Port
- Default: 3008
- Hardcoded in `apiServer.mjs` (could be environment variable)

### Database Path
- Default: `./database.json` (relative to project root)
- Configured in `apiServer.mjs`

## Development vs Production

### Development Mode (Default npm scripts)
```bash
npm start  # → node apiServer.mjs --skipAuth
npm run watch  # → node --watch apiServer.mjs --skipAuth
```
- No authentication required
- Easy testing
- Auto-reload with --watch

### Production Mode
```bash
node apiServer.mjs
```
- Full authentication required
- Secure by default
