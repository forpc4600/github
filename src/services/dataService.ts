// Local Data Service - Works with JSON files (SQLite can be added later)
import { 
  DeliveryChallan, 
  Customer, 
  Invoice, 
  LedgerEntry, 
  ProfitLossEntry, 
  CashFlow, 
  Settings,
  Cage,
  BulkData
} from '../types/erp';

class DataService {
  private storageKey = 'erp_data';
  
  // Initialize default data structure
  private getDefaultData() {
    return {
      deliveryChallans: [] as DeliveryChallan[],
      customers: [] as Customer[],
      invoices: [] as Invoice[],
      ledgerEntries: [] as LedgerEntry[],
      profitLoss: [] as ProfitLossEntry[],
      cashFlow: [] as CashFlow[],
      settings: {
        id: '1',
        companyName: 'Your Company',
        address: '',
        phone: '',
        email: '',
        gstNumber: '',
        autoSaveInterval: 5,
        defaultTaxRate: 18,
        offDays: ['sunday'],
        vendorRates: [],
        lastBackup: new Date()
      } as Settings
    };
  }

  // Load data from localStorage
  private loadData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        // Convert date strings back to Date objects
        return this.convertDates(parsed);
      }
      return this.getDefaultData();
    } catch (error) {
      console.error('Error loading data:', error);
      return this.getDefaultData();
    }
  }

  // Save data to localStorage
  private saveData(data: any) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  }

  // Convert date strings to Date objects
  private convertDates(data: any): any {
    if (data === null || data === undefined) return data;
    
    if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data)) {
      return new Date(data);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.convertDates(item));
    }
    
    if (typeof data === 'object') {
      const converted: any = {};
      for (const key in data) {
        converted[key] = this.convertDates(data[key]);
      }
      return converted;
    }
    
    return data;
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Auto-save functionality
  private autoSaveTimer: NodeJS.Timeout | null = null;
  
  startAutoSave(callback: () => void, intervalMinutes: number = 5) {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setInterval(() => {
      callback();
      console.log('Auto-saved at:', new Date().toLocaleTimeString());
    }, intervalMinutes * 60 * 1000);
  }

  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  // DELIVERY CHALLAN OPERATIONS
  async getDeliveryChallans(): Promise<DeliveryChallan[]> {
    const data = this.loadData();
    return data.deliveryChallans || [];
  }

  async createDeliveryChallan(dc: Omit<DeliveryChallan, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeliveryChallan> {
    const data = this.loadData();
    const newDC: DeliveryChallan = {
      ...dc,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    data.deliveryChallans.push(newDC);
    this.saveData(data);
    return newDC;
  }

  async updateDeliveryChallan(id: string, updates: Partial<DeliveryChallan>): Promise<DeliveryChallan | null> {
    const data = this.loadData();
    const index = data.deliveryChallans.findIndex((dc: DeliveryChallan) => dc.id === id);
    
    if (index === -1) return null;
    
    data.deliveryChallans[index] = {
      ...data.deliveryChallans[index],
      ...updates,
      updatedAt: new Date()
    };
    
    this.saveData(data);
    return data.deliveryChallans[index];
  }

  async deleteDeliveryChallan(id: string): Promise<boolean> {
    const data = this.loadData();
    const index = data.deliveryChallans.findIndex((dc: DeliveryChallan) => dc.id === id);
    
    if (index === -1) return false;
    
    data.deliveryChallans.splice(index, 1);
    this.saveData(data);
    return true;
  }

  // CUSTOMER OPERATIONS
  async getCustomers(): Promise<Customer[]> {
    const data = this.loadData();
    return data.customers || [];
  }

  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    const data = this.loadData();
    const newCustomer: Customer = {
      ...customer,
      id: this.generateId(),
      createdAt: new Date()
    };
    
    data.customers.push(newCustomer);
    this.saveData(data);
    return newCustomer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    const data = this.loadData();
    const index = data.customers.findIndex((c: Customer) => c.id === id);
    
    if (index === -1) return null;
    
    data.customers[index] = { ...data.customers[index], ...updates };
    this.saveData(data);
    return data.customers[index];
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    const customers = await this.getCustomers();
    return customers.filter(c => 
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phone.includes(query) ||
      c.email.toLowerCase().includes(query.toLowerCase())
    );
  }

  // INVOICE OPERATIONS
  async getInvoices(): Promise<Invoice[]> {
    const data = this.loadData();
    return data.invoices || [];
  }

  async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const data = this.loadData();
    const newInvoice: Invoice = {
      ...invoice,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    data.invoices.push(newInvoice);
    this.saveData(data);
    
    // Update ledger
    await this.createLedgerEntry({
      customerId: newInvoice.customerId,
      customerName: newInvoice.customerName,
      type: 'invoice',
      amount: newInvoice.total,
      balance: 0, // Will be calculated
      description: `Invoice ${newInvoice.invoiceNumber}`,
      referenceId: newInvoice.id,
      date: new Date()
    });
    
    return newInvoice;
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
    const data = this.loadData();
    const index = data.invoices.findIndex((inv: Invoice) => inv.id === id);
    
    if (index === -1) return null;
    
    // Create new version if invoice is being edited
    if (updates.version) {
      const currentVersion = parseFloat(data.invoices[index].version);
      updates.version = (currentVersion + 0.1).toFixed(1);
    }
    
    data.invoices[index] = {
      ...data.invoices[index],
      ...updates,
      updatedAt: new Date()
    };
    
    this.saveData(data);
    return data.invoices[index];
  }

  // LEDGER OPERATIONS
  async getLedgerEntries(customerId?: string): Promise<LedgerEntry[]> {
    const data = this.loadData();
    const entries = data.ledgerEntries || [];
    
    if (customerId) {
      return entries.filter((entry: LedgerEntry) => entry.customerId === customerId);
    }
    
    return entries;
  }

  async createLedgerEntry(entry: Omit<LedgerEntry, 'id' | 'createdAt'>): Promise<LedgerEntry> {
    const data = this.loadData();
    const newEntry: LedgerEntry = {
      ...entry,
      id: this.generateId(),
      createdAt: new Date()
    };
    
    data.ledgerEntries.push(newEntry);
    this.saveData(data);
    return newEntry;
  }

  // CASH FLOW OPERATIONS
  async getCashFlow(): Promise<CashFlow[]> {
    const data = this.loadData();
    return data.cashFlow || [];
  }

  async addCashFlowEntry(entry: Omit<CashFlow, 'id' | 'createdAt'>): Promise<CashFlow> {
    const data = this.loadData();
    const newEntry: CashFlow = {
      ...entry,
      id: this.generateId(),
      createdAt: new Date()
    };
    
    data.cashFlow.push(newEntry);
    this.saveData(data);
    return newEntry;
  }

  // PROFIT & LOSS OPERATIONS
  async getProfitLoss(): Promise<ProfitLossEntry[]> {
    const data = this.loadData();
    return data.profitLoss || [];
  }

  async calculateDailyProfitLoss(date: Date): Promise<ProfitLossEntry> {
    const invoices = await this.getInvoices();
    const cashFlow = await this.getCashFlow();
    
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    // Calculate revenue from invoices
    const dayInvoices = invoices.filter(inv => 
      inv.createdAt >= dayStart && inv.createdAt <= dayEnd
    );
    const revenue = dayInvoices.reduce((sum, inv) => sum + inv.total, 0);
    
    // Calculate expenses
    const dayExpenses = cashFlow.filter(cf => 
      cf.type === 'expense' && cf.date >= dayStart && cf.date <= dayEnd
    );
    const expenses = dayExpenses.map(exp => ({
      id: exp.id,
      category: exp.category as any,
      amount: exp.amount,
      description: exp.description,
      date: exp.date
    }));
    
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    return {
      id: this.generateId(),
      date,
      type: 'daily',
      revenue,
      vendorCost: 0, // To be calculated based on vendor rates
      expenses,
      grossProfit: revenue,
      netProfit: revenue - totalExpenses,
      pendingProfit: dayInvoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + inv.dueAmount, 0),
      marketProfit: revenue, // If all paid
      withdrawableProfit: revenue - totalExpenses,
      withdrawn: 0
    };
  }

  // SETTINGS OPERATIONS
  async getSettings(): Promise<Settings> {
    const data = this.loadData();
    return data.settings || this.getDefaultData().settings;
  }

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    const data = this.loadData();
    data.settings = { ...data.settings, ...updates };
    this.saveData(data);
    return data.settings;
  }

  // BULK DATA PARSING
  parseBulkData(text: string): BulkData {
    const lines = text.trim().split('\n');
    const cages: BulkData['cages'] = [];
    let customerName: string | undefined;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Check if line contains customer name (no numbers)
      if (!/\d/.test(trimmed) && trimmed.length > 3) {
        customerName = trimmed;
        continue;
      }
      
      // Parse cage data: cageNo birdCount weight
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 3) {
        const cageNo = parseInt(parts[0]);
        const birdCount = parseInt(parts[1]);
        const weight = parseFloat(parts[2]);
        
        if (!isNaN(cageNo) && !isNaN(birdCount) && !isNaN(weight)) {
          cages.push({ cageNo, birdCount, weight });
        }
      }
    }
    
    return { customerName, cages };
  }

  // EXPORT TO EXCEL
  async exportToExcel(): Promise<Blob> {
    const data = this.loadData();
    
    // This will be implemented with xlsx library
    // For now, return JSON as blob
    const jsonData = JSON.stringify(data, null, 2);
    return new Blob([jsonData], { type: 'application/json' });
  }

  // IMPORT FROM EXCEL
  async importFromExcel(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const importedData = JSON.parse(text);
      
      // Validate and merge data
      const currentData = this.loadData();
      const mergedData = { ...currentData, ...importedData };
      
      return this.saveData(mergedData);
    } catch (error) {
      console.error('Import error:', error);
      return false;
    }
  }

  // BACKUP AND RESTORE
  async createBackup(): Promise<Blob> {
    const data = this.loadData();
    const backup = {
      ...data,
      backupDate: new Date(),
      version: '1.0'
    };
    
    const jsonData = JSON.stringify(backup, null, 2);
    return new Blob([jsonData], { type: 'application/json' });
  }

  async restoreBackup(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      // Validate backup structure
      if (backupData.version && backupData.backupDate) {
        delete backupData.backupDate;
        delete backupData.version;
        
        return this.saveData(backupData);
      }
      
      return false;
    } catch (error) {
      console.error('Restore error:', error);
      return false;
    }
  }
}

export const dataService = new DataService();