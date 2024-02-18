// This is for ordering FILM TICKETS.
// Ordering food is in order.router.mjs
import { readDatabase, saveDatabase } from '../repository.mjs';

/**
  * A tickets purchase comes in like this:
    {
      "showing_id": 777,
      "seats": [7, 8, 10, 22],
      "first_name": "Jo",
      "last_name": "Smith",
      "email": "jo.smith@gmail.com",
      "phone": "555-555-1234",
      "pan": "6011-0087-7345-4323",
      "expiry_month": 1,
      "expiry_year": 2025,
      "cvv": 123,
    }
  * TODO: The cost should be looked up from the database. For now assume $10.75 per ticket.
  * Showing has the theater/tables so no need to submit that
  * 
  * A reservation looks like this:
    {
      "id": 8639,
      "showing_id": 2,
      "seat_id": 24,
      "user_id": 1079, (optional)
      "payment_key": "pk_8413510552"
    },
  * We will be sending back an array of these.
**/

export const reservationsRouter = (app) => {
  app.get("/reservations", getReservationsRoute);
  app.get("/reservations/:id", getReservationRoute);
  app.post("/buyTickets", buyTicketsRoute);
}

/**
 * Gets all reservations for a user.
 */
const getReservationsRoute = (req, res) => {
  let user = req.user;
  console.log("Getting reservations for user", user?.id);
  if (!user && !req.skipAuth) {
    res.status(403).send("Please log in before trying to view your reservations")
    return;
  }
  const reservations = readDatabase().reservations;
  if (user?.adminUser) {
    res.send(reservations);
    return;
  }
  if (user) {
    const userReservations = reservations.filter(r => r.user_id === user?.id);
    res.send(userReservations);
    return;
  }
  if (req.skipAuth) {
    res.send(reservations);
    return;
  }
}

/**
 * Purchases the seats. Adds each to the reservations collection.
 * Returns an array of ids
 */
const buyTicketsRoute = (req, res) => {
  let user = req.user;
  let showing_id = req.body.showing_id;
  console.log("Buying tickets", req.body);

  const db = readDatabase();
  // This is where you'd charge the card and get the payment key from Stripe
  const payment_key = `pk_${Math.random().toString().slice(2, 12)}` //Pretending to get this from Stripe

  //iterate each seat reserved
  const newReservations = req.body.seats?.map(seat_id => {
    const reservationId = getNextReservationId(db.reservations);
    //Process into a real reservation
    const newReservation = {
      id: reservationId,
      showing_id,
      seat_id,
      user_id: user?.id,
      payment_key,
    }
    db.reservations.push(newReservation);

    return newReservation;
  })

  //Add to the database
  saveDatabase(db);
  res.status(200).send(newReservations);
}

/**
 * Gets a single reservation by id. 
 * Each reservation looks like this:
 * {
  "id": 8573,
  "showing_id": 1,
  "seat_id": 2,
  "user_id": 1119,
  "payment_key": "pk_1693875942",
  "theater_name": "John Wayne Theater",
  "film": {
    "id": 1,
    "title": "Chunnel",
    "homepage": "http://chunnelmovie.com",
    "release_date": "2024-02-11T00:56:58.935Z",
    "overview": "Illuminating the darkest depths of international intrigue and personal sacrifice, 'Chunnel' takes you on a heart-pounding journey through the underbelly of the world's most vital tunnel. When a mysterious explosion rocks the Chunnel, trapping the U.S. President's daughter inside, the race against time begins. As rescuers tunnel their way through the wreckage, they unearth a web of conspiracies that threaten to reshape global politics. Unraveling the layers of deception becomes a gripping chess game, where every move could mean life or death. 'Chunnel' is not just a pulse-pounding thriller; it's a masterclass in suspense, leaving audiences at the edge of their seats, guessing until the final revelation. Get ready for a cinematic ride that will have you questioning alliances, unraveling secrets, and redefining the limits of human determination. The Chunnel holds more than just passengers; it harbors a tale of deception, bravery, and the resilience of the human spirit. Don't miss the tunnel of twists and turns that is 'Chunnel.'",
    "poster_path": "/images/posters/1.jpg",
    "runtime": 121,
    "tagline": "There's a war 100 meters below the English Channel",
    "popularity": 7.1,
    "imdb_id": "tt0137523",
    "vote_average": 6.2,
    "vote_count": 52
  },
  "showing": {
    "id": 1,
    "film_id": 1,
    "theater_id": 1,
    "showing_time": "2024-02-14T17:30:00.000Z"
  },
  "table_number": 1,
  "seat": {
    "id": 2,
    "seat_number": 1,
    "price": 10.75
  }
}
 */
const getReservationRoute = (req, res) => {
  let user = req.user;
  let reservationId = req.params.id;
  console.log(`Gettting a single reservation ${reservationId}. user id is ${user?.id}`);
  if (!user && !req.skipAuth) {
    res.status(401).send("Please log in before trying to view your reservation")
    return;
  }
  const database = readDatabase();
  const reservation = database.reservations.find(r => r.id === +reservationId);
  if (!reservation) {
    res.status(404).send(`Reservation ${reservationId} not found`);
    return;
  }
  // Get showing info
  const showing = database.showings.find(s => s.id === reservation.showing_id);
  // Get film info
  const film = database.films.find(f => f.id === showing.film_id);
  // Get theater info
  const theater = database.theaters.find(t => t.id === showing.theater_id);
  // Get the table
  const table = theater.tables.find(table => table.seats.flatMap(seat => seat).some(seat => seat.id = reservation.seat_id));
  // Get seat info
  const seat = table.seats.find(seat => seat.id === reservation.seat_id);
  if (req.skipAuth || user?.adminUser || reservation?.userId === +user?.id)
    res.send({ ...reservation, theater_name: theater.name, film, showing, table_number: table.table_number, seat });
  else {
    res.status(403).send("That's not your reservation. You can't see it.")
  }
}

const getNextReservationId = (reservations) =>
  reservations.reduce((prev, curr) => (prev > curr.id) ? prev : curr.id, 0) + 1;

