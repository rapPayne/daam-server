import { readDatabase, saveDatabase } from '../repository.mjs';

export const showingsRouter = (app) => {
  // Remember, plain old showings routes for all verbs are satisfied by json-server itself
  app.get('/showings/:showing_id/reservations', getReservationsForAShowingRoute);
  app.get('/showings/:film_id/:date', getShowingsForAFilmIdAndDate);
}


// Return all reservations for a given showingId
const getReservationsForAShowingRoute = (req, res) => {
  // TODO: if this showing_id isn't a number, return a 400-series
  const showing_id = +req.params.showing_id;  // Convert the string to a number

  const databaseContents = readDatabase();
  res.json(databaseContents
    .reservations
    .filter(s => s.showing_id === showing_id)
  );
};

const getShowingsForAFilmIdAndDate = (req, res) => {
  // TODO: if this film_id isn't a number, return a 400-series
  const film_id = +req.params.film_id;  // Convert the string to a number
  // TODO: if date isn't a JS Date, return a 400-series
  const startTime = new Date(req.params.date);
  startTime.setHours(0);
  startTime.setMinutes(0);
  const endTime = new Date(req.params.date);
  endTime.setHours(23);
  endTime.setMinutes(59);
  console.log(film_id, startTime, endTime);

  //TODO: Handle errors
  const databaseContents = readDatabase();
  res.json(databaseContents
    .showings
    .filter(s => s.film_id === +film_id)
    .filter(s => new Date(s.showing_time) > startTime && new Date(s.showing_time) < endTime)
  );
};
