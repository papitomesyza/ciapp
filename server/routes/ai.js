import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You log food entries from casual, plain-English descriptions of what someone ate.

Output STRICT JSON only — no prose, no markdown code fences, no commentary before or after. The entire response must be a single JSON array.

Each element describes one food item and must have exactly these fields:
{
  "name": string,
  "quantity": number,
  "unit": string,
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "fiber_g": number,
  "sugar_g": number,
  "sodium_mg": number,
  "sat_fat_g": number
}

Estimate reasonable macro values for the stated quantity using typical nutrition data. Split multi-item descriptions into separate array elements. If nothing edible is mentioned, return an empty array [].`;

function stripCodeFences(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '');
  }
  return cleaned.trim();
}

const NUMERIC_FIELDS = ['quantity', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g', 'sodium_mg', 'sat_fat_g'];

function sanitizeItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.name !== 'string' || !raw.name.trim()) return null;
  const item = { name: raw.name.trim().slice(0, 200), unit: typeof raw.unit === 'string' ? raw.unit.slice(0, 20) : 'serving' };
  for (const field of NUMERIC_FIELDS) {
    const n = Number(raw[field]);
    item[field] = Number.isFinite(n) && n >= 0 ? n : 0;
  }
  return item;
}

router.post('/parse', async (req, res) => {
  const text = String(req.body?.text || '').trim();
  if (!text) return res.status(400).json({ error: 'text is required' });
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'AI logging is not configured on this server' });
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1536,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: text }],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    const raw = stripCodeFences(textBlock?.text || '[]');

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(200).json({ items: [], error: 'could not parse a response — try rephrasing' });
    }

    if (!Array.isArray(parsed)) {
      return res.status(200).json({ items: [], error: 'unexpected response format' });
    }

    const items = parsed.map(sanitizeItem).filter(Boolean);
    res.json({ items });
  } catch (err) {
    res.status(502).json({ items: [], error: 'AI logging is unavailable right now' });
  }
});

export default router;
