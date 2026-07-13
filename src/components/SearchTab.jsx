import { useState, useEffect, useRef } from 'react';
import { Search, Star } from 'lucide-react';
import { api } from '../api.js';
import PortionPicker from './PortionPicker.jsx';

function offToFood(product) {
  return {
    name: product.name,
    barcode: product.barcode,
    basisAmount: product.basis_amount,
    unit: product.unit,
    defaultAmount: product.default_amount,
    basisMacros: product.per100g,
    source: 'search',
    raw: product,
  };
}

function favoriteToFood(fav) {
  return {
    name: fav.name,
    barcode: fav.barcode,
    basisAmount: fav.basis_amount,
    unit: fav.unit,
    defaultAmount: fav.default_amount,
    basisMacros: fav,
    source: 'favorite',
  };
}

function customFoodToFood(food) {
  return {
    name: food.name,
    basisAmount: food.serving_size,
    unit: food.serving_unit,
    defaultAmount: food.serving_size,
    basisMacros: food,
    source: 'custom',
  };
}

export default function SearchTab({ defaultMeal, onLogged }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [customFoods, setCustomFoods] = useState([]);
  const [selected, setSelected] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    api.getFavorites().then(setFavorites).catch(() => {});
    api.getCustomFoods().then(setCustomFoods).catch(() => {});
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError('');
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.searchFoods(query.trim());
        setResults(data);
      } catch {
        setError('Search failed. Try again.');
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function toggleFavorite(food) {
    const existing = favorites.find((f) => f.name === food.name);
    if (existing) {
      await api.deleteFavorite(existing.id);
      setFavorites((f) => f.filter((x) => x.id !== existing.id));
    } else {
      const created = await api.addFavorite({
        name: food.name,
        barcode: food.barcode || null,
        basis_amount: food.basisAmount,
        unit: food.unit,
        default_amount: food.defaultAmount,
        ...food.basisMacros,
      });
      setFavorites((f) => [...f, created]);
    }
  }

  async function handleConfirm(entry) {
    await onLogged(entry);
    setSelected(null);
  }

  return (
    <div>
      <div className="field" style={{ marginBottom: 12 }}>
        <div style={{ position: 'relative' }}>
          <Search size={17} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--text-dim)' }} />
          <input
            style={{ paddingLeft: 36 }}
            placeholder="Search a food (e.g. greek yogurt)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {!query.trim() && (
        <>
          {favorites.length > 0 && (
            <>
              <div className="list-section-title">Favorites</div>
              {favorites.map((fav) => (
                <div className="result-row" key={`fav-${fav.id}`} onClick={() => setSelected(favoriteToFood(fav))}>
                  <div>
                    <div className="result-name">{fav.name}</div>
                    <div className="result-meta">{Math.round(fav.calories)} kcal / {fav.default_amount}{fav.unit}</div>
                  </div>
                  <Star size={16} fill="var(--accent)" color="var(--accent)" />
                </div>
              ))}
            </>
          )}
          {customFoods.length > 0 && (
            <>
              <div className="list-section-title">Your foods</div>
              {customFoods.map((food) => (
                <div className="result-row" key={`custom-${food.id}`} onClick={() => setSelected(customFoodToFood(food))}>
                  <div>
                    <div className="result-name">{food.name}</div>
                    <div className="result-meta">{Math.round(food.calories)} kcal / {food.serving_size}{food.serving_unit}</div>
                  </div>
                </div>
              ))}
            </>
          )}
          {favorites.length === 0 && customFoods.length === 0 && (
            <div className="empty-state">Search Open Food Facts, or add favorites and custom foods from Settings.</div>
          )}
        </>
      )}

      {query.trim() && loading && (
        <div className="empty-state">
          <div className="spinner" style={{ margin: '0 auto 10px' }} />
          Searching…
        </div>
      )}
      {query.trim() && !loading && error && <div className="empty-state">{error}</div>}
      {query.trim() && !loading && !error && results.length === 0 && (
        <div className="empty-state">No results. Try a different search, or add it as a custom food.</div>
      )}
      {results.map((product, i) => {
        const isFav = favorites.some((f) => f.name === product.name);
        return (
          <div className="result-row" key={`${product.barcode || product.name}-${i}`}>
            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setSelected(offToFood(product))}>
              <div className="result-name">{product.name}</div>
              <div className="result-meta">
                {product.brand ? `${product.brand} · ` : ''}
                {Math.round(product.per100g.calories)} kcal / 100g
              </div>
            </div>
            <button className={`icon-btn star-btn ${isFav ? 'active' : ''}`} onClick={() => toggleFavorite(offToFood(product))}>
              <Star size={16} fill={isFav ? 'var(--accent)' : 'none'} />
            </button>
          </div>
        );
      })}

      {selected && (
        <PortionPicker food={selected} defaultMeal={defaultMeal} onClose={() => setSelected(null)} onConfirm={handleConfirm} />
      )}
    </div>
  );
}
