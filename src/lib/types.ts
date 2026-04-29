export interface Project {
  id: string;
  created_at?: string;
  user_id: string;
  name: string;
  client: string;
  location: string;
  area: number;
  start_date: string;
  deadline: string;
  status: string;
  description: string;
}

export interface BudgetItem {
  id: string;
  project_id: string;
  category: string;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unit_cost: number;
  executed_quantity: number;
}

export interface ScheduleItem {
  id: string;
  project_id: string;
  name: string;
  dependency: string;
  start_date: string;
  end_date: string;
  progress: number;
}

export interface FinancialItem {
  id: string;
  project_id: string;
  date: string;
  description: string;
  category: string;
  supplier: string;
  amount: number;
  budget_item_linked_id?: string;
  receipt_url?: string;
  receipt_url_2?: string;
  receipt_url_3?: string;
  observations: string;
  created_at?: string;
}

export interface DailyLog {
  id: string;
  project_id: string;
  date: string;
  weather: string;
  workers: number;
  activities: string;
  restrictions: string;
  created_at?: string;
  daily_log_photos?: DailyLogPhoto[];
}

export interface DailyLogPhoto {
  id: string;
  log_id: string;
  image_url: string;
  description: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  job_title?: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  name: string;
  url: string;
  file_type?: string;
  file_size?: number;
  uploaded_by?: string;
  created_at?: string;
}

export interface ProjectCollaborator {
  id: string;
  project_id: string;
  user_id: string;
  role: 'editor' | 'viewer' | 'proprietor';
  created_at: string;
  profile?: Profile;
}

export interface Measurement {
  id: string;
  project_id: string;
  date: string;
  description: string;
  status: 'pending' | 'authorized' | 'paid';
  created_at?: string;
  measurement_items?: MeasurementItem[];
}

export interface MeasurementItem {
  id: string;
  measurement_id: string;
  budget_item_id: string;
  quantity: number;
  notes?: string;
  created_at?: string;
  budget_item?: BudgetItem;
}

export interface BidGroup {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: 'open' | 'completed' | 'cancelled' | 'closed';
  incc_io_index?: number;
  incc_io_value?: number;
  incc_if_index?: number;
  incc_if_date?: string;
  original_budget_total?: number;
  created_at?: string;
  items?: BidGroupItem[];
  quotes?: BidQuote[];
  budget_items?: BidBudgetItem[];
}

export interface BidBudgetItem {
  id: string;
  bid_group_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

export interface BidGroupItem {
  id: string;
  bid_group_id: string;
  description: string;
  quantity: number;
  unit: string;
}

export interface BidQuote {
  id: string;
  bid_group_id: string;
  supplier_name: string;
  contact_name?: string;
  phone?: string;
  total_amount: number;
  delivery_time?: string;
  payment_terms?: string;
  validity?: string;
  is_selected: boolean;
  notes?: string;
  created_at?: string;
  quote_items?: BidQuoteItem[];
}

export interface BidQuoteItem {
  id: string;
  bid_quote_id: string;
  bid_group_item_id: string;
  unit_price: number;
}

export interface INSSRegularization {
  id: string;
  project_id?: string;
  user_id: string;
  name: string;
  client: string;
  responsavel: string;
  destinacao: string;
  tipo_obra: string;
  concreto_usinado: string;
  uf: string;
  area_construcao: number;
  area_reforma: number;
  area_demolicao: number;
  area_piscina: number;
  fator_inicio_mes: string;
  fator_inicio_ano: string;
  fator_fim_mes: string;
  fator_fim_ano: string;
  certificate_url?: string;
  certificate_password?: string;
  certificate_info?: {
    subject: string;
    issuer: string;
    valid_from: string;
    valid_to: string;
  };
  created_at?: string;
  updated_at?: string;
}
