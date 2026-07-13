import { Router } from 'express';
import { offProductToFood, hasCompleteBasisMacros, isOffProductFound } from '../lib/nutrition.js';

const router = Router();

const OFF_USER_AGENT = 'year28-macros/1.0 (https://github.com/papitomesyza/ciapp)';
const PRODUCT_FIELDS = 'code,product_name,generic_name,brands,nutriments,serving_size,serving_quantity,image_front_small_url,image_small_url';

// Open Food Facts' legacy /cgi/search.pl endpoint has been deprecated and
// returns 503 globally — text search now goes through their Search-a-licious
// service instead. Barcode lookups still use the v2 product endpoint below.
const SEARCH_BASE_URL = 'https://search.openfoodfacts.org/search';

function extractHits(data) {
  // Map defensively: prefer the documented `hits` field, but tolerate the
  // service returning a differently-named results array without crashing.
  if (Array.isArray(data?.hits)) return data.hits;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.products)) return data.products;
  return null;
}

router.get('/search', async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (!query) return res.json([]);

  const url = new URL(SEARCH_BASE_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('page_size', '20');
  url.searchParams.set('langs', 'en');
  url.searchParams.set('fields', PRODUCT_FIELDS);

  try {
    const response = await fetch(url, { headers: { 'User-Agent': OFF_USER_AGENT, Accept: 'application/json' } });
    if (!response.ok) return res.status(502).json({ error: 'food search is unavailable right now' });

    const data = await response.json();
    const hits = extractHits(data);
    if (hits === null) return res.status(502).json({ error: 'food search is unavailable right now' });

    const results = hits
      .filter((p) => p && p.product_name)
      .map((product) => ({
        ...offProductToFood(product),
        macros_complete: hasCompleteBasisMacros(product.nutriments || {}),
      }))
      .filter((f) => f.per100g.calories > 0 || f.per100g.protein_g > 0 || f.per100g.carbs_g > 0 || f.per100g.fat_g > 0);

    res.json(results);
  } catch (err) {
    res.status(502).json({ error: 'food search is unavailable right now' });
  }
});

router.get('/barcode/:code', async (req, res) => {
  const code = String(req.params.code || '').trim();
  if (!code) return res.status(400).json({ error: 'barcode is required' });

  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${PRODUCT_FIELDS}`;

  try {
    const response = await fetch(url, { headers: { 'User-Agent': OFF_USER_AGENT, Accept: 'application/json' } });
    if (!response.ok) return res.status(502).json({ error: 'barcode lookup is unavailable right now' });

    const data = await response.json();
    if (!isOffProductFound(data)) {
      return res.status(404).json({ error: 'no product found for that barcode' });
    }
    res.json(offProductToFood(data.product));
  } catch (err) {
    res.status(502).json({ error: 'barcode lookup is unavailable right now' });
  }
});

export default router;
