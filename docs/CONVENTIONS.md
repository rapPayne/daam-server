# Project Conventions

## Directory Structure

```
daam-server/
├── docs/                       # Project documentation
├── initial_data/              # Seed data for database generation
├── middlewares/               # Express middleware
│   ├── authentication-middleware.mjs
│   ├── delay-middleware.mjs
│   └── logging-middleware.mjs
├── node_modules/              # Dependencies (don't commit)
├── public/                    # Static assets served by Express
├── routers/                   # Route handlers
│   ├── order.router.mjs
│   ├── reservations.router.mjs
│   └── showings.router.mjs
├── unit_tests/                # API tests (Bruno format)
├── apiServer.mjs              # Main server entry point
├── database.json              # JSON database (generated, don't commit changes)
├── reloadDatabase.mjs         # Database seed script
├── repository.mjs             # Database access layer
├── package.json               # Project metadata & scripts
└── README.md                  # User-facing documentation
```

## File Naming Conventions

### General Rules
- All JavaScript files use `.mjs` extension
- Use kebab-case for filenames
- Be descriptive and specific

### Patterns
- Middleware: `[name]-middleware.mjs`
- Routers: `[resource].router.mjs`
- Tests: `[name].test.mjs`
- Data: `[collection].json`

### Examples
```
authentication-middleware.mjs  ✓
order.router.mjs               ✓
users.json                     ✓

auth_middleware.mjs            ✗ (use kebab-case)
OrderRouter.mjs                ✗ (not PascalCase)
order-router.mjs               ✗ (missing .router pattern)
```

## Code Organization

### Router Files

Pattern:
```javascript
import { readDatabase, saveDatabase } from '../repository.mjs';

/**
 * Router description
 * @param {Express} app - Express application instance
 */
export function resourceRouter(app) {
  // GET endpoint
  app.get('/resource', (req, res) => {
    // Implementation
  });

  // POST endpoint
  app.post('/resource', (req, res) => {
    // Implementation
  });

  // PATCH endpoint
  app.patch('/resource/:id', (req, res) => {
    // Implementation
  });
}
```

### Middleware Files

Pattern:
```javascript
/**
 * Middleware description
 */
export const middlewareName = (req, res, next) => {
  // Implementation
  next();
};

// Or parameterized:
export const middlewareName = (config) => {
  return (req, res, next) => {
    // Implementation
    next();
  };
};
```

## Authentication Patterns

### Checking Authentication
```javascript
// In route handlers
if (!req.user && !req.skipAuth) {
  res.status(403).send("Please log in");
  return;
}
```

### Checking Authorization
```javascript
// User can only access their own data
if (req.user.id !== userId && !req.skipAuth) {
  res.status(401).send("Not authorized");
  return;
}

// Admin-only access
if (!req.user.adminUser && !req.skipAuth) {
  res.status(401).send("Admin access required");
  return;
}

// Server staff access
if (!req.user.isServer && !req.skipAuth) {
  res.status(401).send("Server access required");
  return;
}
```

### JWT Token Pattern
```javascript
// Setting token in response
const token = jwt.sign(userData, secret);
res.header('Authorization', `Bearer ${token}`);

// Reading token from request (done in middleware)
const authHeader = req.headers['authorization'];
const token = authHeader && authHeader.split(' ')[1];
```

## Database Patterns

### Reading Data
```javascript
const db = readDatabase();
const users = db.users;
const user = users.find(u => u.id === userId);
```

### Writing Data
```javascript
const db = readDatabase();

// Adding
db.users.push(newUser);

// Updating
db.users = db.users.map(u =>
  u.id === userId ? updatedUser : u
);

// Deleting
db.users = db.users.filter(u => u.id !== userId);

saveDatabase(db);  // Always save!
```

### ID Generation
```javascript
// Pattern for auto-incrementing IDs
const getNextId = (collection) =>
  collection.reduce((prev, curr) =>
    (prev > curr.id) ? prev : curr.id, 0) + 1;

const newId = getNextId(db.users);
```

## Request/Response Conventions

### URL Parameters
- Use numeric IDs: `/resource/:id`
- Convert to number: `const id = +req.params.id;`

### Query Parameters
- Use for filtering: `/orders?userId=5`
- Access: `req.query.userId`

### Request Body
- Always JSON
- Destructure what you need: `const { username, password } = req.body;`

### Response Status Codes
- 200: Success (GET, PATCH)
- 201: Created (POST)
- 400: Bad Request (validation)
- 401: Unauthorized (auth failed)
- 403: Forbidden (not logged in)
- 404: Not Found
- 500: Server Error

### Response Bodies
```javascript
// Success with data
res.status(200).send(data);

// Success with message
res.status(200).send({ message: "Success" });

// Error with message
res.status(400).send("Error message");

// Never send passwords
res.send({ ...user, password: "****" });
```

## Command Line Arguments

### Processing Pattern
```javascript
const args = process.argv.slice(2);
args.forEach((arg, index) => {
  if (arg === '--flag' || arg === '-f') {
    // Handle flag
  } else if (arg === '--option' || arg === '-o') {
    const value = args[index + 1];
    // Handle option with value
  }
});
```

### Supported Flags
- `--skipAuth` / `-s` - Bypass authentication
- `--delay <ms>` / `-d <ms>` - Add artificial delay

## Testing Conventions

### API Testing
- Use Bruno format (unit_tests/)
- Test success cases
- Test authentication
- Test authorization
- Test validation

### Test Users
```javascript
// Server staff
username: "server1", "server2", "server3"
password: "pass"

// Admin users
username: "admin", "cmac"
password: "pass"

// Regular users
username: "me", etc.
password: "pass"
```

## Git Conventions

### Don't Commit
- `node_modules/`
- `database.json` (it's generated)
- `.DS_Store`
- IDE settings (unless shared)
- Sensitive credentials

### Do Commit
- `initial_data/` (seed data)
- Documentation
- Tests
- Source code

### Commit Messages
- Present tense: "Add feature" not "Added feature"
- Imperative: "Fix bug" not "Fixes bug"
- Descriptive: Reference what changed and why

## Environment Conventions

### Node Version
- Minimum: 18.11
- Specified in package.json engines field

### Port
- Default: 3008
- Hardcoded (not environment variable)

### Dependencies
- Keep minimal
- Use exact versions or `^` for minor updates
- Regular updates for security patches

## Documentation Conventions

### README.md
- User-facing documentation
- Setup instructions
- API documentation
- Examples

### Code Comments
- Why, not what
- Complex logic
- Security notes
- TODOs

### JSDoc
- Exported functions
- Public APIs
- Complex parameters

## Error Handling

### Pattern
```javascript
// Early returns for errors
if (!isValid) {
  res.status(400).send("Validation failed");
  return;
}

// Success case last
res.status(200).send(result);
```

### Logging
```javascript
console.log('Info:', message);      // General info
console.warn('Warning:', message);  // Warnings
console.error('Error:', err);       // Errors
```

## Security Conventions

### What to Validate
- User inputs (body, params, query)
- User permissions (authentication + authorization)
- Data existence (404 if not found)

### What to Sanitize
- User passwords in responses: `password: "****"`
- Sensitive data in logs
- Error messages (don't leak internal details)

### Development vs Production
- Development: `--skipAuth` for convenience
- Production: Full authentication required
- Never disable security in production builds
