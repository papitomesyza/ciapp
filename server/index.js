import 'dotenv/config';
import './guard.js';
import express from 'express';
import compression from 'compression';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { requireAuth } from './auth.js';
import authRoutes from './routes/auth.js';
import entriesRoutes from './routes/entries.js';
import targetsRoutes from './routes/targets.js';
import favoritesRoutes from './routes/favorites.js';
import customFoodsRoutes from './routes/customFoods.js';
import foodsRoutes from './routes/foods.js';
import aiRoutes from './routes/ai.js';
import summaryRoutes from './routes/summary.js';
import historyRoutes from './routes/history.js';
import habitsRoutes from './routes/habits.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = express();
// Zeabur runs a single reverse proxy in front of the app; trusting exactly
// one hop lets express-rate-limit read the real client IP from X-Forwarded-For
// without tripping its permissive-trust-proxy validation error.
app.set('trust proxy', 1);
app.use(compression());
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/foods', requireAuth, foodsRoutes);
app.use('/api/ai', requireAuth, aiRoutes);
app.use('/api/entries', requireAuth, entriesRoutes);
app.use('/api/targets', requireAuth, targetsRoutes);
app.use('/api/favorites', requireAuth, favoritesRoutes);
app.use('/api/custom-foods', requireAuth, customFoodsRoutes);
app.use('/api/summary', requireAuth, summaryRoutes);
app.use('/api/history', requireAuth, historyRoutes);
app.use('/api/habits', requireAuth, habitsRoutes);

const distDir = path.join(__dirname, '..', 'dist');
app.use(express.static(distDir));
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`year28 Macros server listening on port ${PORT}`);
});
