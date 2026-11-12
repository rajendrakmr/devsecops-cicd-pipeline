const express = require('express');
const helmet = require('helmet');

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/greet/:name', (req, res) => {
  const name = String(req.params.name).replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 50);
  res.json({ message: `Hello, ${name}!` });
});

module.exports = app;
