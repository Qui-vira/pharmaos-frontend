/**
 * PharmaOS AI — API Client (v3 Aligned)
 * 
 * ALIGNMENT NOTES:
 * - Products: global catalog, no org_id. Fields: name, generic_name, brand_name, dosage_form,
 *   strength, manufacturer, nafdac_number, category, controlled_substance, unit_of_measure
 * - Inventory: per-org. Fields: quantity_on_hand, quantity_reserved, reorder_threshold, cost_price, selling_price
 * - Batches: product_id, batch_number, quantity, expiry_date, cost_price (selling_price in schema but not in BatchCreateRequest)
 * - Orders: statuses = draft|submitted|confirmed|processing|ready|picked_up|delivered|cancelled
 * - Consultations: statuses = intake|ai_processing|pending_review|pharmacist_reviewing|approved|completed|cancelled
 * - Catalog compare: uses product_id (UUID), NOT product_name
 * - SupplierProduct: links to product_id, has unit_price, quantity_available, is_published
 * - Reminders: types = refill|adherence|follow_up|pickup
 * 
 * MISSING FROM RUNNING BACKEND (not yet deployed):
 * - payments.py endpoints (Paystack/Flutterwave)
 * - imports.py endpoints (CSV/Excel upload via API)
 * These are included but will gracefully fail if backend doesn't have them yet.
 */

import type {
  TokenResponse, User, Organization, Product, InventoryItem,
  LowStockItem, ExpiryAlert, Sale, SalesAnalytics, Order,
  SupplierProduct, Patient, Reminder, Consultation, Notification,
  PaginatedResponse, Batch, LoginResponse, Enable2FAResponse,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

// ─── Token Management ──────────────────────────────────────────────────────

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pharmaos_access_token');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pharmaos_refresh_token');
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem('pharmaos_access_token', access);
  localStorage.setItem('pharmaos_refresh_token', refresh);
}

function clearTokens() {
  localStorage.removeItem('pharmaos_access_token');
  localStorage.removeItem('pharmaos_refresh_token');
  localStorage.removeItem('pharmaos_user');
}

function setUser(user: User) {
  localStorage.setItem('pharmaos_user', JSON.stringify(user));
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('pharmaos_user');
  return data ? JSON.parse(data) : null;
}

// ─── HTTP Client ───────────────────────────────────────────────────────────

async function request<T>(endpoint: string, options: RequestInit = {}, retry = true): Promise<T> {
  const url = `${API_BASE}${API_PREFIX}${endpoint}`;
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request<T>(endpoint, options, false);
    clearTokens();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}${API_PREFIX}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('pharmaos_access_token', data.access_token);
    return true;
  } catch {
    return false;
  }
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export const authApi = {
  async register(payload: {
    org_name: string; org_type: string; admin_email: string;
    admin_password: string; admin_full_name: string;
    phone?: string; address?: string; city?: string; state?: string; license_number?: string;
  }): Promise<LoginResponse> {
    const data = await request<LoginResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    if (data.access_token && data.refresh_token && data.user) {
      setTokens(data.access_token, data.refresh_token);
      setUser(data.user);
    }
    return data;
  },
  async login(email: string, password: string): Promise<LoginResponse> {
    const data = await request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (data.access_token && data.refresh_token && data.user) {
      setTokens(data.access_token, data.refresh_token);
      setUser(data.user);
    }
    return data;
  },
  async verifyEmail(email: string, code: string): Promise<LoginResponse> {
    const data = await request<LoginResponse>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, code }) });
    if (data.access_token && data.refresh_token && data.user) {
      setTokens(data.access_token, data.refresh_token);
      setUser(data.user);
    }
    return data;
  },
  resendCode: (email: string) =>
    request<{ message: string }>('/auth/resend-code', { method: 'POST', body: JSON.stringify({ email }) }),
  async googleAuth(id_token: string, org_type?: string, org_name?: string): Promise<LoginResponse> {
    const data = await request<LoginResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ id_token, org_type: org_type || 'pharmacy', org_name }),
    });
    if (data.access_token && data.refresh_token && data.user) {
      setTokens(data.access_token, data.refresh_token);
      setUser(data.user);
    }
    return data;
  },
  sendPhoneOtp: (phone: string) =>
    request<{ message: string }>('/auth/send-phone-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
  async verifyPhone(phone: string, code: string): Promise<{ message: string }> {
    return request<{ message: string }>('/auth/verify-phone', { method: 'POST', body: JSON.stringify({ phone, code }) });
  },
  enable2fa: () => request<Enable2FAResponse>('/auth/enable-2fa', { method: 'POST' }),
  confirm2fa: (code: string) =>
    request<{ message: string }>('/auth/confirm-2fa', { method: 'POST', body: JSON.stringify({ code }) }),
  async verify2fa(code: string, temp_token: string): Promise<LoginResponse> {
    const data = await request<LoginResponse>('/auth/verify-2fa', { method: 'POST', body: JSON.stringify({ code, temp_token }) });
    if (data.access_token && data.refresh_token && data.user) {
      setTokens(data.access_token, data.refresh_token);
      setUser(data.user);
    }
    return data;
  },
  disable2fa: (code: string) =>
    request<{ message: string }>('/auth/disable-2fa', { method: 'POST', body: JSON.stringify({ code }) }),
  logout() { clearTokens(); if (typeof window !== 'undefined') window.location.href = '/login'; },
  getMe: () => request<User>('/auth/me'),
};

// ─── Organizations ─────────────────────────────────────────────────────────

export const orgApi = {
  getMyOrg: () => request<Organization>('/orgs/me'),
  updateMyOrg: (data: Partial<Organization>) =>
    request<Organization>('/orgs/me', { method: 'PUT', body: JSON.stringify(data) }),
  listUsers: () => request<User[]>('/orgs/me/users'),
  createUser: (data: any) =>
    request<User>('/orgs/me/users', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Products (GLOBAL catalog, no org_id) ──────────────────────────────────

export const productsApi = {
  list: (page = 1, search?: string, category?: string) => {
    let url = `/products?page=${page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    return request<PaginatedResponse<Product>>(url);
  },
  create: (data: any) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addAlias: (productId: string, aliasName: string) =>
    request<any>(`/products/${productId}/aliases?alias_name=${encodeURIComponent(aliasName)}`, { method: 'POST' }),
  resolve: (name: string) =>
    request<any>(`/products/resolve?name=${encodeURIComponent(name)}`),
};

// ─── Inventory (per-org, linked to global products) ────────────────────────

export const inventoryApi = {
  list: (page = 1) => request<PaginatedResponse<InventoryItem>>(`/inventory?page=${page}`),
  addProduct: async (productId: string, reorderThreshold = 10) => {
    const token = getAccessToken();
    const res = await fetch(
      `${API_BASE}${API_PREFIX}/inventory/add-product?product_id=${productId}&reorder_threshold=${reorderThreshold}`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Failed to add product' }));
      throw new Error(error.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },
  adjust: (data: { product_id: string; adjustment: number; reason: string; cost_price?: number; selling_price?: number }) =>
    request<InventoryItem>('/inventory/adjust', { method: 'POST', body: JSON.stringify(data) }),
  lowStock: () => request<LowStockItem[]>('/inventory/low-stock'),
  expiryAlerts: (resolved = false) =>
    request<ExpiryAlert[]>(`/inventory/expiry-alerts?resolved=${resolved}`),
  demandForecast: (days = 7) => request<any[]>(`/inventory/demand-forecast?days=${days}`),
};

// ─── Batches ───────────────────────────────────────────────────────────────
// BatchCreateRequest: product_id, batch_number, quantity, expiry_date, received_date?, supplier_org_id?, cost_price?

export const batchesApi = {
  create: (data: {
    product_id: string; batch_number: string; quantity: number;
    expiry_date: string; received_date?: string; supplier_org_id?: string; cost_price?: number; selling_price?: number;
  }) => request<Batch>('/batches', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Sales ─────────────────────────────────────────────────────────────────

export const salesApi = {
  list: (page = 1, dateFrom?: string, dateTo?: string) => {
    let url = `/sales?page=${page}`;
    if (dateFrom) url += `&date_from=${dateFrom}`;
    if (dateTo) url += `&date_to=${dateTo}`;
    return request<PaginatedResponse<Sale>>(url);
  },
  create: (data: any) => request<Sale>('/sales', { method: 'POST', body: JSON.stringify(data) }),
  analytics: (days = 30) => request<SalesAnalytics>(`/sales/analytics?days=${days}`),
  anomalies: () => request<any[]>('/sales/anomalies'),
};

// ─── Orders ────────────────────────────────────────────────────────────────
// Statuses: draft|submitted|confirmed|processing|ready|picked_up|delivered|cancelled

export const ordersApi = {
  list: (page = 1, status?: string) => {
    let url = `/orders?page=${page}`;
    if (status) url += `&status=${status}`;
    return request<PaginatedResponse<Order>>(url);
  },
  get: (id: string) => request<Order>(`/orders/${id}`),
  create: (data: { seller_org_id: string; items: any[]; channel?: string; delivery_address?: string; notes?: string }) =>
    request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) =>
    request<Order>(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  setPickupTime: (id: string, pickup_time: string) =>
    request<Order>(`/orders/${id}/pickup-time`, { method: 'PUT', body: JSON.stringify({ pickup_time }) }),
};

// ─── Catalog (supplier products marketplace) ───────────────────────────────
// compare uses product_id (UUID), NOT product_name

export const catalogApi = {
  browse: (page = 1, search?: string, preferredOnly = false) => {
    let url = `/catalog?page=${page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (preferredOnly) url += `&preferred_only=true`;
    return request<PaginatedResponse<SupplierProduct>>(url);
  },
  compare: (productId: string) =>
    request<any[]>(`/catalog/compare?product_id=${productId}`),
  listMyProducts: (page = 1) =>
    request<PaginatedResponse<SupplierProduct>>(`/supplier-products?page=${page}`),
  createProduct: (data: { product_id: string; unit_price: number; quantity_available: number; is_published?: boolean }) =>
    request<SupplierProduct>('/supplier-products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: { unit_price?: number; quantity_available?: number; is_published?: boolean }) =>
    request<SupplierProduct>(`/supplier-products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  listRelationships: () => request<any[]>('/supplier-relationships'),
  createRelationship: (supplierOrgId: string, isPreferred = false, paymentTerms?: string) =>
    request<any>(`/supplier-relationships?supplier_org_id=${supplierOrgId}&is_preferred=${isPreferred}${paymentTerms ? `&payment_terms=${paymentTerms}` : ''}`, { method: 'POST' }),
};

// ─── Patients ──────────────────────────────────────────────────────────────

export const patientsApi = {
  list: (page = 1, search?: string) =>
    request<PaginatedResponse<Patient>>(`/patients?page=${page}${search ? `&search=${search}` : ''}`),
  get: (id: string) => request<Patient>(`/patients/${id}`),
  create: (data: any) => request<Patient>('/patients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<Patient>(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Reminders ─────────────────────────────────────────────────────────────
// Types: refill|adherence|follow_up|pickup

export const remindersApi = {
  list: (page = 1, status?: string) => {
    let url = `/reminders?page=${page}`;
    if (status) url += `&status=${status}`;
    return request<PaginatedResponse<Reminder>>(url);
  },
  create: (data: {
    patient_id: string; reminder_type: string; product_id?: string;
    scheduled_at: string; recurrence_rule?: string; message_template?: string;
  }) => request<Reminder>('/reminders', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<Reminder>(`/reminders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Consultations ─────────────────────────────────────────────────────────
// Statuses: intake|ai_processing|pending_review|pharmacist_reviewing|approved|completed|cancelled

export const consultationsApi = {
  list: (page = 1, status?: string) => {
    let url = `/consultations?page=${page}`;
    if (status) url += `&status=${status}`;
    return request<PaginatedResponse<Consultation>>(url);
  },
  get: (id: string) => request<Consultation>(`/consultations/${id}`),
  submitAction: (id: string, data: { diagnosis: string; drug_plan: any[]; total_price: number; notes?: string }) =>
    request<any>(`/consultations/${id}/action`, { method: 'POST', body: JSON.stringify(data) }),
  approve: (id: string) =>
    request<Consultation>(`/consultations/${id}/approve`, { method: 'POST' }),
};

// ─── Notifications ─────────────────────────────────────────────────────────

export const notificationsApi = {
  list: (unreadOnly = false) =>
    request<PaginatedResponse<Notification>>(`/notifications?unread_only=${unreadOnly}`),
  markRead: (id: string) => request<void>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request<void>('/notifications/read-all', { method: 'PUT' }),
};

// ─── Predictive Analytics ──────────────────────────────────────────────────

export const analyticsApi = {
  demandForecast: (days = 30) =>
    request<any[]>(`/analytics/demand-forecast?days=${days}`),
  reorderPredictions: () =>
    request<any[]>('/analytics/reorder-predictions'),
  revenueForecast: (months = 3) =>
    request<any>(`/analytics/revenue-forecast?months=${months}`),
  expiryRisk: () =>
    request<any[]>('/analytics/expiry-risk'),
  summary: () =>
    request<any>('/analytics/summary'),
};

// ─── Voice Calls ───────────────────────────────────────────────────────────

export const voiceApi = {
  listCalls: (page = 1, status?: string) => {
    let url = `/voice/calls?page=${page}`;
    if (status) url += `&status=${status}`;
    return request<any>(url);
  },
  getCall: (id: string) => request<any>(`/voice/calls/${id}`),
  analytics: () => request<any>('/voice/analytics'),
};

// ─── Admin ─────────────────────────────────────────────────────────────────

export const adminApi = {
  listOrgs: (page = 1) => request<any>(`/admin/organizations?page=${page}`),
  analytics: () => request<any>('/admin/analytics'),
  auditLogs: (page = 1) => request<any>(`/admin/audit-logs?page=${page}`),
};

// ─── File Upload Helper ────────────────────────────────────────────────────

export async function uploadFile(endpoint: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  const token = getAccessToken();
  const res = await fetch(`${API_BASE}${API_PREFIX}${endpoint}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }
  return res.json();
}
