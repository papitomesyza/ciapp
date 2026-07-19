const TOKEN_KEY = 'year28_macros_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (options.body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });

  if (res.status === 401) {
    setToken(null);
    window.dispatchEvent(new Event('year28:unauthorized'));
    throw new ApiError('unauthorized', 401);
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'request failed', res.status);
  return data;
}

export const api = {
  login: (passphrase) => request('/auth/login', { method: 'POST', body: JSON.stringify({ passphrase }) }),
  changePassphrase: (currentPassphrase, newPassphrase) =>
    request('/auth/change-passphrase', { method: 'POST', body: JSON.stringify({ currentPassphrase, newPassphrase }) }),

  searchFoods: (q) => request(`/foods/search?q=${encodeURIComponent(q)}`),
  lookupBarcode: (code) => request(`/foods/barcode/${encodeURIComponent(code)}`),

  aiParse: (text) => request('/ai/parse', { method: 'POST', body: JSON.stringify({ text }) }),

  getEntries: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/entries?${qs}`);
  },
  createEntry: (entry) => request('/entries', { method: 'POST', body: JSON.stringify(entry) }),
  updateEntry: (id, entry) => request(`/entries/${id}`, { method: 'PUT', body: JSON.stringify(entry) }),
  deleteEntry: (id) => request(`/entries/${id}`, { method: 'DELETE' }),

  getTargets: () => request('/targets'),
  setTargets: (targets) => request('/targets', { method: 'PUT', body: JSON.stringify(targets) }),

  getFavorites: () => request('/favorites'),
  addFavorite: (fav) => request('/favorites', { method: 'POST', body: JSON.stringify(fav) }),
  deleteFavorite: (id) => request(`/favorites/${id}`, { method: 'DELETE' }),

  getCustomFoods: () => request('/custom-foods'),
  addCustomFood: (food) => request('/custom-foods', { method: 'POST', body: JSON.stringify(food) }),
  updateCustomFood: (id, food) => request(`/custom-foods/${id}`, { method: 'PUT', body: JSON.stringify(food) }),
  deleteCustomFood: (id) => request(`/custom-foods/${id}`, { method: 'DELETE' }),

  getDaySummary: (date) => request(`/summary/day?date=${date}`),
  getWeekSummary: (from, to) => request(`/summary/week?from=${from}&to=${to}`),

  // scope: 'week' | 'month' | 'year'; date is an optional YYYY-MM-DD anchor —
  // omit it to get the current period (computed server-side, Pristina time).
  getHistoryRange: (scope, date) => {
    const qs = new URLSearchParams({ scope, ...(date ? { date } : {}) }).toString();
    return request(`/history/range?${qs}`);
  },

  getHabits: () => request('/habits'),
  getHabitsToday: () => request('/habits/today'),
  createHabit: (habit) => request('/habits', { method: 'POST', body: JSON.stringify(habit) }),
  updateHabit: (id, patch) => request(`/habits/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),
  reorderHabits: (ids) => request('/habits/reorder', { method: 'PUT', body: JSON.stringify({ ids }) }),
  deleteHabit: (id) => request(`/habits/${id}`, { method: 'DELETE' }),
  toggleHabit: (id) => request(`/habits/${id}/toggle`, { method: 'POST' }),
  getHabitDetail: (id) => request(`/habits/${id}/detail`),
};

export { ApiError };
