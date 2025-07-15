// ERP Data Types for Local Storage
export interface DeliveryChallan {
  id: string;
  dcNumber: string;
  date: Date;
  cages: Cage[];
  totalBirds: number;
  totalWeight: number;
  manualWeighing: boolean;
  confirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cage {
  id: string;
  cageNo: number;
  birdCount: number;
  weight: number;
  sellingRate: number;
  isBilled: boolean;
  invoiceId?: string;
  dcId: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  customerType: 'regular' | 'wholesale' | 'retail';
  defaultRate: number;
  balance: number;
  advance: number;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  dcId?: string;
  cages: InvoiceCage[];
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: 'cash' | 'online' | 'advance' | 'mixed';
  paymentSplit?: PaymentSplit;
  status: 'draft' | 'confirmed' | 'paid' | 'partial' | 'overdue';
  isManual: boolean;
  version: string; // 1.0, 1.1, 1.2 etc
  weightLoss: number;
  additionalCharges: number;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceCage {
  cageNo: number;
  birdCount: number;
  weight: number;
  rate: number;
  amount: number;
  isPartial?: boolean;
  actualWeight?: number;
}

export interface PaymentSplit {
  cash: number;
  online: number;
  advance: number;
}

export interface LedgerEntry {
  id: string;
  customerId: string;
  customerName: string;
  type: 'invoice' | 'payment' | 'advance' | 'adjustment';
  amount: number;
  balance: number;
  description: string;
  referenceId?: string; // Invoice ID or Payment ID
  date: Date;
  createdAt: Date;
}

export interface ProfitLossEntry {
  id: string;
  date: Date;
  type: 'daily' | 'monthly';
  revenue: number;
  vendorCost: number;
  expenses: Expense[];
  grossProfit: number;
  netProfit: number;
  pendingProfit: number;
  marketProfit: number;
  withdrawableProfit: number;
  withdrawn: number;
}

export interface Expense {
  id: string;
  category: 'salary' | 'labour' | 'food' | 'diesel' | 'other';
  amount: number;
  description: string;
  date: Date;
}

export interface CashFlow {
  id: string;
  date: Date;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  paymentMethod: 'cash' | 'online';
  description: string;
  balance: CashBalance;
  createdAt: Date;
}

export interface CashBalance {
  cash: number;
  online: number;
  total: number;
}

export interface Settings {
  id: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
  autoSaveInterval: number; // minutes
  defaultTaxRate: number;
  offDays: string[]; // ['sunday', 'monday']
  vendorRates: VendorRate[];
  lastBackup: Date;
}

export interface VendorRate {
  vendorName: string;
  rate: number;
  date: Date;
}

export interface BulkData {
  customerName?: string;
  cages: {
    cageNo: number;
    birdCount: number;
    weight: number;
  }[];
}