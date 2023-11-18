import Chance from 'chance';
import fs from 'fs';

// Config values
const dbFileName = "./database.json";
const imageServer = `http://localhost:3008`;
const startingUserId = 1077;
const howManyUsers = 100;
const howManyMenuItems = 20;
const startingOrderId = 20123;
const howManyOldOrders = 200;
const howManyNewOrders = 20;
const startingReservationId = 8573;
const daysToSchedule = 10;
const oneDayInMS = 24 * 60 * 60 * 1000;
const todayInMS = (new Date()).getTime();
const yesterdayInMS = todayInMS - oneDayInMS;

// Utility functions
String.prototype.toTitleCase = function () { return this.charAt(0).toLocaleUpperCase() + this.substring(1) };
const loadFromJSON = (filename) => JSON.parse(fs.readFileSync(filename));

// Setup
const chance = Chance.Chance();
const foodImageFiles = fs.readdirSync('./public/images/food');
const initialMenuItems = loadFromJSON('./initial_data/menuItems.json');
const initialUsers = loadFromJSON('./initial_data/users.json');
const initialOrders = loadFromJSON('./initial_data/orders.json');
const categories = loadFromJSON('./initial_data/categories.json');
const films = loadFromJSON('./initial_data/films.json');
const theaters = loadFromJSON('./initial_data/theaters.json');
const db = {};

// Create some users
db.users = [];
db.users.push(...initialUsers);
for (let i = startingUserId; i <= startingUserId + howManyUsers; i++) {
  db.users.push(makeRandomUser(i))
}

// Load categories
db.categories = categories;

// Create menu items
db.menuItems = []
db.menuItems.push(...initialMenuItems);
for (let i = db.menuItems.length + 1; i <= howManyMenuItems; i++) {
  db.menuItems.push(makeMenuItem(i));
}

// Create orders
db.orders = [];
db.orders.push(...initialOrders);
for (let order of db.orders) {
  if (order.status !== "completed") {
    order.orderTime = ((new Date()) - Math.floor(Math.random() * 30 * 60 * 1000)); // Random time in the last 30 minutes
  }
}
for (let i = startingOrderId; i < startingOrderId + howManyOldOrders; i++) {
  db.orders.push(makeOldOrder(i));
}
for (let i = startingOrderId + howManyOldOrders; i < startingOrderId + howManyOldOrders + howManyNewOrders; i++) {
  db.orders.push(makeNewOrder(i));
}

// Create films
db.films = makeFilms(films);

// Create theaters
db.theaters = theaters;

// Create tables and add them to theaters
db.theaters = addTablesToTheaters(db.theaters);

// Create seats
db.theaters = addSeatsToTheaters(db.theaters);

// Create showings
db.showings = makeShowings(db.films, db.theaters);

// Create reservations
db.reservations = makeReservations(db.users, db.theaters, db.showings)

// save database file
fs.writeFileSync(dbFileName, JSON.stringify(db, null, 2))
//////////////////////////////////////////////////////////////
// Functions
//////////////////////////////////////////////////////////////

function makeOrder(id, type) {
  // get a random user, 
  const user = db.users[Math.floor(Math.random() * db.users.length)];
  // pick a random number between 1 and 6 for the number of items on the order, 
  const numberOfMenuItemsOrdered = Math.floor(Math.random() * 6) + 1;
  const items = [];
  for (let i = 1; i <= numberOfMenuItemsOrdered; i++) {
    const menuItem = db.menuItems[Math.floor(Math.random() * db.menuItems.length)];
    const item = {
      id: i,
      itemId: menuItem.id,
      price: menuItem.price,
      notes: Math.random() > .67 ? chance.sentence() : undefined, // Only occasionally have a note
      firstName: chance.first(),
    };
    items.push(item);
  }
  const subTotal = items.reduce((prevTotal, currItem) => prevTotal + +currItem.price, 0);
  let orderTime;
  if (type === "old") {
    orderTime = ((new Date()) - Math.floor(Math.random() * 6 * 30 * 24 * 60 * 60 * 1000)); // Random time in the last 6 months
  } else {
    orderTime = ((new Date()) - Math.floor(Math.random() * 30 * 60 * 1000)); // Random time in the last 30 minutes
  }
  let order = {
    id,
    userId: user.id,
    orderTime: new Date(orderTime),
    pickupTime: new Date(orderTime + Math.floor(Math.random() * 15 * 60 * 1000)), // Randomly up to 15 minutes after order time
    area: `Theater ${Math.floor(Math.random() * 6) + 1}`, // Random theater number between 1 and 6
    location: `Table ${Math.floor(Math.random() * 50) + 1}`,  // Random table number between 1 and 50
    tax: +(subTotal * 0.0825).toFixed(2), // 8.25% tax
    tip: +(subTotal * 0.20).toFixed(2),  // 20% tip
    creditCard: { ...user.creditCard, cvv: Math.floor(Math.random() * 900) + 100 },  // Random number between 100&999
    items,
    status: "completed",
  }
  // New orders aren't picked up yet.
  if (type === "new")
    order = { ...order, pickupTime: undefined, status: "new" };
  return order;
}
function makeOldOrder(id) {
  return makeOrder(id, "old");
}
function makeNewOrder(id) {
  return makeOrder(id, "new");
}
function makeMenuItem(id) {
  const menuItem = {
    id,
    name: `${chance.word().toTitleCase()} ${chance.word().toTitleCase()}`,
    description: chance.paragraph({ sentences: Math.floor(Math.random() * 3) }),
    category: categories[Math.floor(Math.random() * categories.length)],
    price: +(Math.random() * 12 + 3).toFixed(2),
    imageUrl: `${imageServer}/images/food/${foodImageFiles[Math.floor(Math.random() * foodImageFiles.length)]}`,
    available: true,
  }
  return menuItem;
}
function makeRandomUser(id = 0) {
  const gender = chance.gender().toLowerCase();
  const first = chance.first({ gender });
  const last = chance.last();
  const biggestImageNumber = 110;
  const randomImageNumber = Math.floor(Math.random() * biggestImageNumber);
  const ccType = chance.cc_type();
  const expiryMonth = Math.floor(Math.random() * 12) + 1;
  const expiryYear = new Date().getFullYear() + Math.floor(Math.random() * 5) + 1;
  const card = { PAN: chance.cc({ type: ccType }), expiryMonth, expiryYear };
  const person = {
    id,
    username: `${first.charAt(0).toLowerCase()
      }.${last.toLowerCase()}`,
    password: "pass",
    first,
    last,
    phone: chance.phone(),
    email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    imageUrl: `https://minimaltoolkit.com/images/randomdata/${gender}/${randomImageNumber}.jpg`,
    creditCard: card,
    adminUser: false,
  }
  return person;
}
function makeFilms(films) {
  return films.map(f => ({ ...f, runtime: getRandomRuntimeBetween(90, 150), release_date: getRecentDate(20) }));
}
function addTablesToTheaters(theaters) {
  let id = 1; let rows = 3; let columns = 5;
  for (let theater of theaters) {
    theater.tables = [];
    let table_number = 1;
    for (let x = 1; x <= rows; x++) {
      for (let y = 1; y <= columns; y++) {
        const table = { id: id++, table_number, row: x, column: y };
        theater.tables.push(table)
        table_number++;
      }
    }
  }
  return theaters;
}
function addSeatsToTheaters(theaters) {
  // Each table will have 1, 2, or 4 seats.
  // Loop through each table and pick one of those numbers
  const numbersOfSeatsArray = [1, 2, 4];
  let id = 1;
  for (let theater of theaters) {
    for (let table of theater.tables) {
      table.seats = [];
      const numberOfSeatsAtThisTable = numbersOfSeatsArray[Math.floor(Math.random() * numbersOfSeatsArray.length)];
      for (let seat_number = 1; seat_number <= numberOfSeatsAtThisTable; seat_number++) {
        const seat = { id, table_id: table._id, seat_number, price: 10.75 };
        table.seats.push(seat); // Add this seat to the table.
        id++;
      }
    }
  }
  return theaters
}
function makeShowings(films, theaters) {
  // Need to have films created and theaters created when this runs: it loops through both of those,
  // creating multiple showings of a film in each theater.
  const showings = [];
  let showingId = 1;
  for (let [index, film] of films.entries()) {
    // If there's no theater, skip this film. This will happen if we have more films than theaters
    if (!theaters[index]) continue;
    const theater_id = theaters[index].id
    // Create a daily schedule for the next X days
    const lastDayInMS = todayInMS + daysToSchedule * oneDayInMS;
    for (let day = yesterdayInMS; day <= lastDayInMS; day += oneDayInMS) {
      const theDay = new Date(day).setHours(0, 0, 0, 0);
      const midnightLocalTime = new Date(day).setHours(23, 59);
      //console.log(`Showing Times:`, film.id, randomStartTime, midnightLocalTime)
      for (let showing_time = getRandomStartTime(theDay, 11, 14); showing_time < midnightLocalTime; showing_time = getNextStartingTime(showing_time, film.runtime)) {
        const showing = { id: showingId++, film_id: film.id, theater_id, showing_time };
        showings.push(showing);
      }
    }
  }
  return showings;
}
function makeReservations(users, theaters, showings) {
  const reservations = [];
  let id = startingReservationId;
  // Loop through each seat for each showing.
  for (let showing of showings) {
    // Today's shows should be about 90% filled. Tomorrow's 80%, next day 70%, etc.
    const numOfDaysUntilShowing = (showing.showing_time - todayInMS) / oneDayInMS;
    const percentFull = (9 - numOfDaysUntilShowing) * 0.1;
    const theater = theaters.find(t => t.id === showing.theater_id);
    for (let table of theater.tables) {
      for (let seat of table.seats) {
        const reserved = (Math.random() + percentFull) > 1;
        if (reserved) {
          // Get a random, but real user
          const user = users[Math.floor(Math.random() * users.length)]
          const payment_key = getRandomPaymentKey();
          const reservation = { id, showing_id: showing.id, seat_id: seat.id, user_id: user.id, payment_key, };
          reservations.push(reservation);
          id++;
        }
      }
    }
  }
  return reservations;
}

//////////////////////////////////////////////////////////////
// Utility/Support functions
//////////////////////////////////////////////////////////////
function getRandomPaymentKey() {
  return `pk_${Math.random().toString().slice(2, 12)}`;
}
function getRandomRuntimeBetween(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}
function getRecentDate(withinDays) {
  const milliseconds = (Math.random() * withinDays) * 24 * 60 * 60 * 1000;
  const recentDate = Date.now() - milliseconds;
  return new Date(recentDate);
}
// Returns a *UTC* time between the *local* hours passed in.
function getRandomStartTime(date, earliestHour, latestHour) {
  let newDate = new Date(date);
  //const tzOffsetInMS = newDate.getTimezoneOffset() * 60 * 1000;
  const tzOffsetInMS = 0;
  const minutes = [0, 15, 30, 45];
  const randomHour = Math.floor(Math.random() * (latestHour - earliestHour) + earliestHour);
  const randomMinutes = minutes[Math.floor(Math.random() * minutes.length)];
  newDate.setHours(randomHour, randomMinutes);
  newDate = new Date(newDate.getTime() + tzOffsetInMS);
  return newDate;
}
function getNextStartingTime(lastStartingTime, runtimeinMinutes = 90) {
  const endTimeInMS = lastStartingTime.getTime() + runtimeinMinutes * 60 * 1000;
  const nextStartingTime = new Date(endTimeInMS);
  const minutes = nextStartingTime.getMinutes();
  if (minutes < 15)
    nextStartingTime.setMinutes(15, 0, 0);
  else if (minutes < 30)
    nextStartingTime.setMinutes(30);
  else if (minutes < 45)
    nextStartingTime.setMinutes(45);
  else {
    const hour = nextStartingTime.getHours() + 1;
    nextStartingTime.setHours(hour, 0, 0, 0);
  }
  return nextStartingTime;
}