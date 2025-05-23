// This is for ordering FOOD items.
// Reserving tickets is in reservations.router.mjs
import { readDatabase, saveDatabase } from '../repository.mjs';

export const orderRouter = (app) => {
  app.get("/orders", getOrdersRoute);
  app.get("/orders/current", getCurrentOrdersRoute);
  app.get("/orders/:id", getOrderRoute);
  app.post("/placeOrder", placeOrderRoute);
}

const placeOrderRoute = (req, res) => {
  let user = req.user;
  console.log("placing order", req.body);
  // if (!user) {
  //   res.status(403).send("Please log in before trying to place a new order")
  //   return;
  // }
  const db = readDatabase();
  //Process into a real order
  const orderId = getNextOrderId(db.orders)
  //TODO: expiry must be in the future
  //TODO: pretend to validate the credit card (use Luhn's?)
  const creditCardWithoutCvv = {
    pan: req.body.pan,
    expiryMonth: req.body.expiryMonth,
    expiryYear: req.body.expiryYear,
  }
  const newOrder = {
    id: orderId,
    userId: user?.id,
    orderTime: new Date(),
    location: req.body.location,
    area: req.body.area,
    tax: calculateTax(req.body),
    tip: req.body.tip,
    creditCard: creditCardWithoutCvv,
    status: "new",
    items: (req.body.items ?? req.body.cart ?? []).map(item => ({
      id: item.id,
      itemId: item.itemId, // The menuItem's id
      name: item.name,
      price: item.price,
      notes: item.notes,
      firstName: item.firstName,  // Who this food item is for
    })),
  };
  //Add to the database
  db.orders.push(newOrder);
  saveDatabase(db);
  res.status(200).send({ message: "Order placed", id: orderId });
}

/**
 * Gets a single order by id. Appends the full menuItems to the order.
 */
const getOrderRoute = (req, res) => {
  let user = req.user;
  let orderId = req.params.id;
  console.log(`Gettting a single order ${orderId}. user id is ${user?.id}`);
  if (!user && !req.skipAuth) {
    res.status(403).send("Please log in before trying to view your order")
    return;
  }
  const orders = readDatabase().orders;
  const order = orders.find(o => o.id === +orderId);
  if (!order) {
    res.status(404).send("Order not found");
    return;
  }
  const menuItems = readDatabase().menuItems;
  order.items = order.items?.map(item => ({
    ...item, ...menuItems.find(mi => mi.id === item.itemId), id: item.id  // id added at the end bc the menuitem clobbers it
  }));
  if (req.skipAuth || user?.adminUser || user?.isServer || order?.userId === +user?.id)
    res.send(order);
  else {
    res.status(403).send("That's not your order. You can't see it.")
  }
}

/**
 * All orders that are not complete from all users. This is great
 * for managers, servers, and the kitchen.
 */
const getCurrentOrdersRoute = (req, res) => {
  let user = req.user;
  console.log("user id is", user?.id)
  if (!req.skipAuth && !user) {
    res.status(403).send("Please log in before trying to view orders")
    return;
  }
  const orders = readDatabase().orders.filter(o => o.status !== "completed");
  if (req.skipAuth || user?.adminUser || user?.isServer)
    res.send(orders);
  else {
    res.send(orders.filter(o => o.userId === +user?.id))
  }
}

/**
 * Orders for the current user. If the user is an admin user, it
 * returns all orders for all users.
 */
const getOrdersRoute = (req, res) => {
  let user = req.user;
  if (!req.skipAuth && !user) {
    res.status(403).send();
    return;
  }
  const orders = readDatabase().orders;
  if (req.skipAuth || user?.adminUser || user?.isServer)
    res.send(orders);
  else {
    res.send(orders.filter(o => o.userId === +user?.id))
  }
}


const getNextOrderId = (orders) =>
  orders.reduce((prev, curr) => (prev > curr.id) ? prev : curr.id, 0) + 1;

function calculateTax(order) {
  return (order.items ?? order.cart ?? []).reduce((acc, item) => acc + item.price, 0) * .0825;
}
