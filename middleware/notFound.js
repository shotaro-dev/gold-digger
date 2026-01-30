import path from 'node:path';

const __dirname = import.meta.dirname;

export default function notFound(req, res) {
  const notFoundPage = path.join(__dirname, 'public', '404.html');
  res.status(404);
  if (req.accepts('html')) {
    try {
      // fs.existsSync を使わずパスを返して sendFile に任せる
      return res.sendFile(notFoundPage);
    } catch {
      return res.type('txt').send('404 Not Found');
    }
  }
  if (req.accepts('json')) {
    return res.json({ error: 'Not Found' });
  }
  return res.type('txt').send('Not Found');
}

