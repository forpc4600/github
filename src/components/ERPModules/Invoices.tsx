import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Download,
  Filter,
  Calendar,
  IndianRupee,
  X,
} from 'lucide-react';
import { mockInvoices, mockDCs } from '../../data/mockData';
import { Invoice, DCEntry, InvoiceItem } from '../../types/erp';

type CreateInvoiceProps = {
  onSave: (invoice: Invoice) => void;
  onClose: () => void;
  invoices: Invoice[];
  dcData: DCEntry[];
};

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [dcData, setDcData] = useState<DCEntry[]>(mockDCs); // Your DC data here

  // Filter and stats (unchanged from your original code)
  const statuses = ['all', 'draft', 'sent', 'paid', 'overdue'];
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesFilter;
  });
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
  const pendingAmount = invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + i.total, 0);
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total, 0);

  const handleAddInvoice = () => setShowAddForm(true);
  const handleDeleteInvoice = (id: string) => setInvoices(invoices.filter(i => i.id !== id));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'sent':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'overdue':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'draft':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Generate next invoice id like I1, I2...
  const generateInvoiceId = () => {
    if (invoices.length === 0) return 'I1';
    const numbers = invoices
      .map(inv => inv.id.replace(/^I/, ''))
      .map(num => parseInt(num))
      .filter(num => !isNaN(num));
    const maxNum = Math.max(...numbers);
    return `I${maxNum + 1}`;
  };

  // Save new invoice handler from child modal
  const handleSaveInvoice = (invoice: Invoice) => {
    setInvoices(prev => [...prev, invoice]);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* ... your header, search/filter, stats, invoice list from previous code ... */}

      {/* Place your previous header, search/filter, stats, and invoice list here */}

      {/* Add Invoice Modal (new fully functional form) */}
      {showAddForm && (
        <CreateInvoiceForm
          onSave={handleSaveInvoice}
          onClose={() => setShowAddForm(false)}
          invoices={invoices}
          dcData={dcData}
          generateInvoiceId={generateInvoiceId}
        />
      )}
    </div>
  );
}

function CreateInvoiceForm({
  onSave,
  onClose,
  invoices,
  dcData,
  generateInvoiceId,
}: CreateInvoiceProps & { generateInvoiceId: () => string }) {
  // States
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().substring(0, 10); // yyyy-mm-dd
  });
  const [customerName, setCustomerName] = useState('');
  const [activeTab, setActiveTab] = useState<'dc' | 'manual'>('dc');
  const [selectedDcCages, setSelectedDcCages] = useState<Record<string, boolean>>({}); // cageId: true
  const [manualItems, setManualItems] = useState<InvoiceItem[]>([]);

  // Filter DCs by selected date
  const dcsForDate = dcData.filter(dc => {
    const dcDate = new Date(dc.date).toISOString().substring(0, 10);
    return dcDate === date;
  });

  // Determine which cages are already used in invoices for the same date, to disable in DC list
  const usedCages = new Set<string>();
  invoices.forEach(inv => {
    const invDate = inv.createdAt.toISOString().substring(0, 10);
    if (invDate === date) {
      inv.items.forEach(item => {
        if (item.dcCageId) usedCages.add(item.dcCageId);
      });
    }
  });

  // Handle checkbox toggle for cages
  const toggleCage = (cageId: string) => {
    setSelectedDcCages(prev => ({
      ...prev,
      [cageId]: !prev[cageId],
    }));
  };

  // Manual item handlers
  const addManualItem = () => {
    setManualItems(prev => [
      ...prev,
      { name: '', qty: 1, rate: 0, taxPercent: 0, dcCageId: undefined },
    ]);
  };

  const updateManualItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setManualItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const removeManualItem = (index: number) => {
    setManualItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate totals
  const selectedDcItems: InvoiceItem[] = [];
  dcsForDate.forEach(dc => {
    dc.cages.forEach(cage => {
      if (selectedDcCages[cage.id] && !usedCages.has(cage.id)) {
        selectedDcItems.push({
          name: cage.name,
          qty: cage.qty,
          rate: cage.rate,
          taxPercent: cage.taxPercent ?? 0,
          dcCageId: cage.id,
        });
      }
    });
  });

  // Combine all items
  const allItems = [...selectedDcItems, ...manualItems];

  const subtotal = allItems.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const totalTax = allItems.reduce(
    (sum, item) => sum + item.qty * item.rate * (item.taxPercent ?? 0) * 0.01,
    0
  );
  const grandTotal = subtotal + totalTax;

  // Save handler
  const handleSave = () => {
    if (!customerName.trim()) {
      alert('Please enter a customer name.');
      return;
    }
    if (allItems.length === 0) {
      alert('Please add at least one item.');
      return;
    }

    const newInvoice: Invoice = {
      id: generateInvoiceId(),
      createdAt: new Date(date),
      dueDate: new Date(date), // For simplicity, due date = createdAt; adjust as needed
      customerName: customerName.trim(),
      items: allItems,
      total: grandTotal,
      tax: totalTax,
      status: 'draft',
    };
    onSave(newInvoice);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2a2a2a] rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-auto shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Create New Invoice</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Picker */}
        <div className="mb-4">
          <label className="block text-gray-400 mb-1">Invoice Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-gray-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Customer */}
        <div className="mb-4">
          <label className="block text-gray-400 mb-1">Customer Name</label>
          <input
            type="text"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="Enter customer name"
            className="w-full bg-[#1a1a1a] border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Invoice Number (readonly) */}
        <div className="mb-6">
          <label className="block text-gray-400 mb-1">Invoice Number</label>
          <input
            type="text"
            value={generateInvoiceId()}
            readOnly
            className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-2 text-gray-400 cursor-not-allowed"
          />
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-4 border-b border-gray-600">
          <button
            className={`pb-2 text-white ${
              activeTab === 'dc' ? 'border-b-2 border-purple-500 font-semibold' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('dc')}
          >
            From DC
          </button>
          <button
            className={`pb-2 text-white ${
              activeTab === 'manual' ? 'border-b-2 border-purple-500 font-semibold' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('manual')}
          >
            Manual Entry
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'dc' && (
          <div className="max-h-48 overflow-auto border border-gray-700 rounded-xl p-4 bg-[#1a1a1a] mb-6">
            {dcsForDate.length === 0 && (
              <p className="text-gray-400">No DC records found for selected date.</p>
            )}
            {dcsForDate.map(dc => (
              <div key={dc.id} className="mb-4">
                <h4 className="text-white font-semibold mb-2">DC: {dc.id}</h4>
                <div className="space-y-2">
                  {dc.cages.map(cage => {
                    const isUsed = usedCages.has(cage.id);
                    const isChecked = !!selectedDcCages[cage.id];
                    return (
                      <label
                        key={cage.id}
                        className={`flex items-center gap-2 cursor-pointer select-none ${
                          isUsed ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={isUsed}
                          checked={isChecked}
                          onChange={() => toggleCage(cage.id)}
                          className="w-4 h-4 rounded"
                        />
                        <div className="flex flex-col text-white">
                          <span>{cage.name}</span>
                          <span className="text-gray-400 text-xs">
                            Qty: {cage.qty}, Rate: ₹{cage.rate.toFixed(2)}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'manual' && (
          <div className="mb-6 max-h-48 overflow-auto border border-gray-700 rounded-xl p-4 bg-[#1a1a1a]">
            {manualItems.length === 0 && (
              <p className="text-gray-400">No manual items added.</p>
            )}
            {manualItems.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-center mb-2">
                <input
                  type="text"
                  placeholder="Item name"
                  value={item.name}
                  onChange={e => updateManualItem(idx, 'name', e.target.value)}
                  className="flex-1 bg-[#2a2a2a] rounded-xl px-3 py-2 text-white border border-gray-600 focus:outline-none focus:border-purple-500"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Qty"
                  value={item.qty}
                  onChange={e =>
                    updateManualItem(idx, 'qty', Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-16 bg-[#2a2a2a] rounded-xl px-3 py-2 text-white border border-gray-600 focus:outline-none focus:border-purple-500"
                />
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="Rate"
                  value={item.rate}
                  onChange={e => updateManualItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                  className="w-24 bg-[#2a2a2a] rounded-xl px-3 py-2 text-white border border-gray-600 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => removeManualItem(idx)}
                  className="p-2 bg-red-600 rounded-lg hover:bg-red-700 text-white"
                  aria-label="Remove item"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={addManualItem}
              className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
            >
              + Add Item
            </button>
          </div>
        )}

        {/* Totals */}
        <div className="mb-6">
          <div className="flex justify-between text-white font-semibold mb-1">
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-white font-semibold mb-1">
            <span>Tax:</span>
            <span>₹{totalTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-white font-bold text-lg border-t border-gray-700 pt-2">
            <span>Grand Total:</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 rounded-xl hover:bg-gray-700 text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-xl text-white font-medium shadow-[0_0_20px_rgba(255,0,128,0.3)] hover:shadow-[0_0_30px_rgba(255,0,128,0.5)] transition-all duration-300"
          >
            Save Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
