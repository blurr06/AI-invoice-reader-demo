export interface InvoiceHeader {
  vendor_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  delivery_date: string | null;
  invoice_total: number | null;
  page_count: number;
}

export interface LineItem {
  row_index: number;
  qty: number | null;
  item_code: string | null;
  scan_code: string | null;
  item_description: string | null;
  department: string | null;
  price_group: string | null;
  product_category: string | null;
  units: number | null;
  case_cost: number | null;
  case_discount: number | null;
  cost_per_unit_after_discount: number | null;
  extended_case_cost: number | null;
  unit_retail: number | null;
  extended_unit_retail: number | null;
  size: string | null;
  default_margin_percent: number | null;
  calculated_margin_percent: number | null;
  confidence: number;
  notes: string | null;
}

export interface InvoiceData {
  invoice_header: InvoiceHeader;
  line_items: LineItem[];
}