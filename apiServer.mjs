import process from 'process';
import jsonServer from 'json-server';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { loggingMiddleware } from './middlewares/logging-middleware.mjs';
import { authRouter } from './middlewares/authentication-middleware.mjs';
import { orderRouter } from './routers/order.router.mjs';
import { showingsRouter } from './routers/showings.router.mjs';
import { reservationsRouter } from './routers/reservations.router.mjs';
import { delayMiddleware } from './middlewares/delay-middleware.mjs';

const app = jsonServer.create()
const port = 3008;

// Process command line arguments
// We can choose to skip authorization to make development easier. Just add the --skipAuth flag when running.
const args = process.argv.slice(2);
let delay = 0;

args.forEach((arg, index) => {
  if (arg === '--skipAuth' || arg === '-s') {
    app.skipAuth = true;
    console.warn('Skipping authorization. This is only for development purposes.');
  } else if (arg === '--delay' || arg === '-d') {
    const delayValue = parseInt(args[index + 1], 10);
    if (!isNaN(delayValue)) {
      delay = delayValue;
      console.warn(`Adding a ${delay} millisecond delay to all responses for debugging purposes.`);
    } else {
      console.warn('Invalid delay value. Using default delay of 0.');
    }
  }
});

const router = jsonServer.router('database.json')
const middlewares = jsonServer.defaults(); // noCors b/c cookies aren't written when CORS is set to '*'
//app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
app.use(cors({ origin: '*' }));
app.use(jsonServer.rewriter({ "/api/*": "/$1" }));

app.use(jsonServer.bodyParser)
app.use(loggingMiddleware)
if (delay > 0) app.use(delayMiddleware(delay))
app.use(middlewares)
app.use(cookieParser());

authRouter(app);
orderRouter(app);        // For food ordering
reservationsRouter(app); // For ticket ordering
showingsRouter(app);

app.use(router);

app.listen(port, () => {
  console.log(`API Server is running on port ${port}.`)
  console.log('Please keep it running during all lab exercises.')
});