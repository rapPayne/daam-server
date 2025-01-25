// need cookieParser middleware before we can do anything with cookies
import { readDatabase, saveDatabase } from '../repository.mjs';
import jwt from 'jsonwebtoken';
const jwtSecret = "This is the daam-jwt-secret-key! Oooooooh!"

/**
 * This middleware should be run on every request.
 * If the request has an authorization header, decode the JWT token and store the user in req.user.
 * Then, subsequent sensitive functions can just check req.user for authorization.
 * @param {function} app The express app itself
 */
export function authRouter(app) {
  app.use((req, res, next) => {
    // check if client sent our JWT token in the 'authorization' header.
    const authHeader = req.headers['authorization'];
    const jwtToken = authHeader && authHeader.split(' ')[1];
    // Get the username/data from the jwtToken and put it in req.user
    jwt.verify(jwtToken, jwtSecret, (err, user) => {
      if (err) {
        console.warn("No user found")
        return; // user isn't validated
      }
      req.user = user;
    });
    next();
  });

  // Middleware to skip auth for certain routes
  app.use((req, res, next) => {
    if (app.skipAuth)
      req.skipAuth = true;
    next();
  });

  // POST /login - if good username/password, write an auth token.
  app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const db = readDatabase();
    const users = db.users;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      const jwtToken = makeJwtToken(user)
      res.header('Authorization', `Bearer ${jwtToken}`);
      res.status(200).send({ ...user, password: "****" });
    } else {
      res.status(401).send("Bad username or password");
    }
  });

  // POST /register 
  app.post("/register", (req, res) => {
    const newUser = req.body;
    const { username, password, email, first, last, phone, credit_card } = newUser;
    console.log('hit register', username, password)

    if (!username || !password) {
      res.status(401).send(`Username and password are needed to register`);
      return;
    }
    const db = readDatabase();
    const { users } = db;

    let user;
    user = users.find(u => u.username === username);
    if (user) {
      res.status(400).send(`${username} already exists. Login or register with a different username.`);
      return;
    }
    user = users.find(u => u.email === email);
    if (user) {
      res.status(400).send(`${email} already exists. Login or register with a different email.`);
      return;
    }

    user = { id: getNextUserId(users), ...newUser, adminUser: false, isServer: false };

    db.users.push(user);
    saveDatabase(db);

    const jwtToken = makeJwtToken({ ...user, password: "***" });
    res.header('Authorization', `Bearer ${jwtToken}`);
    res.status(200).send({ ...user, password: "***" });
  });

  // POST /account
  /**
   * For updating an existing account */
  app.patch("/account/:id", (req, res) => {
    let userId = +req.params.id;
    let user = req.user;  // Get the authenticated user (set in the auth middleware from JWT)
    console.log("Updating account info for user", userId);
    if (!user && !req.skipAuth) {
      res.status(403).send("Please log in before trying to update your account info")
      return;
    }
    if ((user?.id !== userId) && !req.skipAuth) {
      res.status(401).send(`You can only update info for account ${user?.id}`)
      return;
    }

    const updatedUser = req.body;

    const db = readDatabase();

    let oldUser = db.users.find(u => u.id === userId);
    if (!oldUser) {
      res.status(400).send(`User ${userId} doesn't exist. Try again with your user id`);
      return;
    }

    let newUser = {
      ...oldUser,
      username: updatedUser.username, //TODO: Make sure username isn't already taken
      password: updatedUser.password, //TODO: hash the password
      email: updatedUser.email, //TODO: Make sure email isn't already taken
      phone: updatedUser.phone, //TODO: Make sure phone isn't already taken
      first: updatedUser.first,
      last: updatedUser.last,
      imageUrl: updatedUser.imageUrl,
      credit_card: {
        pan: updatedUser.pan,
        expiryMonth: updatedUser.expiryMonth,
        expiryYear: updatedUser.expiryYear,
      },
      // NOTE: Do not change adminUser or isServer here or any user can self-promote.
    }
    db.users = db.users.map(user => user.id === userId ? newUser : user); // Replace existing user with modified user

    saveDatabase(db);

    // const jwtToken = makeJwtToken({ ...user, password: "***" });
    // res.header('Authorization', `Bearer ${jwtToken}`);
    res.status(200).send({ ...newUser, password: "***" });
  });
}

function makeJwtToken(user) {
  return jwt.sign({ ...user, password: "***" }, jwtSecret);
}

export const getNextUserId = (users) =>
  users.reduce((prev, curr) => (prev > curr.id) ? prev : curr.id, 0) + 1;
