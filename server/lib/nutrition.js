// Shared helpers for normalizing external nutrition data into our per-100g shape
// and scaling a per-100g (or per-serving) basis to an amount actually eaten.

function n(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

// Converts an Open Food Facts `product.nutriments` object into calories/macros per 100g.
export function normalizeOffNutriments(nutriments = {}) {
  let sodiumMg;
  if (nutriments.sodium_100g !== undefined && nutriments.sodium_100g !== null) {
    sodiumMg = n(nutriments.sodium_100g) * 1000;
  } else if (nutriments.salt_100g !== undefined && nutriments.salt_100g !== null) {
    // salt (g) to sodium (g): sodium = salt / 2.5, then to mg.
    sodiumMg = (n(nutriments.salt_100g) / 2.5) * 1000;
  } else {
    sodiumMg = 0;
  }

  return {
    calories: n(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal']),
    protein_g: n(nutriments.proteins_100g),
    carbs_g: n(nutriments.carbohydrates_100g),
    fat_g: n(nutriments.fat_100g),
    fiber_g: n(nutriments.fiber_100g),
    sugar_g: n(nutriments.sugars_100g),
    sodium_mg: sodiumMg,
    sat_fat_g: n(nutriments['saturated-fat_100g']),
  };
}

// True only when the basis macros we actually rely on (calories, protein,
// carbs, fat) are present in the raw nutriments payload — not merely
// defaulted to 0 by normalizeOffNutriments. Used to decide whether a search
// result needs an authoritative re-fetch by barcode before logging.
export function hasCompleteBasisMacros(nutriments = {}) {
  const present = (key) => nutriments[key] !== undefined && nutriments[key] !== null;
  const hasEnergy = present('energy-kcal_100g') || present('energy-kcal');
  return hasEnergy && present('proteins_100g') && present('carbohydrates_100g') && present('fat_100g');
}

// OFF returns HTTP 200 for a barcode miss and can report status 1 with an
// empty product object — a product only counts as "found" when it actually
// carries a nutriments object.
export function isOffProductFound(data) {
  return !!data && data.status === 1 && !!data.product && typeof data.product === 'object'
    && !!data.product.nutriments && typeof data.product.nutriments === 'object';
}

export function offProductToFood(product) {
  const per100g = normalizeOffNutriments(product.nutriments || {});
  const servingQuantity = Number(product.serving_quantity);
  return {
    name: product.product_name || product.generic_name || 'Unknown product',
    brand: product.brands || '',
    barcode: product.code || product._id || '',
    image: product.image_front_small_url || product.image_small_url || '',
    basis_amount: 100,
    unit: 'g',
    default_amount: Number.isFinite(servingQuantity) && servingQuantity > 0 ? servingQuantity : 100,
    serving_size_label: product.serving_size || '',
    per100g,
  };
}

// Scales a per-`basisAmount` macro object to the actual amount eaten.
export function scaleMacros(macrosAtBasis, basisAmount, amountEaten) {
  const basis = Number(basisAmount) || 0;
  const amount = Number(amountEaten) || 0;
  const factor = basis > 0 ? amount / basis : 0;
  const out = {};
  for (const key of ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g', 'sodium_mg', 'sat_fat_g']) {
    const val = Number(macrosAtBasis[key]) || 0;
    out[key] = Math.round((val * factor) * 100) / 100;
  }
  return out;
}
