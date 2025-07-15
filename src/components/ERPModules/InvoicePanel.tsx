import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Edit, 
  Trash2,
  Calculator,
  User,
  Calendar,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { Invoice, Customer, DeliveryChallan, Cage } from '../../types/erp';

export default function InvoicePanel() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveryChallans, setDeliveryChallans] = useState<DeliveryChallan[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState<Partial<Invoice>>({});
  const [selectedDC, setSelectedDC] = useState<DeliveryChallan | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [isManualInvoice, setIsManualInvoice] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [invoiceList, customerList, dcList] = await Promise.all([
      dataService.getInvoices(),
      dataService.getCustomers(),
      dataService.getDeliveryChallans()
    ]);
    
    setInvoices(invoiceList);
    setCustomers(customerList);
    setDeliveryChallans(dcList.filter(dc => dc.confirmed));
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone.includes(customerSearch) ||
    customer.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const availableCages = selectedDC?.cages.filter(cage => !cage.isBilled) || [];

  const startNewInvoice = (manual: boolean = false) => {
    setIsManualInvoice(manual);
    setCurrentInvoice({
      invoiceNumber: `INV${Date.now()}`,
      cages: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      paidAmount: 0,
      dueAmount: 0,
      paymentMethod: 'cash',
      status: 'draft',
      isManual: manual,
      version: '1.0',
      weightLoss: 0,
      additionalCharges: 0,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    setSelectedDC(null);
    setSelectedCustomer(null);
    setCustomerSearch('');
    setShowInvoiceForm(true);
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCurrentInvoice({
      ...currentInvoice,
      customerId: customer.id,
      customerName: customer.name
    });
    setCustomerSearch(customer.name);
  };

  const selectDC = (dc: DeliveryChallan) => {
    setSelectedDC(dc);
    setCurrentInvoice({
      ...currentInvoice,
      dcId: dc.id
    });
  };

  const addCageToInvoice = (cage: Cage) => {
    if (!currentInvoice.cages) return;
    
    const invoiceCage = {
      cageNo: cage.cageNo,
      birdCount: cage.birdCount,
      weight: cage.weight,
      rate: cage.sellingRate || selectedCustomer?.defaultRate || 0,
      amount: cage.weight * (cage.sellingRate || selectedCustomer?.defaultRate || 0)
    };
    
    const updatedCages = [...currentInvoice.cages, invoiceCage];
    calculateInvoiceTotals(updatedCages);
  };

  const removeCageFromInvoice = (cageNo: number) => {
    if (!currentInvoice.cages) return;
    
    const updatedCages = currentInvoice.cages.filter(cage => cage.cageNo !== cageNo);
    calculateInvoiceTotals(updatedCages);
  };

  const updateCageInInvoice = (cageNo: number, field: string, value: number) => {
    if (!currentInvoice.cages) return;
    
    const updatedCages = currentInvoice.cages.map(cage => {
      if (cage.cageNo === cageNo) {
        const updated = { ...cage, [field]: value };
        if (field === 'weight' || field === 'rate') {
          updated.amount = updated.weight * updated.rate;
        }
        return updated;
      }
      return cage;
    });
    
    calculateInvoiceTotals(updatedCages);
  };

  const calculateInvoiceTotals = (cages: any[]) => {
    const subtotal = cages.reduce((sum, cage) => sum + cage.amount, 0);
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax + (currentInvoice.additionalCharges || 0);
    const dueAmount = total - (currentInvoice.paidAmount || 0);
    
    setCurrentInvoice({
      ...currentInvoice,
      cages,
      subtotal,
      tax,
      total,
      dueAmount
    });
  };

  const detectWeightLoss = () => {
    if (!selectedDC || !currentInvoice.cages) return 0;
    
    const originalWeight = selectedDC.cages
      .filter(cage => currentInvoice.cages!.some(ic => ic.cageNo === cage.cageNo))
      .reduce((sum, cage) => sum + cage.weight, 0);
    
    const invoiceWeight = currentInvoice.cages.reduce((sum, cage) => sum + cage.weight, 0);
    
    return Math.max(0, originalWeight - invoiceWeight);
  };

  const saveInvoice = async () => {
    if (!currentInvoice.customerId || !currentInvoice.cages || currentInvoice.cages.length === 0) {
      alert('Please select customer and add at least one cage');
      return;
    }

    try {
      const weightLoss = detectWeightLoss();
      const invoiceData = {
        ...currentInvoice,
        weightLoss
      } as Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>;

      if (currentInvoice.id) {
        await dataService.updateInvoice(currentInvoice.id, invoiceData);
      } else {
        await dataService.createInvoice(invoiceData);
      }

      // Mark cages as billed if from DC
      if (selectedDC && currentInvoice.cages) {
        for (const invoiceCage of currentInvoice.cages) {
          const dcCage = selectedDC.cages.find(c => c.cageNo === invoiceCage.cageNo);
          if (dcCage) {
            dcCage.isBilled = true;
            dcCage.invoiceId = currentInvoice.id;
          }
        }
        await dataService.updateDeliveryChallan(selectedDC.id, selectedDC);
      }

      await loadData();
      setShowInvoiceForm(false);
      alert('Invoice saved successfully!');
    } catch (error) {
      alert('Error saving invoice: ' + error);
    }
  };

  const generatePDF = async (invoice: Invoice) => {
    // This would use jsPDF to generate PDF
    const customer = customers.find(c => c.id === invoice.customerId);
    const filename = `I${invoice.version}_${customer?.name.replace(/\s+/g, '_')}_${new Date(invoice.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-')}_1.pdf`;
    
    // Simulate PDF generation
    console.log(`Generating PDF: ${filename}`);
    alert(`PDF generated: ${filename}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Invoice Management</h1>
            <p className="text-gray-400">Create and manage customer invoices</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => startNewInvoice(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white font-medium shadow-[0_0_15px_rgba(255,165,0,0.3)]"
          >
            <Edit className="w-4 h-4" />
            Manual Invoice
          </button>
          <button
            onClick={() => startNewInvoice(false)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-xl text-white font-medium shadow-[0_0_20px_rgba(255,0,128,0.3)] hover:shadow-[0_0_30px_rgba(255,0,128,0.5)] transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Invoice Form Modal */}
      {showInvoiceForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                {isManualInvoice ? 'Manual Invoice' : 'Create Invoice from DC'}
              </h3>
              <button
                onClick={() => setShowInvoiceForm(false)}
                className="p-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors duration-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Customer & DC Selection */}
              <div className="space-y-6">
                {/* Customer Selection */}
                <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-blue-400" />
                    <h4 className="text-white font-medium">Select Customer</h4>
                  </div>
                  
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Search customers..."
                      className="w-full pl-10 pr-4 py-2 bg-[#0f0f0f] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {filteredCustomers.map(customer => (
                      <button
                        key={customer.id}
                        onClick={() => selectCustomer(customer)}
                        className={`w-full text-left p-2 rounded-lg transition-colors duration-200 ${
                          selectedCustomer?.id === customer.id
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'hover:bg-[#2a2a2a] text-gray-300'
                        }`}
                      >
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-xs text-gray-400">{customer.phone}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* DC Selection (if not manual) */}
                {!isManualInvoice && (
                  <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-green-400" />
                      <h4 className="text-white font-medium">Select Delivery Challan</h4>
                    </div>
                    
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {deliveryChallans.map(dc => (
                        <button
                          key={dc.id}
                          onClick={() => selectDC(dc)}
                          className={`w-full text-left p-2 rounded-lg transition-colors duration-200 ${
                            selectedDC?.id === dc.id
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'hover:bg-[#2a2a2a] text-gray-300'
                          }`}
                        >
                          <p className="font-medium">{dc.dcNumber}</p>
                          <p className="text-xs text-gray-400">
                            {dc.date.toLocaleDateString()} • {dc.cages.filter(c => !c.isBilled).length} available cages
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Cages */}
                {selectedDC && (
                  <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
                    <h4 className="text-white font-medium mb-3">Available Cages</h4>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {availableCages.map(cage => (
                        <div
                          key={cage.id}
                          className="flex items-center justify-between p-2 bg-[#0f0f0f] rounded-lg"
                        >
                          <div>
                            <span className="text-white">Cage {cage.cageNo}</span>
                            <span className="text-gray-400 ml-2">{cage.birdCount}b, {cage.weight}kg</span>
                          </div>
                          <button
                            onClick={() => addCageToInvoice(cage)}
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors duration-200"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Invoice Details */}
              <div className="space-y-6">
                {/* Invoice Header */}
                <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Invoice Number</label>
                      <input
                        type="text"
                        value={currentInvoice.invoiceNumber || ''}
                        onChange={(e) => setCurrentInvoice({ ...currentInvoice, invoiceNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Due Date</label>
                      <input
                        type="date"
                        value={currentInvoice.dueDate ? new Date(currentInvoice.dueDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setCurrentInvoice({ ...currentInvoice, dueDate: new Date(e.target.value) })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Invoice Cages */}
                <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
                  <h4 className="text-white font-medium mb-3">Invoice Items</h4>
                  
                  {currentInvoice.cages && currentInvoice.cages.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {currentInvoice.cages.map((cage, index) => (
                        <div key={index} className="grid grid-cols-6 gap-2 items-center p-2 bg-[#0f0f0f] rounded-lg">
                          <div className="text-white text-sm">C{cage.cageNo}</div>
                          <input
                            type="number"
                            value={cage.birdCount}
                            onChange={(e) => updateCageInInvoice(cage.cageNo, 'birdCount', parseInt(e.target.value) || 0)}
                            className="px-2 py-1 bg-[#2a2a2a] border border-gray-600 rounded text-white text-sm focus:border-purple-500 focus:outline-none"
                            placeholder="Birds"
                          />
                          <input
                            type="number"
                            step="0.1"
                            value={cage.weight}
                            onChange={(e) => updateCageInInvoice(cage.cageNo, 'weight', parseFloat(e.target.value) || 0)}
                            className="px-2 py-1 bg-[#2a2a2a] border border-gray-600 rounded text-white text-sm focus:border-purple-500 focus:outline-none"
                            placeholder="Weight"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={cage.rate}
                            onChange={(e) => updateCageInInvoice(cage.cageNo, 'rate', parseFloat(e.target.value) || 0)}
                            className="px-2 py-1 bg-[#2a2a2a] border border-gray-600 rounded text-white text-sm focus:border-purple-500 focus:outline-none"
                            placeholder="Rate"
                          />
                          <div className="text-white text-sm">₹{cage.amount.toFixed(2)}</div>
                          <button
                            onClick={() => removeCageFromInvoice(cage.cageNo)}
                            className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors duration-200"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-4">No items added yet</p>
                  )}
                </div>

                {/* Invoice Totals */}
                <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subtotal:</span>
                      <span className="text-white">₹{(currentInvoice.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tax (18%):</span>
                      <span className="text-white">₹{(currentInvoice.tax || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Additional Charges:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={currentInvoice.additionalCharges || 0}
                        onChange={(e) => {
                          const charges = parseFloat(e.target.value) || 0;
                          setCurrentInvoice({ ...currentInvoice, additionalCharges: charges });
                          calculateInvoiceTotals(currentInvoice.cages || []);
                        }}
                        className="w-24 px-2 py-1 bg-[#0f0f0f] border border-gray-600 rounded text-white text-sm focus:border-purple-500 focus:outline-none text-right"
                      />
                    </div>
                    <div className="border-t border-gray-700 pt-2">
                      <div className="flex justify-between text-lg font-semibold">
                        <span className="text-white">Total:</span>
                        <span className="text-green-400">₹{(currentInvoice.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    {/* Weight Loss Detection */}
                    {selectedDC && detectWeightLoss() > 0 && (
                      <div className="flex items-center gap-2 text-yellow-400 text-sm mt-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Weight loss detected: {detectWeightLoss().toFixed(2)} kg</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Details */}
                <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
                  <h4 className="text-white font-medium mb-3">Payment Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Paid Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={currentInvoice.paidAmount || 0}
                        onChange={(e) => {
                          const paid = parseFloat(e.target.value) || 0;
                          const due = (currentInvoice.total || 0) - paid;
                          setCurrentInvoice({ 
                            ...currentInvoice, 
                            paidAmount: paid,
                            dueAmount: due,
                            status: due <= 0 ? 'paid' : paid > 0 ? 'partial' : 'draft'
                          });
                        }}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Payment Method</label>
                      <select
                        value={currentInvoice.paymentMethod || 'cash'}
                        onChange={(e) => setCurrentInvoice({ ...currentInvoice, paymentMethod: e.target.value as any })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      >
                        <option value="cash">Cash</option>
                        <option value="online">Online</option>
                        <option value="advance">Advance</option>
                        <option value="mixed">Mixed</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-gray-400">Due Amount: </span>
                    <span className="text-red-400 font-medium">₹{(currentInvoice.dueAmount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-700">
              <button
                onClick={saveInvoice}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-medium shadow-[0_0_20px_rgba(0,255,0,0.3)] hover:shadow-[0_0_30px_rgba(0,255,0,0.5)] transition-all duration-300"
              >
                <FileText className="w-5 h-5" />
                Save Invoice
              </button>
              
              <button
                onClick={() => setShowInvoiceForm(false)}
                className="px-6 py-3 bg-gray-600 rounded-xl text-white font-medium hover:bg-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice List */}
      <div className="bg-[#2a2a2a] rounded-2xl shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">Recent Invoices</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Invoice #</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Due Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {invoices.slice(0, 10).map((invoice, index) => (
                <motion.tr
                  key={invoice.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="hover:bg-[#1a1a1a] transition-colors duration-200"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-gray-400 text-sm">v{invoice.version}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white">{invoice.customerName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">₹{invoice.total.toFixed(2)}</p>
                      {invoice.dueAmount > 0 && (
                        <p className="text-red-400 text-sm">Due: ₹{invoice.dueAmount.toFixed(2)}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      invoice.status === 'paid' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      invoice.status === 'partial' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      invoice.status === 'overdue' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-300">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => generatePDF(invoice)}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors duration-200"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setCurrentInvoice(invoice);
                          setShowInvoiceForm(true);
                        }}
                        className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors duration-200"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}