# Coding Standards

## Language: JavaScript (ES Modules)

This project uses modern JavaScript with ES Modules.

## File Extensions
- Use `.mjs` extension for all JavaScript files
- This explicitly indicates ES Module usage

## Module System
- Use `import`/`export` syntax (ES Modules)
- No `require()` or `module.exports` (CommonJS)

```javascript
// Good
import express from 'express';
export function myFunction() {}
export const myRouter = () => {};

// Bad
const express = require('express');
module.exports = { myFunction };
```

## Naming Conventions

### Variables & Functions
- **camelCase** for variables, functions, and parameters
```javascript
const jwtToken = makeJwtToken(user);
const userId = req.params.id;
```

### Functions
- Use descriptive, verb-based names
- Arrow functions preferred for simple operations
- Named functions for exported/complex logic

```javascript
// Good
export function authRouter(app) { /* ... */ }
const makeJwtToken = (user) => jwt.sign(user, secret);

// Acceptable for inline callbacks
users.find(u => u.username === username);
```

### Constants
- UPPER_SNAKE_CASE for true constants
```javascript
const JWT_SECRET = "secret-key";
const DEFAULT_PORT = 3008;
```

### Files
- kebab-case for filenames
```
authentication-middleware.mjs
order.router.mjs
```

## Code Style

### Indentation
- 2 spaces (no tabs)

### Semicolons
- Optional but be consistent within a file
- Current codebase uses semicolons inconsistently - either style is acceptable

### String Quotes
- Prefer double quotes for strings
- Backticks for template literals
```javascript
const message = "Hello";
const url = `http://localhost:${port}`;
```

### Braces
- Always use braces for control structures
- Opening brace on same line
```javascript
// Good
if (user) {
  return user;
}

// Acceptable for simple returns
if (!user) return null;
```

## Async/Await vs Callbacks

- This codebase uses **callbacks** (legacy json-server style)
- When adding new code, match existing patterns
- For new standalone modules, async/await is acceptable

```javascript
// Current pattern (callbacks)
jwt.verify(token, secret, (err, user) => {
  if (err) return;
  req.user = user;
});

// Acceptable for new standalone code
try {
  const user = await verifyToken(token);
} catch (err) {
  // handle error
}
```

## Error Handling

### HTTP Status Codes
- 200 - Success
- 201 - Created (after successful POST)
- 400 - Bad Request (validation errors)
- 401 - Unauthorized (authentication failed)
- 403 - Forbidden (authenticated but not authorized)
- 404 - Not Found
- 500 - Internal Server Error

### Response Format
```javascript
// Success with data
res.status(200).send(user);

// Error with message
res.status(401).send("Bad username or password");

// Error with object
res.status(400).send({ error: "Validation failed", details: [] });
```

### Console Logging
- Use `console.log()` for informational messages
- Use `console.warn()` for warnings
- Use `console.error()` for errors

```javascript
console.log('API Server is running on port', port);
console.warn('Skipping authorization');
console.error('Database error:', err);
```

## Comments

### When to Comment
- Complex business logic
- Non-obvious behavior
- TODO items
- Security considerations
- JSDoc for exported functions

### JSDoc Style
```javascript
/**
 * This middleware should be run on every request.
 * If the request has an authorization header, decode the JWT token.
 * @param {function} app The express app itself
 */
export function authRouter(app) {
  // ...
}
```

### TODO Comments
```javascript
// TODO: Category should eventually be a collection/enum
// TODO: Make sure username isn't already taken
// TODO: hash the password
```

## Security

### Never commit:
- Real credentials
- API keys
- Production secrets

### Always validate:
- User inputs
- User permissions before mutations
- Authentication before sensitive operations

### Security Comments
```javascript
// NOTE: Do not change adminUser or isServer here or any user can self-promote.
```

## Database Operations

### Reading
```javascript
const db = readDatabase();
const users = db.users;
```

### Writing
```javascript
const db = readDatabase();
db.users.push(newUser);
saveDatabase(db);
```

### Never
- Modify database.json manually
- Keep database in memory without saving
- Mutate db object without calling saveDatabase()

## Request/Response Patterns

### Accessing Request Data
```javascript
const userId = +req.params.id;  // URL parameters (convert to number)
const { username, password } = req.body;  // Body data
const authHeader = req.headers['authorization'];  // Headers
const user = req.user;  // Set by middleware
```

### Setting Response Data
```javascript
res.status(200).send(data);  // Send JSON
res.header('Authorization', `Bearer ${token}`);  // Set header
```

## Middleware Patterns

### Standard Middleware
```javascript
export const myMiddleware = (req, res, next) => {
  // Do something
  next();  // Always call next() unless sending response
};
```

### Parameterized Middleware
```javascript
export const delayMiddleware = (ms) => {
  return (req, res, next) => {
    setTimeout(() => next(), ms);
  };
};
```

### Router as Middleware
```javascript
export function myRouter(app) {
  app.get('/endpoint', (req, res) => {
    // Handle request
  });
}
```

## Testing Conventions

- API tests use Bruno format (in `unit_tests/`)
- Test files end in `.test.mjs`
- Keep tests simple and readable

## Anti-Patterns to Avoid

1. Don't modify `req` or `res` objects extensively (except established patterns like `req.user`)
2. Don't nest callbacks deeply (callback hell)
3. Don't use `var` (use `const` or `let`)
4. Don't mix authentication logic across multiple files
5. Don't bypass repository pattern for database access
