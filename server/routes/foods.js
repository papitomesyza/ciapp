import { Router } from 'express';
import { offProductToFood } from '../lib/nutrition.js';

const router = Router();

const OFF_USER_AGENT = 'year28-macros/1.0 (personal nutrition tracker; https://github.com)';
const SEARCH_FIELDS = 'code,product_name,generic_name,brands,nutriments,serving_size,serving_quantity,image_front_small_url,image_small_url';

router.get('/search', async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (!query) return res.json([]);

  const url = new URL('https://world.openfoodfacts.org/cgi/search.pl');
  url.searchParams.set('search_terms', query);
  url.searchParams.set('search_simple', '1');
  url.searchParams.set('action', 'process');
  url.searchParams.set('json', '1');
  url.searchParams.set('page_size', '20');
  url.searchParams.set('fields', SEARCH_FIELDS);

  try {
    const response = await fetch(url, { headers: { 'User-Agent': OFF_USER_AGENT } });
    if (!response.ok) return res.status(502).json({ error: 'food search is unavailable right now' });
    const data = await response.json();
    const products = Array.isArray(data.products) ? data.products : [];
    const results = products
      .filter((p) => p.product_name)
      .map(offProductToFood)
      .filter((f) => f.per100g.calories > 0 || f.per100g.protein_g > 0 || f.per100g.carbs_g > 0 || f.per100g.fat_g > 0);
    res.json(results);
  } catch (err) {
    res.status(502).json({ error: 'food search is unavailable right now' });
  }
});

router.get('/barcode/:code', async (req, res) => {
  const code = String(req.params.code || '').trim();
  if (!code) return res.status(400).json({ error: 'barcode is required' });

  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${SEARCH_FIELDS}`;

  try {
    const response = await fetch(url, { headers: { 'User-Agent': OFF_USER_AGENT } });
    if (!response.ok) return res.status(502).json({ error: 'barcode lookup is unavailable right now' });
    const data = await response.json();
    if (data.status !== 1 || !data.product) {
      return res.status(404).json({ error: 'no product found for that barcode' });
    }
    res.json(offProductToFood(data.product));
  } catch (err) {
    res.status(502).json({ error: 'barcode lookup is unavailable right now' });
  }
});

export default router;
