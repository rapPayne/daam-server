# Database Schema

DAAM supports two database backends:

- **JSON (default)** — `database.json`, loaded via `npm run load-db`
- **PostgreSQL (optional)** — a `daam` database, loaded via `npm run load-pg`

The PostgreSQL schema normalizes the nested JSON structures as described below.

---

## JSON Database

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

---

## PostgreSQL Database

### Starting PostgreSQL

If PostgreSQL is not already running, start it with:

```bash
brew services start postgresql@17
```

### Listing Existing Databases

To see what databases currently exist:

```bash
psql -U <yourname> -l
```

Replace `<yourname>` with your macOS username (e.g., `rap`).

### Loading the DAAM Database

Run `npm run load-pg` to create and populate the `daam` PostgreSQL database from the current `database.json`. If the database already exists, the script will ask for confirmation before dropping and recreating it.

Connection defaults (override with environment variables):

| Variable | Default |
| -------- | ------- |
| `PGHOST` | localhost |
| `PGPORT` | 5432 |
| `PGUSER` | your macOS username |
| `PGPASSWORD` | (empty) |

### Normalization Changes

The following JSON structures are split into separate tables:

| JSON structure | PostgreSQL tables |
| -------------- | ----------------- |
| `users[].creditCard` | columns on `users` (`cc_pan`, `cc_expiry_month`, `cc_expiry_year`) |
| `orders[].creditCard` | columns on `orders` (`cc_pan`, `cc_expiry_month`, `cc_expiry_year`) |
| `orders[].items` | `order_items` table |
| `theaters[].tables` | `theater_tables` table |
| `theaters[].tables[].seats` | `theater_seats` table |
| `categories` (array of strings) | `categories` table with auto-assigned ids |

### PostgreSQL Tables

#### users
| Column | Type | Notes |
| ------ | ---- | ----- |
| id | INTEGER | Primary key |
| username | VARCHAR(100) | Unique |
| password | VARCHAR(255) | |
| first | VARCHAR(100) | |
| last | VARCHAR(100) | |
| email | VARCHAR(255) | Unique |
| phone | VARCHAR(50) | Unique |
| image_url | VARCHAR(500) | |
| cc_pan | VARCHAR(50) | Credit card number |
| cc_expiry_month | INTEGER | |
| cc_expiry_year | INTEGER | |
| admin_user | BOOLEAN | |
| is_server | BOOLEAN | |

#### categories
| Column | Type | Notes |
| ------ | ---- | ----- |
| id | SERIAL | Primary key |
| name | VARCHAR(100) | Unique |

#### menu_items
| Column | Type | Notes |
| ------ | ---- | ----- |
| id | INTEGER | Primary key |
| name | VARCHAR(255) | |
| description | TEXT | |
| category_id | INTEGER | FK → categories |
| price | NUMERIC(10,2) | |
| image_url | VARCHAR(500) | |
| available | BOOLEAN | |

#### orders
| Column | Type | Notes |
| ------ | ---- | ----- |
| id | INTEGER | Primary key |
| user_id | INTEGER | FK → users |
| order_time | TIMESTAMPTZ | |
| pickup_time | TIMESTAMPTZ | |
| area | VARCHAR(100) | |
| location | VARCHAR(100) | |
| tax | NUMERIC(10,2) | |
| tip | NUMERIC(10,2) | |
| cc_pan | VARCHAR(50) | |
| cc_expiry_month | INTEGER | |
| cc_expiry_year | INTEGER | |
| status | VARCHAR(50) | |

#### order_items
| Column | Type | Notes |
| ------ | ---- | ----- |
| id | SERIAL | Primary key |
| order_id | INTEGER | FK → orders |
| item_id | INTEGER | FK → menu_items |
| price | NUMERIC(10,2) | Price at time of order |
| first_name | VARCHAR(100) | Guest first name |
| notes | TEXT | Special instructions |

#### films
| Column | Type | Notes |
| ------ | ---- | ----- |
| id | INTEGER | Primary key |
| title | VARCHAR(255) | |
| homepage | VARCHAR(500) | |
| release_date | TIMESTAMPTZ | |
| overview | TEXT | |
| poster_path | VARCHAR(500) | |
| runtime | INTEGER | Minutes |
| tagline | VARCHAR(500) | |
| popularity | NUMERIC(6,2) | |
| imdb_id | VARCHAR(50) | |
| vote_average | NUMERIC(4,2) | |
| vote_count | INTEGER | |

#### theaters
| Column | Type | Notes |
| ------ | ---- | ----- |
| id | INTEGER | Primary key |
| name | VARCHAR(255) | |

#### theater_tables
| Column | Type | Notes |
| ------ | ---- | ----- |
| id | INTEGER | Primary key |
| theater_id | INTEGER | FK → theaters |
| table_number | INTEGER | |
| row | INTEGER | Grid position |
| col | INTEGER | Grid position |

#### theater_seats
| Column | Type | Notes |
| ------ | ---- | ----- |
| id | INTEGER | Primary key |
| table_id | INTEGER | FK → theater_tables |
| seat_number | INTEGER | |
| price | NUMERIC(10,2) | |

#### showings
| Column | Type | Notes |
| ------ | ---- | ----- |
| id | INTEGER | Primary key |
| film_id | INTEGER | FK → films |
| theater_id | INTEGER | FK → theaters |
| showing_time | TIMESTAMPTZ | |

#### reservations
| Column | Type | Notes |
| ------ | ---- | ----- |
| id | INTEGER | Primary key |
| showing_id | INTEGER | FK → showings |
| seat_id | INTEGER | FK → theater_seats |
| user_id | INTEGER | FK → users (optional) |
| payment_key | VARCHAR(100) | |
