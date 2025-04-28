
export const delayMiddleware = (delay) =>
  (req, res, next) => {
    console.log(`Delaying ${delay} ms`)
    setTimeout(next, delay);
  }