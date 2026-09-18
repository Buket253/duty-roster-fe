const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
const TOKEN_KEY = 'nobet-token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Token geçersizleştiğinde AuthContext'in oturumu kapatabilmesi için.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** JWT header'ını otomatik ekleyen fetch sarmalayıcı. */
async function request(path, { method = 'GET', body, auth = true } = {}) {
  const token = getToken();

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Tarayıcı isteği hiç gönderemedi: API kapalı ya da CORS engellemiş olabilir.
    // Tarayıcının kendi mesajı ("Load failed" / "Failed to fetch") sebebi göstermiyor.
    throw new ApiError(
      0,
      `API'ye ulaşılamadı (${BASE}). Backend çalışıyor mu ve CORS_ORIGIN bu adresi (${window.location.origin}) içeriyor mu?`
    );
  }

  if (res.status === 401 && auth) {
    clearToken();
    onUnauthorized();
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error ?? `İstek başarısız (${res.status})`);
  return data;
}

export const api = {
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: { email, password }, auth: false }),

  listUnits: () => request('/api/admin/units'),
  createUnit: (body) => request('/api/admin/units', { method: 'POST', body }),
  updateUnit: (id, body) => request(`/api/admin/units/${id}`, { method: 'PUT', body }),
  deleteUnit: (id) => request(`/api/admin/units/${id}`, { method: 'DELETE' }),

  listEmployees: (unitId) => request(`/api/admin/employees?unit=${unitId}`),
  createEmployee: (body) => request('/api/admin/employees', { method: 'POST', body }),
  updateEmployee: (id, body) => request(`/api/admin/employees/${id}`, { method: 'PUT', body }),
  deleteEmployee: (id) => request(`/api/admin/employees/${id}`, { method: 'DELETE' }),

  listLeaves: (unitId) => request(`/api/admin/leaves?unit=${unitId}`),
  createLeave: (body) => request('/api/admin/leaves', { method: 'POST', body }),
  deleteLeave: (id) => request(`/api/admin/leaves/${id}`, { method: 'DELETE' }),

  getRule: (unitId) => request(`/api/admin/rules/${unitId}`),
  updateRule: (unitId, body) => request(`/api/admin/rules/${unitId}`, { method: 'PUT', body }),

  getSchedule: (unitId, year, month) => request(`/api/admin/schedules/${unitId}/${year}/${month}`),
  generate: (unitId, year, month) =>
    request(`/api/admin/schedules/${unitId}/${year}/${month}/generate`, { method: 'POST' }),
  publish: (scheduleId) => request(`/api/admin/schedules/${scheduleId}/publish`, { method: 'POST' }),

  candidates: (assignmentId) => request(`/api/admin/assignments/${assignmentId}/candidates`),
  updateAssignment: (assignmentId, employee) =>
    request(`/api/admin/assignments/${assignmentId}`, { method: 'PUT', body: { employee } }),

  shareLink: (unitId) => request(`/api/admin/share-links/${unitId}`),
  publicSchedule: (token, year, month) =>
    request(`/api/public/${token}/${year}/${month}`, { auth: false }),
};

export default api;
