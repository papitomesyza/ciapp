// USDA FoodData Central text search — fallback provider for when Open Food
// Facts' search backends are down. Results are mapped into the exact same
// food-object shape offProductToFood() produces, so the frontend and the
// portion-scaling helpers in nutrition.js need no changes.

const USDA_SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

// USDA nutrient IDs, matched by nutrientNumber. 208 is KCAL — 268 is the
// kilojoule figure and must never be used for calories, same trap as OFF's
// bare "energy" field.
const NUTRIENT_NUMBER = {
  calories: '208',
  protein_g: '203',
  fat_g: '204',
  carbs_g: '205',
  fiber_g: '291',
  sugar_g: '269',
  sodium_mg: '307',
  sat_fat_g: '606',
};

function n(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function findNutrientValue(foodNutrients, nutrientNumber) {
  if (!Array.isArray(foodNutrients)) return undefined;
  const match = foodNutrients.find((fn) => fn && String(fn.nutrientNumber) === nutrientNumber);
  return match ? match.value : undefined;
}

// USDA foodNutrients are already reported per 100g/100mL for every data
// type (Foundation, SR Legacy, and Branded alike) — no rescaling needed.
function usdaNutrientsToPer100g(foodNutrients) {
  return {
    calories: n(findNutrientValue(foodNutrients, NUTRIENT_NUMBER.calories)),
    protein_g: n(findNutrientValue(foodNutrients, NUTRIENT_NUMBER.protein_g)),
    carbs_g: n(findNutrientValue(foodNutrients, NUTRIENT_NUMBER.carbs_g)),
    fat_g: n(findNutrientValue(foodNutrients, NUTRIENT_NUMBER.fat_g)),
    fiber_g: n(findNutrientValue(foodNutrients, NUTRIENT_NUMBER.fiber_g)),
    sugar_g: n(findNutrientValue(foodNutrients, NUTRIENT_NUMBER.sugar_g)),
    sodium_mg: n(findNutrientValue(foodNutrients, NUTRIENT_NUMBER.sodium_mg)),
    sat_fat_g: n(findNutrientValue(foodNutrients, NUTRIENT_NUMBER.sat_fat_g)),
  };
}

function hasCompleteUsdaMacros(foodNutrients) {
  const present = (num) => findNutrientValue(foodNutrients, num) !== undefined;
  return present(NUTRIENT_NUMBER.calories) && present(NUTRIENT_NUMBER.protein_g)
    && present(NUTRIENT_NUMBER.carbs_g) && present(NUTRIENT_NUMBER.fat_g);
}

function usdaFoodToFood(food) {
  const per100g = usdaNutrientsToPer100g(food.foodNutrients);
  const servingSizeUnit = String(food.servingSizeUnit || '').trim().toLowerCase();
  const servingSize = Number(food.servingSize);
  const servingIsUsable = (servingSizeUnit === 'g' || servingSizeUnit === 'ml')
    && Number.isFinite(servingSize) && servingSize > 0;

  return {
    name: food.description || 'Unknown food',
    brand: food.brandName || food.brandOwner || '',
    barcode: food.gtinUpc || '',
    image: '',
    basis_amount: 100,
    unit: 'g',
    default_amount: servingIsUsable ? servingSize : 100,
    serving_size_label: food.householdServingFullText || '',
    per100g,
    source: 'usda',
    macros_complete: hasCompleteUsdaMacros(food.foodNutrients),
  };
}

// Never throws — any failure (network, non-2xx, malformed body) resolves to
// an empty array so the caller can fall through cleanly.
export async function searchUsda(query, apiKey) {
  if (!apiKey) return [];

  const url = new URL(USDA_SEARCH_URL);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('query', query);
  url.searchParams.set('pageSize', '20');
  url.searchParams.set('dataType', 'Foundation,SR Legacy,Branded');

  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) return [];

    const data = await response.json();
    const foods = Array.isArray(data?.foods) ? data.foods : [];

    return foods
      .filter((f) => f && f.description)
      .map(usdaFoodToFood)
      .filter((f) => f.per100g.calories > 0 || f.per100g.protein_g > 0 || f.per100g.carbs_g > 0 || f.per100g.fat_g > 0);
  } catch {
    return [];
  }
}
