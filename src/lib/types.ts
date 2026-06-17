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
  contract_value?: number;
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
  incidence?: number;
}

export interface BudgetSubItem {
  id: string;
  budget_item_id: string;
  description: string;
  amount: number;
  percentage?: number;
  created_at?: string;
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
  role: 'editor' | 'viewer' | 'proprietor' | 'assistant' | 'intern';
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
  phone?: string;
  email?: string;
  status?: string;
  cpf_cnpj?: string;
  prazos?: string;
  observations?: string;
  parceiro?: string;
  link?: string;
  cod?: string;
  password?: string;
  maed_date?: string;
  parcelar_date?: string;
  address?: string;
  proprietario_nome?: string;
  proprietario_cpf_cnpj?: string;
  cno_numero?: string;
  rmt_inicial?: number;
  requisito_percent?: number;
  emitir_documento?: string;
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
    apelido?: string;
    cpf_cnpj?: string;
  };
  checklist_data?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryMaterial {
  id: string;
  project_id: string;
  code?: string;
  description: string;
  category: string;
  unit: string;
  min_stock: number;
  ideal_stock: number;
  current_stock: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryEmployee {
  id: string;
  project_id: string;
  name: string;
  role: string;
  notes?: string;
  created_at?: string;
}

export interface InventoryMovement {
  id: string;
  project_id: string;
  material_id: string;
  type: 'in' | 'out' | 'cautela' | 'adjustment';
  date: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  supplier?: string;
  invoice_url?: string;
  storage_location?: string;
  invoice_number?: string;
  financial_item_id?: string;
  budget_item_id?: string;
  budget_sub_item_id?: string;
  employee_id?: string;
  destination?: string;
  notes?: string;
  created_by?: string;
  created_at?: string;
  material?: InventoryMaterial;
  employee?: InventoryEmployee;
  budget_item?: BudgetItem;
  budget_sub_item?: BudgetSubItem;
}

export interface EngDiscipline {
  id: string;
  project_id: string;
  name: string;
  responsible_name?: string;
  company?: string;
  contact?: string;
  start_date?: string;
  deadline?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface EngDirectory {
  id: string;
  project_id: string;
  discipline_id?: string;
  parent_id?: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface EngDocument {
  id: string;
  discipline_id?: string;
  directory_id?: string;
  project_id: string;
  name: string;
  type: string;
  version: string;
  responsible?: string;
  notes?: string;
  file_path: string;
  created_at?: string;
  updated_at?: string;
}

export interface EngRevision {
  id: string;
  document_id: string;
  version: string;
  user_id: string;
  file_path: string;
  changes_description?: string;
  comments?: string;
  created_at?: string;
}

export interface EngClash {
  id: string;
  project_id: string;
  discipline1_id: string;
  discipline2_id: string;
  description: string;
  image_url?: string;
  responsible?: string;
  deadline?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  discipline1?: EngDiscipline;
  discipline2?: EngDiscipline;
}

export interface EngRfi {
  id: string;
  project_id: string;
  number?: number;
  title: string;
  description: string;
  category?: string;
  priority: string;
  responsible?: string;
  deadline?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface EngApproval {
  id: string;
  document_id?: string;
  project_id: string;
  user_id: string;
  step?: string;
  status?: string;
  comments?: string;
  time_spent_hours?: number;
  created_at?: string;
}

export interface EngDeliverable {
  id: string;
  project_id: string;
  name: string;
  planned_date?: string;
  actual_date?: string;
  responsible?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}
