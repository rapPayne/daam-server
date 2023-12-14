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
 */
const getReservationRoute = (req, res) => {
  let user = req.user;
  let reservationId = req.params.id;
  console.log(`Gettting a single reservation ${reservationId}. user id is ${user?.id}`);
  if (!user && !req.skipAuth) {
    res.status(401).send("Please log in before trying to view your reservation")
    return;
  }
  const reservations = readDatabase().reservations;
  const reservation = reservations.find(r => r.id === +reservationId);
  if (!reservation) {
    res.status(404).send(`Reservation ${reservationId} not found`);
    return;
  }
  if (req.skipAuth || user?.adminUser || reservation?.userId === +user?.id)
    res.send(reservation);
  else {
    res.status(403).send("That's not your reservation. You can't see it.")
  }
}

const getNextReservationId = (reservations) =>
  reservations.reduce((prev, curr) => (prev > curr.id) ? prev : curr.id, 0) + 1;

