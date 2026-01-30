export default function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  if (res.headersSent) {
    return next(err);
  }
  const status = err && err.status ? err.status : 500;
  res.status(status);
  if (req.accepts('json')) {
    return res.json({ error: err && err.message ? err.message : 'Internal Server Error' });
  }
  if (req.accepts('html')) {
    const errorPage = new URL('../public/500.html', import.meta.url).pathname;
    try {
      return res.sendFile(errorPage);
    } catch {
      return res.type('txt').send('Internal Server Error');
    }
  }
  return res.type('txt').send(err && err.message ? err.message : 'Internal Server Error');
}

