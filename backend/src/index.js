import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, note: 'Prisma removed; use Django backend at port 8000' });
});

app.get('/', (_req, res) => {
  res.send('Node placeholder server — Prisma removed. Use Django API at port 8000');
});

// All API routes return 501 to indicate they've moved to Django backend
app.all('/api/*', (_req, res) => {
  res.status(501).json({ error: 'Not implemented on Node backend. Use Django backend at http://localhost:8000/api/' });
});

app.listen(PORT, () => {
  console.log(`Placeholder Node server running on http://localhost:${PORT}`);
});
