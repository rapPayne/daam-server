# API data server

A RESTful server to serve data for the DAAM restaurant app.

To start it up:
```bash
npm install
npm run load-db
npm start
```
## To get data from it
Make GET requests using Postman or [Hoppscotch](http://hoppscotch.io) or [Api Dog](https://apidog.com). But you'll need to authenticate to get to certain orders and other things.

## To authenticate
Make a POST request to /login with {"username": ____, "password": "pass" }. (All passwords are pass until you decide to change them.)
- Servers are "server1", "server2", and "server3"
- Admin users are "admin", and "cmac"
- Regular users are "me", and all the other regular users whose usernames and passwords you can look up in the database.

### Bypassing security
Testing routes is tough when you have to log in before they work. So we've written a bypass. `npm run start` and `npm run watch` both start the server with all protections turned off. All routes are open without authentication.

### Enabling security
Run `node apiServer` without the --skipAuth flag.

## What you can fetch
Anything deployed to the [public](./public/) folder can be served as an asset. Notice that there's already some images in there. Put your html files, css files, and client-side JavaScript files in public. When requested with a GET request, they'll be served. Put an index.html file in there to get started.

You can also make API requests to get data served.

## Database collections
See [database.json](database.json) for the final structure. Here's a general layout.
### menuItems
| column      | type   | notes                            |
| ----------- | ------ | -------------------------------- |
| id          | number | Primary key                      |
| name        | string |                                  |
| description | string |                                  |
| category    | string | free-form                        |
| price       | number |                                  |
| imageUrl    | string |                                  |
| available   | bool   | false=doesn't appear on the menu |

TODO: Category should eventually be a collection/enum

### users
| column     | type   | notes                            |
| ---------- | ------ | -------------------------------- |
| id         | number | Primary key                      |
| email      | string | Also the username                |
| password   | string | Should be hashed but isn't       |
| first      | string |                                  |
| last       | string |                                  |
| phone      | string |                                  |
| imageUrl   | string | optional                         |
| creditCard | object | {PAN, expiryMonth, expiryYear}   |
| adminUser  | bool   | true=Has administrator privilege |

### oldOrders (GET, POST)
| column     | type      | notes                                                                                |
| ---------- | --------- | ------------------------------------------------------------------------------------ |
| id         | number    |                                                                                      |
| userId     | number    |                                                                                      |
| orderTime  | Date      |                                                                                      |
| pickupTime | Date      |                                                                                      |
| location   | string    | table or "doordash","ubereats", etc.                                                 |
| tax        | number    |                                                                                      |
| tip        | number    |                                                                                      |
| creditCard | {}        | {PAN: string, expiryMonth, expiryYear, cvv: string}                                  |
| items      | Array[{}] | {cartItemId: number, itemId: number, price: number, notes: string,firstName: string} |
  

## Endpoints

### login (POST)
### orders (GET, PATCH)
- authorization: only if user.isServer or user.adminUser or user.id === order.userId
### menuItems (GET)
### users (GET, PATCH)
- Authorization: Only if admin users only
- Authorization: Single user by that authenticated user only
### placeOrder (POST)
- POST: body is the entire cart
- Authenticated user only

## Order statuses
| status        | meaning                                       |
| ------------- | --------------------------------------------- |
| new           | Guest has placed the order                    |
| cooking       | Kitchen staff is prepping the order           |
| readyForGuest | Ready for servers to deliver to the guest     |
| pickedUp      | It looks accurate. I'm taking it to the guest |
| delivered     | Guest is happy with the order                 |
| problem       | The order has one or more issues              |
| completed     | Paid for. The order is closed.                |

Built on [json-server](https://github.com/typicode/json-server)
