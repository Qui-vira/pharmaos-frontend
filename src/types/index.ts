/**
 * PharmaOS AI — TypeScript Types (v3 Aligned)
 * Matches exact backend Pydantic schemas and SQLAlchemy model fields.
 */

export interface Organization {
  id: string;
  name: string;
  org_type: 'pharmacy' | 'distributor' | 'wholesaler' | 'system_admin';
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  license_number?: string;
  whatsapp_phone_number_id?: string;
  settings?: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface User {
  id: string;
  org_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export type UserRole =
  | 'super_admin' | 'pharmacy_admin' | 'cashier' | 'pharmacist'
  | 'distributor_admin' | 'warehouse_staff' | 'sales_rep';

// Products — GLOBAL catalog, no org_id
export interface Product {
  id: string;
  name: string;
  generic_name: string;
  brand_name?: string;
  dosage_form?: string;
  strength?: string;
  manufacturer?: string;
  nafdac_number?: string;
  category?: string;
  requires_prescription: boolean;
  controlled_substance: boolean;
  unit_of_measure?: string;
  is_active: boolean;
  created_at: string;
}

// Inventory — per-org, linked to global products
export interface InventoryItem {
  id: string;
  org_id: string;
  product_id: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  cost_price: number;
  selling_price: number;
  reorder_threshold: number;
  location?: string;
  product?: Product;
}

export interface LowStockItem {
  product_id: string;
  product_name: string;
  quantity_on_hand: number;
  reorder_threshold: number;
  deficit: number;
}

export interface Batch {
  id: string;
  product_id: string;
  batch_number: string;
  quantity: number;
  expiry_date: string;
  received_date: string;
  supplier_org_id?: string;
  cost_price?: number;
  selling_price?: number;
  created_at: string;
}

export interface ExpiryAlert {
  id: string;
  batch_id: string;
  alert_type: 'approaching' | 'warning' | 'critical' | 'expired';
  alert_date: string;
  is_resolved: boolean;
  resolution_action?: string;
  batch?: Batch;
}

export interface Sale {
  id: string;
  org_id: string;
  cashier_id: string;
  patient_id?: string;
  total_amount: number;
  payment_method: string;
  sale_date: string;
  items: any[];
  consultation_id?: string;
}

export interface SalesAnalytics {
  total_revenue: number;
  total_sales_count: number;
  average_sale_value: number;
  top_products: { product_id: string; product_name: string; quantity: number; revenue: number }[];
  daily_revenue: { date: string; revenue: number; count: number }[];
}

export interface Order {
  id: string;
  order_number: string;
  buyer_org_id: string;
  seller_org_id: string;
  status: OrderStatus;
  channel: string;
  total_amount: number;
  pickup_time?: string;
  delivery_address?: string;
  notes?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

// Backend v2 statuses (v3 adds awaiting_payment|paid when payment endpoints deployed)
export type OrderStatus =
  | 'draft' | 'submitted' | 'confirmed' | 'processing'
  | 'ready' | 'picked_up' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

// SupplierProduct links to global product_id
export interface SupplierProduct {
  id: string;
  org_id: string;
  product_id: string;
  unit_price: number;
  quantity_available: number;
  is_published: boolean;
  product?: Product;
  created_at: string;
}

export interface Patient {
  id: string;
  org_id: string;
  full_name: string;
  phone: string;
  date_of_birth?: string;
  gender?: string;
  allergies?: string[];
  chronic_conditions?: string[];
  consent_given: boolean;
  consent_date?: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  org_id: string;
  patient_id: string;
  reminder_type: 'refill' | 'adherence' | 'follow_up' | 'pickup';
  product_id?: string;
  scheduled_at: string;
  sent_at?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'responded';
  response?: string;
  recurrence_rule?: string;
  created_at: string;
}

export interface Consultation {
  id: string;
  org_id: string;
  patient_id: string;
  status: ConsultationStatus;
  symptom_summary?: string;
  channel: string;
  assigned_pharmacist_id?: string;
  messages: ConsultationMessage[];
  pharmacist_action?: PharmacistAction;
  created_at: string;
  updated_at: string;
}

export type ConsultationStatus =
  | 'intake' | 'ai_processing' | 'pending_review'
  | 'pharmacist_reviewing' | 'approved' | 'completed' | 'cancelled';

export interface ConsultationMessage {
  id: string;
  sender_type: 'customer' | 'ai' | 'pharmacist';
  message: string;
  sent_at: string;
}

export interface PharmacistAction {
  id: string;
  pharmacist_id: string;
  diagnosis: string;
  drug_plan: any[];
  total_price: number;
  is_approved: boolean;
  approved_at?: string;
  notes?: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}
