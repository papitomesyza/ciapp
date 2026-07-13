import { useEffect, useState } from 'react';
import { LogOut, Plus, Pencil, Trash2, Star, X } from 'lucide-react';
import { api, setToken } from '../api.js';
import { NUTRIENT_KEYS, NUTRIENT_LABELS, NUTRIENT_UNITS } from '../nutrition.js';

const TARGET_FIELDS = [
  ['calories_target', 'Calories', ''],
  ['protein_g_target', 'Protein', 'g'],
  ['carbs_g_target', 'Carbs', 'g'],
  ['fat_g_target', 'Fat', 'g'],
  ['fiber_g_target', 'Fiber', 'g'],
  ['sugar_g_target', 'Sugar', 'g'],
  ['sodium_mg_target', 'Sodium', 'mg'],
  ['sat_fat_g_target', 'Sat. Fat', 'g'],
];

const EMPTY_CUSTOM_FOOD = { name: '', serving_size: 1, serving_unit: 'serving', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 0, sat_fat_g: 0 };

function TargetsSection() {
  const [targets, setTargets] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getTargets().then(setTargets);
  }, []);

  if (!targets) return null;

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await api.setTargets(targets);
      setTargets(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass-card">
      <div className="field-row" style={{ flexWrap: 'wrap' }}>
        {TARGET_FIELDS.map(([key, label, unit]) => (
          <div className="field" key={key} style={{ minWidth: 130 }}>
            <label>{label} {unit && `(${unit})`}</label>
            <input
              type="number"
              value={targets[key]}
              onChange={(e) => setTargets((t) => ({ ...t, [key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <button className="btn btn-primary btn-block" disabled={saving} onClick={handleSave}>
        {saved ? 'Saved' : saving ? 'Saving…' : 'Save targets'}
      </button>
    </div>
  );
}

function CustomFoodsSection() {
  const [foods, setFoods] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  function refresh() {
    api.getCustomFoods().then(setFoods);
  }

  useEffect(refresh, []);

  async function handleSave(form) {
    if (form.id) await api.updateCustomFood(form.id, form);
    else await api.addCustomFood(form);
    setShowForm(false);
    setEditing(null);
    refresh();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this custom food?')) return;
    await api.deleteCustomFood(id);
    refresh();
  }

  return (
    <div className="glass-card">
      {foods.length === 0 && <div className="empty-state" style={{ padding: '12px 0' }}>No custom foods yet.</div>}
      {foods.map((food) => (
        <div className="entry-row" key={food.id}>
          <div className="entry-info">
            <div className="entry-name">{food.name}</div>
            <div className="entry-meta">{Math.round(food.calories)} kcal / {food.serving_size}{food.serving_unit}</div>
          </div>
          <div className="entry-actions">
            <button className="icon-btn" onClick={() => { setEditing(food); setShowForm(true); }}>
              <Pencil size={16} />
            </button>
            <button className="icon-btn danger" onClick={() => handleDelete(food.id)}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
      <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={() => { setEditing(null); setShowForm(true); }}>
        <Plus size={16} /> Add custom food
      </button>

      {showForm && (
        <CustomFoodForm
          initial={editing || EMPTY_CUSTOM_FOOD}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function CustomFoodForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2>{form.id ? 'Edit custom food' : 'New custom food'}</h2>
          <button className="icon-btn" onClick={onCancel}><X size={20} /></button>
        </div>
        <div className="sheet-body">
          <div className="field">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setField('name', e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Serving size</label>
              <input type="number" value={form.serving_size} onChange={(e) => setField('serving_size', e.target.value)} />
            </div>
            <div className="field">
              <label>Serving unit</label>
              <input value={form.serving_unit} onChange={(e) => setField('serving_unit', e.target.value)} />
            </div>
          </div>
          <div className="field-row" style={{ flexWrap: 'wrap' }}>
            {NUTRIENT_KEYS.map((key) => (
              <div className="field" key={key} style={{ minWidth: 100 }}>
                <label>{NUTRIENT_LABELS[key]} ({NUTRIENT_UNITS[key]})</label>
                <input type="number" value={form[key]} onChange={(e) => setField(key, e.target.value)} />
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-block" disabled={saving || !form.name} onClick={handleSubmit}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FavoritesSection() {
  const [favorites, setFavorites] = useState([]);

  function refresh() {
    api.getFavorites().then(setFavorites);
  }

  useEffect(refresh, []);

  async function handleDelete(id) {
    await api.deleteFavorite(id);
    refresh();
  }

  return (
    <div className="glass-card">
      {favorites.length === 0 && <div className="empty-state" style={{ padding: '12px 0' }}>No favorites yet — star a food in Search to add one.</div>}
      {favorites.map((fav) => (
        <div className="entry-row" key={fav.id}>
          <div className="entry-info">
            <div className="entry-name">{fav.name}</div>
            <div className="entry-meta">{Math.round(fav.calories)} kcal / {fav.default_amount}{fav.unit}</div>
          </div>
          <button className="icon-btn danger" onClick={() => handleDelete(fav.id)}>
            <Star size={16} fill="var(--accent)" color="var(--accent)" />
          </button>
        </div>
      ))}
    </div>
  );
}

function PassphraseSection({ onLoggedOut }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleChange() {
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      const { token } = await api.changePassphrase(current, next);
      setToken(token);
      setCurrent('');
      setNext('');
      setSuccess(true);
    } catch (err) {
      setError(err.message === 'unauthorized' ? 'Session expired — log in again.' : 'Could not change passphrase.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass-card">
      <div className="field">
        <label>Current passphrase</label>
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div className="field">
        <label>New passphrase</label>
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
      </div>
      {error && <div className="error-text" style={{ marginBottom: 10 }}>{error}</div>}
      {success && <div style={{ color: 'var(--accent)', fontSize: 13, marginBottom: 10 }}>Passphrase updated.</div>}
      <button className="btn btn-ghost btn-block" disabled={saving || !current || !next} onClick={handleChange}>
        {saving ? 'Updating…' : 'Change passphrase'}
      </button>
      <button className="btn btn-danger btn-block" style={{ marginTop: 10 }} onClick={onLoggedOut}>
        <LogOut size={16} /> Log out
      </button>
    </div>
  );
}

export default function Settings({ onLoggedOut }) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
        </div>
      </div>

      <div className="list-section-title">Daily targets</div>
      <TargetsSection />

      <div className="list-section-title">Favorites</div>
      <FavoritesSection />

      <div className="list-section-title">Custom foods</div>
      <CustomFoodsSection />

      <div className="list-section-title">Account</div>
      <PassphraseSection onLoggedOut={onLoggedOut} />

      <div className="footer-note">a year28 development</div>
    </div>
  );
}
