# DAAM API Server

A RESTful API server for the **Dinner-and-a-Movie** (DAAM) restaurant and cinema app. This server provides endpoints for restaurant food ordering, movie ticket reservations, user authentication, and more.

## Quick Start

```bash
npm install
npm run load-db
npm start
```

The server will start on **http://localhost:3008** with authentication bypassed for easy development.

## Server Configuration

- **Port**: 3008
- **URL**: http://localhost:3008
- **CORS**: Enabled for all origins
- **Database**: JSON file-based (database.json)

## Development Commands

| Command | Description |
| ------- | ----------- |
| `npm install` | Install dependencies |
| `npm run load-db` | Reset database to initial seed data |
| `npm start` | Start server with auth bypassed |
| `npm run watch` | Start server with auto-reload on file changes (auth bypassed) |
| `node apiServer.mjs` | Start server with authentication enabled |
| `node apiServer.mjs --delay 2000` | Start with 2-second delay on all responses |

## Testing the API

Make HTTP requests using:
- [Postman](https://www.postman.com/)
- [Hoppscotch](http://hoppscotch.io)
- [ApiDog](https://apidog.com)
- curl
- Bruno (tests included in `unit_tests/`)

## Authentication

### Login

Make a POST request to `/login` with credentials:

```json
{
  "username": "me",
  "password": "pass"
}
```

**Response** (200 OK):
```json
{
  "id": 123,
  "username": "me",
  "first": "John",
  "last": "Doe",
  "email": "john@example.com",
  "password": "****",
  "adminUser": false,
  "isServer": false
}
```

The JWT token is returned in the response headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Using Authentication Tokens

For authenticated requests, include the JWT token in the Authorization header:

```
Authorization: Bearer <your-token-here>
```

### Test Accounts

All passwords are **"pass"** (configurable after login).

**Server Staff:**
- server1, server2, server3

**Administrators:**
- admin, cmac

**Regular Users:**
- me, and other users in the database

### Bypassing Authentication (Development Only)

For easier testing during development:

```bash
npm start          # Auth bypassed
npm run watch      # Auth bypassed with auto-reload
```

To enable full authentication:

```bash
node apiServer.mjs
```

## API Endpoints

### Authentication

| Method | Endpoint | Auth Required | Description |
| ------ | -------- | ------------- | ----------- |
| POST | `/login` | No | Authenticate user, returns JWT token |
| POST | `/register` | No | Create new user account |
| PATCH | `/account/:id` | Yes | Update user account (own account only) |

### Food Orders

| Method | Endpoint | Auth Required | Authorization |
| ------ | -------- | ------------- | ------------- |
| GET | `/orders` | Yes | Own orders (or all if admin/server staff) |
| GET | `/orders/current` | Yes | Current non-completed orders |
| GET | `/orders/:id` | Yes | Single order (own, admin, or server staff) |
| POST | `/placeOrder` | Optional | Place a new food order |

### Menu Items

| Method | Endpoint | Auth Required | Authorization |
| ------ | -------- | ------------- | ------------- |
| GET | `/menuItems` | No | Get all menu items |
| GET | `/menuItems/:id` | No | Get single menu item |
| POST | `/menuItems` | Yes | Admin only |
| PATCH | `/menuItems/:id` | Yes | Admin only |
| DELETE | `/menuItems/:id` | Yes | Admin only |

### Movie Reservations (Tickets)

| Method | Endpoint | Auth Required | Authorization |
| ------ | -------- | ------------- | ------------- |
| GET | `/reservations` | Yes | Own reservations (or all if admin) |
| GET | `/reservations/:id` | Yes | Single reservation (own or admin) |
| POST | `/buyTickets` | Optional | Purchase movie tickets |

### Movie Showings

| Method | Endpoint | Auth Required | Description |
| ------ | -------- | ------------- | ----------- |
| GET | `/showings` | No | All movie showings |
| GET | `/showings/:id` | No | Single showing |
| GET | `/showings/:showing_id/reservations` | No | All reservations for a showing |
| GET | `/showings/:film_id/:date` | No | Showings for a film on a date |

### Films

| Method | Endpoint | Auth Required |
| ------ | -------- | ------------- |
| GET | `/films` | No |
| GET | `/films/:id` | No |

### Theaters

| Method | Endpoint | Auth Required |
| ------ | -------- | ------------- |
| GET | `/theaters` | No |
| GET | `/theaters/:id` | No |

### Users

| Method | Endpoint | Auth Required | Authorization |
| ------ | -------- | ------------- | ------------- |
| GET | `/users` | Yes | Admin only (or single user by authenticated user) |
| GET | `/users/:id` | Yes | Own account or admin |
| PATCH | `/users/:id` | Yes | Admin only |

### Categories

| Method | Endpoint | Auth Required |
| ------ | -------- | ------------- |
| GET | `/categories` | No |

## Request/Response Examples

### POST /login

**Request:**
```json
{
  "username": "me",
  "password": "pass"
}
```

**Response (200):**
```json
{
  "id": 1,
  "username": "me",
  "password": "****",
  "first": "John",
  "last": "Doe",
  "email": "john@example.com",
  "phone": "555-0100",
  "imageUrl": "/images/users/1.jpg",
  "adminUser": false,
  "isServer": false
}
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### POST /placeOrder

**Request:**
```json
{
  "location": "Table 5",
  "area": "patio",
  "tip": 5.00,
  "pan": "4532-1234-5678-9010",
  "expiryMonth": 12,
  "expiryYear": 2026,
  "cvv": "123",
  "items": [
    {
      "id": 1,
      "itemId": 42,
      "name": "Burger",
      "price": 12.99,
      "notes": "No onions",
      "firstName": "John"
    }
  ]
}
```

**Response (200):**
```json
{
  "message": "Order placed",
  "id": 789
}
```

### POST /buyTickets

**Request:**
```json
{
  "showing_id": 5,
  "seats": [7, 8, 10, 22],
  "first_name": "Jo",
  "last_name": "Smith",
  "email": "jo.smith@gmail.com",
  "phone": "555-555-1234",
  "pan": "6011-0087-7345-4323",
  "expiry_month": 1,
  "expiry_year": 2026,
  "cvv": "123"
}
```

**Response (200):**
```json
[
  {
    "id": 8639,
    "showing_id": 5,
    "seat_id": 7,
    "user_id": 123,
    "payment_key": "pk_8413510552"
  },
  {
    "id": 8640,
    "showing_id": 5,
    "seat_id": 8,
    "user_id": 123,
    "payment_key": "pk_8413510552"
  }
]
```

## Database Schema

The database is a JSON file with the following collections. See [database.json](database.json) for the complete structure.

### users

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | number | Primary key |
| username | string | Unique |
| password | string | Plaintext (not hashed - educational project) |
| first | string | First name |
| last | string | Last name |
| email | string | Unique |
| phone | string | Unique |
| imageUrl | string | Profile image URL (optional) |
| creditCard | object | {pan, expiryMonth, expiryYear} |
| adminUser | boolean | Has administrator privileges |
| isServer | boolean | Has server staff privileges |

### menuItems

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | number | Primary key |
| name | string | Item name |
| description | string | Item description |
| category | string | Category name |
| price | number | Price in dollars |
| imageUrl | string | Image path |
| available | boolean | false = doesn't appear on menu |

### orders

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | number | Primary key |
| userId | number | Foreign key to users |
| orderTime | Date | When order was placed |
| location | string | Table number or delivery service |
| area | string | Section of restaurant |
| tax | number | Calculated sales tax |
| tip | number | Tip amount |
| creditCard | object | {pan, expiryMonth, expiryYear} (no CVV stored) |
| status | string | See order statuses below |
| items | array | Array of order items |

**Order Item Structure:**
```json
{
  "id": 1,
  "itemId": 42,
  "name": "Burger",
  "price": 12.99,
  "notes": "No onions",
  "firstName": "John"
}
```

### Order Statuses

| Status | Meaning |
| ------ | ------- |
| new | Guest has placed the order |
| cooking | Kitchen staff is prepping the order |
| readyForGuest | Ready for servers to deliver to the guest |
| pickedUp | Server is taking it to the guest |
| delivered | Guest received the order |
| problem | The order has one or more issues |
| completed | Paid and closed |

### films

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | number | Primary key |
| title | string | Film title |
| overview | string | Plot summary |
| poster_path | string | Poster image path |
| release_date | Date | Release date |
| runtime | number | Runtime in minutes |
| tagline | string | Marketing tagline |
| homepage | string | Official website URL |
| popularity | number | Popularity score |
| vote_average | number | Average rating |
| vote_count | number | Number of ratings |
| imdb_id | string | IMDb identifier |

### theaters

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | number | Primary key |
| name | string | Theater name |
| tables | array | Array of table objects with seats |

**Table Structure:**
```json
{
  "table_number": 1,
  "seats": [
    {
      "id": 1,
      "seat_number": 1,
      "price": 10.75
    }
  ]
}
```

### showings

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | number | Primary key |
| film_id | number | Foreign key to films |
| theater_id | number | Foreign key to theaters |
| showing_time | Date | Date/time of showing |

### reservations

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | number | Primary key |
| showing_id | number | Foreign key to showings |
| seat_id | number | Foreign key to seat within theater |
| user_id | number | Foreign key to users (optional) |
| payment_key | string | Payment processor reference |

### categories

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | number | Primary key |
| name | string | Category name |

## Static Assets

Files in the `public/` folder are served as static assets. You can place HTML, CSS, JavaScript, and image files here.

Example: A file at `public/images/logo.png` is accessible at:
```
http://localhost:3008/images/logo.png
```

## Simulating Slow Network

To test how your app handles slow network responses, add an artificial delay:

```bash
node apiServer.mjs --delay 2000
```

This adds a 2-second (2000ms) delay to all responses. Adjust the value as needed.

## Response Status Codes

| Code | Meaning | When Used |
| ---- | ------- | --------- |
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Not authorized for this resource |
| 403 | Forbidden | Not authenticated (need to log in) |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Internal server error |

## Troubleshooting

### Port Already in Use

If port 3008 is already in use:
```bash
# Find and kill the process using port 3008
lsof -ti:3008 | xargs kill
```

### Database Corruption

If the database becomes corrupted, regenerate it from seed data:
```bash
npm run load-db
```

**Warning:** This will delete all current data and restore initial seed data.

### Authentication Failures

1. Check that you're using the correct username/password
2. Verify the JWT token is in the Authorization header
3. Token format: `Bearer <token>`
4. For development, use `npm start` to bypass auth

### Changes Not Reflected

If code changes aren't reflected:
1. Stop the server (Ctrl+C)
2. Use `npm run watch` for auto-reload on file changes
3. Or manually restart with `npm start`

## Development Notes

### Modifying Seed Data

1. Edit files in `initial_data/` directory
2. Or modify the generation logic in `reloadDatabase.mjs`
3. Run `npm run load-db` to regenerate the database
4. **Do not** edit `database.json` directly (it will be overwritten)

### Security Considerations

This is an **educational/training project** with intentionally simplified security:

- Passwords stored in plaintext (not production-ready)
- Weak JWT secret (hardcoded)
- No rate limiting
- No input sanitization
- CORS allows all origins

**Do not use in production without proper security hardening.**

### Technology Stack

Built with:
- [json-server](https://github.com/typicode/json-server) - REST API framework
- [Express.js](https://expressjs.com/) - Web framework
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) - JWT authentication
- Node.js v18.11+

## License

UNLICENSED - For educational use only.

## Author

@RapPayne
