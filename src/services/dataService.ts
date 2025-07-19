// Local Data Service - Works with JSON files (SQLite can be added later)
import { 
  DeliveryChallan, 
  Customer, 
  Invoice, 
  LedgerEntry, 
  ProfitLossEntry, 
  CashFlow, 
  Settings,
  BulkData
} from '../types/erp';

class DataService {
  private storageKey = 'erp_data';
  private autoSaveTimer: NodeJS.Timeout | null = null;

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

  private loadData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) return this.convertDates(JSON.parse(data));
      return this.getDefaultData();
    } catch {
      return this.getDefaultData();
    }
  }

  private saveData(data: any) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  private convertDates(data: any): any {
    if (data === null || data === undefined) return data;
    if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(data)) return new Date(data);
    if (Array.isArray(data)) return data.map(item => this.convertDates(item));
    if (typeof data === 'object') {
      const converted: any = {};
      for (const key in data) converted[key] = this.convertDates(data[key]);
      return converted;
    }
    return data;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  startAutoSave(callback: () => void, intervalMinutes: number = 5) {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
    this.autoSaveTimer = setInterval(() => callback(), intervalMinutes * 60 * 1000);
  }
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  // ---------------- DELIVERY CHALLAN ----------------
  async getDeliveryChallans(): Promise<DeliveryChallan[]> {
    const data = this.loadData();
    return (data.deliveryChallans || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

    // ✅ Ask how much paid to vendor
    const totalAmount = newDC.totalWeight * newDC.purchaseRate;
    const paidStr = window.prompt(
      `Vendor "${newDC.vendorName}"\nTotal: ₹${totalAmount.toFixed(2)}\nEnter how much paid now:`,
      "0"
    );
    const paid = paidStr ? parseFloat(paidStr) : 0;
    const due = totalAmount - paid;

    // ✅ Create ledger entry
    await this.createLedgerEntry({
      customerId: newDC.vendorName,
      customerName: newDC.vendorName,
      type: 'purchase',
      amount: totalAmount,
      balance: due,
      description: `DC ${newDC.dcNumber} - ${newDC.totalBirds} birds, ${newDC.totalWeight}kg`,
      referenceId: newDC.id,
      date: newDC.date,
      paid,
      due,
      paidMode: 'cash'
    });

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

  // ---------------- CUSTOMERS ----------------
  async getCustomers(): Promise<Customer[]> {
    const data = this.loadData();
    return data.customers || [];
  }
  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    const data = this.loadData();
    const newCustomer: Customer = { ...customer, id: this.generateId(), createdAt: new Date() };
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

  // ---------------- INVOICES ----------------
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

    // ✅ Ask how much customer paid
    const totalAmount = newInvoice.total;
    const paidStr = window.prompt(
      `Customer "${newInvoice.customerName}"\nTotal: ₹${totalAmount.toFixed(2)}\nEnter how much paid now:`,
      "0"
    );
    const paid = paidStr ? parseFloat(paidStr) : 0;
    const due = totalAmount - paid;

    await this.createLedgerEntry({
      customerId: newInvoice.customerId,
      customerName: newInvoice.customerName,
      type: 'invoice',
      amount: totalAmount,
      balance: due,
      description: `Invoice ${newInvoice.invoiceNumber}`,
      referenceId: newInvoice.id,
      date: new Date(),
      paid,
      due,
      paidMode: 'cash'
    });

    return newInvoice;
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
    const data = this.loadData();
    const index = data.invoices.findIndex((inv: Invoice) => inv.id === id);
    if (index === -1) return null;
    if (updates.version) {
      const currentVersion = parseFloat(data.invoices[index].version);
      updates.version = (currentVersion + 0.1).toFixed(1);
    }
    data.invoices[index] = { ...data.invoices[index], ...updates, updatedAt: new Date() };
    this.saveData(data);
    return data.invoices[index];
  }

  // ---------------- LEDGER ----------------
  async getLedgerEntries(customerId?: string): Promise<LedgerEntry[]> {
    const data = this.loadData();
    const entries = data.ledgerEntries || [];
    if (customerId) return entries.filter((entry: LedgerEntry) => entry.customerId === customerId);
    return entries;
  }

  async createLedgerEntry(entry: Omit<LedgerEntry, 'id' | 'createdAt'>): Promise<LedgerEntry> {
    const data = this.loadData();
    const newEntry: LedgerEntry = { ...entry, id: this.generateId(), createdAt: new Date() };
    data.ledgerEntries.push(newEntry);
    this.saveData(data);
    return newEntry;
  }

  async updateLedgerEntry(id: string, updates: Partial<LedgerEntry>): Promise<LedgerEntry | null> {
    const data = this.loadData();
    const idx = data.ledgerEntries.findIndex((l: LedgerEntry) => l.id === id);
    if (idx === -1) return null;
    data.ledgerEntries[idx] = { ...data.ledgerEntries[idx], ...updates };
    this.saveData(data);
    return data.ledgerEntries[idx];
  }

  async deleteLedgerEntry(id: string): Promise<boolean> {
    const data = this.loadData();
    const idx = data.ledgerEntries.findIndex((l: LedgerEntry) => l.id === id);
    if (idx === -1) return false;
    data.ledgerEntries.splice(idx, 1);
    this.saveData(data);
    return true;
  }

  // ---------------- CASH FLOW ----------------
  async getCashFlow(): Promise<CashFlow[]> {
    const data = this.loadData();
    return data.cashFlow || [];
  }

  async addCashFlowEntry(entry: Omit<CashFlow, 'id' | 'createdAt'>): Promise<CashFlow> {
    const data = this.loadData();
    const newEntry: CashFlow = { ...entry, id: this.generateId(), createdAt: new Date() };
    data.cashFlow.push(newEntry);
    this.saveData(data);
    return newEntry;
  }

  // ---------------- PROFIT & LOSS ----------------
  async getProfitLoss(): Promise<ProfitLossEntry[]> {
    const data = this.loadData();
    return data.profitLoss || [];
  }

  // ---------------- BULK DATA PARSING ----------------
  parseBulkData(text: string): BulkData {
    const lines = text.trim().split('\n');
    const cages: BulkData['cages'] = [];
    let customerName: string | undefined;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (!/\d/.test(trimmed) && trimmed.length > 3) {
        customerName = trimmed;
        continue;
      }
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

  // ---------------- EXPORT / IMPORT ----------------
  async exportToExcel(): Promise<Blob> {
    const data = this.loadData();
    const jsonData = JSON.stringify(data, null, 2);
    return new Blob([jsonData], { type: 'application/json' });
  }

  async importFromExcel(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const importedData = JSON.parse(text);
      const currentData = this.loadData();
      const mergedData = { ...currentData, ...importedData };
      return this.saveData(mergedData);
    } catch {
      return false;
    }
  }

  async createBackup(): Promise<Blob> {
    const data = this.loadData();
    const backup = { ...data, backupDate: new Date(), version: '1.0' };
    return new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  }

  async restoreBackup(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      if (backupData.version && backupData.backupDate) {
        delete backupData.backupDate;
        delete backupData.version;
        return this.saveData(backupData);
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const dataService = new DataService();
