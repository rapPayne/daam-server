
export const loggingMiddleware = (req, res, next) => {
  console.log('*'.repeat(80))
  console.log(`Request: ${req.method} ${req.url}`)
  next();
}