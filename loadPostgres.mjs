/**
 * loadPostgres.mjs
 *
 * Reads database.json and loads all data into a PostgreSQL database named "daam".
 * Normalizes nested structures (order items, theater tables/seats, credit cards, categories).
 *
 * Usage: node loadPostgres.mjs
 *
 * Environment variables (all optional, shown with defaults):
 *   PGHOST     - localhost
 *   PGPORT     - 5432
 *   PGUSER     - postgres
 *   PGPASSWORD - (empty)
 */

import { readFileSync } from 'fs'
import { createInterface } from 'readline'
import pg from 'pg'

const { Client } = pg

const DB_NAME = 'daam'

const pgConfig = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER || process.env.USER || 'postgres',
  password: process.env.PGPASSWORD || '',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer) }))
}

async function connectTo(database) {
  const client = new Client({ ...pgConfig, database })
  await client.connect()
  return client
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const CREATE_TABLES = `
CREATE TABLE categories (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE users (
  id              INTEGER PRIMARY KEY,
  username        VARCHAR(100) NOT NULL UNIQUE,
  password        VARCHAR(255) NOT NULL,
  first           VARCHAR(100),
  last            VARCHAR(100),
  email           VARCHAR(255) UNIQUE,
  phone           VARCHAR(50)  UNIQUE,
  image_url       VARCHAR(500),
  cc_pan          VARCHAR(50),
  cc_expiry_month INTEGER,
  cc_expiry_year  INTEGER,
  admin_user      BOOLEAN NOT NULL DEFAULT FALSE,
  is_server       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE menu_items (
  id          INTEGER PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES categories(id),
  price       NUMERIC(10,2) NOT NULL,
  image_url   VARCHAR(500),
  available   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE orders (
  id              INTEGER PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id),
  order_time      TIMESTAMPTZ,
  pickup_time     TIMESTAMPTZ,
  area            VARCHAR(100),
  location        VARCHAR(100),
  tax             NUMERIC(10,2),
  tip             NUMERIC(10,2),
  cc_pan          VARCHAR(50),
  cc_expiry_month INTEGER,
  cc_expiry_year  INTEGER,
  status          VARCHAR(50)
);

CREATE TABLE order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES orders(id),
  item_id    INTEGER REFERENCES menu_items(id),
  price      NUMERIC(10,2) NOT NULL,
  first_name VARCHAR(100),
  notes      TEXT
);

CREATE TABLE films (
  id           INTEGER PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  homepage     VARCHAR(500),
  release_date TIMESTAMPTZ,
  overview     TEXT,
  poster_path  VARCHAR(500),
  runtime      INTEGER,
  tagline      VARCHAR(500),
  popularity   NUMERIC(6,2),
  imdb_id      VARCHAR(50),
  vote_average NUMERIC(4,2),
  vote_count   INTEGER
);

CREATE TABLE theaters (
  id   INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE theater_tables (
  id           INTEGER PRIMARY KEY,
  theater_id   INTEGER NOT NULL REFERENCES theaters(id),
  table_number INTEGER NOT NULL,
  row          INTEGER,
  col          INTEGER
);

CREATE TABLE theater_seats (
  id          INTEGER PRIMARY KEY,
  table_id    INTEGER NOT NULL REFERENCES theater_tables(id),
  seat_number INTEGER NOT NULL,
  price       NUMERIC(10,2) NOT NULL
);

CREATE TABLE showings (
  id           INTEGER PRIMARY KEY,
  film_id      INTEGER NOT NULL REFERENCES films(id),
  theater_id   INTEGER NOT NULL REFERENCES theaters(id),
  showing_time TIMESTAMPTZ NOT NULL
);

CREATE TABLE reservations (
  id          INTEGER PRIMARY KEY,
  showing_id  INTEGER NOT NULL REFERENCES showings(id),
  seat_id     INTEGER NOT NULL REFERENCES theater_seats(id),
  user_id     INTEGER REFERENCES users(id),
  payment_key VARCHAR(100)
);
`

// ---------------------------------------------------------------------------
// Insertion helpers
// ---------------------------------------------------------------------------

async function insertCategories(client, categories) {
  const idMap = {}
  for (let i = 0; i < categories.length; i++) {
    const name = categories[i]
    const result = await client.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING id',
      [name]
    )
    idMap[name] = result.rows[0].id
  }
  return idMap
}

async function insertUsers(client, users) {
  for (const u of users) {
    await client.query(
      `INSERT INTO users
         (id, username, password, first, last, email, phone, image_url,
          cc_pan, cc_expiry_month, cc_expiry_year, admin_user, is_server)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        u.id, u.username, u.password, u.first ?? null, u.last ?? null,
        u.email ?? null, u.phone ?? null, u.imageUrl ?? null,
        u.creditCard?.pan ?? null,
        u.creditCard?.expiryMonth ?? null,
        u.creditCard?.expiryYear ?? null,
        u.adminUser ?? false,
        u.isServer ?? false,
      ]
    )
  }
}

async function insertMenuItems(client, menuItems, categoryIdMap) {
  for (const item of menuItems) {
    await client.query(
      `INSERT INTO menu_items (id, name, description, category_id, price, image_url, available)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        item.id, item.name, item.description ?? null,
        categoryIdMap[item.category] ?? null,
        item.price, item.imageUrl ?? null, item.available ?? true,
      ]
    )
  }
}

async function insertOrders(client, orders) {
  for (const order of orders) {
    await client.query(
      `INSERT INTO orders
         (id, user_id, order_time, pickup_time, area, location, tax, tip,
          cc_pan, cc_expiry_month, cc_expiry_year, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        order.id, order.userId ?? null,
        order.orderTime ?? null, order.pickupTime ?? null,
        order.area ?? null, order.location ?? null,
        order.tax ?? null, order.tip ?? null,
        order.creditCard?.pan ?? null,
        order.creditCard?.expiryMonth ?? null,
        order.creditCard?.expiryYear ?? null,
        order.status ?? null,
      ]
    )

    for (const item of (order.items || [])) {
      await client.query(
        `INSERT INTO order_items (order_id, item_id, price, first_name, notes)
         VALUES ($1,$2,$3,$4,$5)`,
        [order.id, item.itemId ?? null, item.price, item.firstName ?? null, item.notes ?? null]
      )
    }
  }
}

async function insertFilms(client, films) {
  for (const f of films) {
    await client.query(
      `INSERT INTO films
         (id, title, homepage, release_date, overview, poster_path, runtime,
          tagline, popularity, imdb_id, vote_average, vote_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        f.id, f.title, f.homepage ?? null, f.release_date ?? null,
        f.overview ?? null, f.poster_path ?? null, f.runtime ?? null,
        f.tagline ?? null, f.popularity ?? null, f.imdb_id ?? null,
        f.vote_average ?? null, f.vote_count ?? null,
      ]
    )
  }
}

async function insertTheaters(client, theaters) {
  for (const theater of theaters) {
    await client.query(
      'INSERT INTO theaters (id, name) VALUES ($1, $2)',
      [theater.id, theater.name]
    )

    for (const table of (theater.tables || [])) {
      await client.query(
        `INSERT INTO theater_tables (id, theater_id, table_number, row, col)
         VALUES ($1,$2,$3,$4,$5)`,
        [table.id, theater.id, table.table_number, table.row ?? null, table.column ?? null]
      )

      for (const seat of (table.seats || [])) {
        await client.query(
          `INSERT INTO theater_seats (id, table_id, seat_number, price)
           VALUES ($1,$2,$3,$4)`,
          [seat.id, table.id, seat.seat_number, seat.price]
        )
      }
    }
  }
}

async function insertShowings(client, showings) {
  for (const s of showings) {
    await client.query(
      `INSERT INTO showings (id, film_id, theater_id, showing_time)
       VALUES ($1,$2,$3,$4)`,
      [s.id, s.film_id, s.theater_id, s.showing_time]
    )
  }
}

async function insertReservations(client, reservations) {
  for (const r of reservations) {
    await client.query(
      `INSERT INTO reservations (id, showing_id, seat_id, user_id, payment_key)
       VALUES ($1,$2,$3,$4,$5)`,
      [r.id, r.showing_id, r.seat_id, r.user_id ?? null, r.payment_key ?? null]
    )
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\nConnecting to PostgreSQL at ${pgConfig.host}:${pgConfig.port} as "${pgConfig.user}"...`)

  // Connect to the default postgres database to manage the daam database
  let adminClient
  try {
    adminClient = await connectTo('postgres')
  } catch (err) {
    console.error(`\nFailed to connect to PostgreSQL: ${err.message}`)
    console.error('Make sure PostgreSQL is running and check your connection settings.')
    console.error('You can override defaults with: PGHOST, PGPORT, PGUSER, PGPASSWORD\n')
    process.exit(1)
  }

  // Check if the daam database already exists
  const existing = await adminClient.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`, [DB_NAME]
  )

  if (existing.rowCount > 0) {
    const answer = await ask(`\nDatabase "${DB_NAME}" already exists. Drop and recreate it? (yes/no): `)
    if (answer.trim().toLowerCase() !== 'yes') {
      console.log('Aborted.')
      await adminClient.end()
      process.exit(0)
    }
    await adminClient.query(`DROP DATABASE "${DB_NAME}"`)
    console.log(`Dropped database "${DB_NAME}".`)
  }

  await adminClient.query(`CREATE DATABASE "${DB_NAME}"`)
  console.log(`Created database "${DB_NAME}".`)
  await adminClient.end()

  // Connect to the new daam database
  const client = await connectTo(DB_NAME)

  try {
    console.log('Creating tables...')
    await client.query(CREATE_TABLES)

    console.log('Reading database.json...')
    const db = JSON.parse(readFileSync('database.json', 'utf8'))

    console.log('Inserting categories...')
    const categoryIdMap = await insertCategories(client, db.categories)

    console.log('Inserting users...')
    await insertUsers(client, db.users)

    console.log('Inserting menu items...')
    await insertMenuItems(client, db.menuItems, categoryIdMap)

    console.log('Inserting orders and order items...')
    await insertOrders(client, db.orders)

    console.log('Inserting films...')
    await insertFilms(client, db.films)

    console.log('Inserting theaters, tables, and seats...')
    await insertTheaters(client, db.theaters)

    console.log('Inserting showings...')
    await insertShowings(client, db.showings)

    console.log('Inserting reservations...')
    await insertReservations(client, db.reservations)

    console.log(`\nDone! Database "${DB_NAME}" is ready.\n`)
  } catch (err) {
    console.error('\nError during data load:', err.message)
    await client.end()
    process.exit(1)
  }

  await client.end()
}

main()
