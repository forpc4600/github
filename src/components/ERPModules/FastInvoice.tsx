import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Upload, 
  Users, 
  Calculator, 
  FileText, 
  Download,
  Check,
  AlertTriangle
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { Customer, Invoice, BulkData } from '../../types/erp';

interface GroupedData {
  customerName: string;
  cages: BulkData['cages'];
  rate: number;
  vendorPrice: number;
}

export default function FastInvoicePanel() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bulkText, setBulkText] = useState('');
  const [groupedData, setGroupedData] = useState<GroupedData[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const customerList = await dataService.getCustomers();
    setCustomers(customerList);
  };

  const parseBulkDCData = () => {
    const lines = bulkText.trim().split('\n');
    const grouped: { [key: string]: BulkData['cages'] } = {};
    let currentCustomer = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check if line is customer name (contains letters, no numbers at start)
      if (!/^\d/.test(trimmed) && /[a-zA-Z]/.test(trimmed) && trimmed.length > 2) {
        currentCustomer = trimmed;
        if (!grouped[currentCustomer]) {
          grouped[currentCustomer] = [];
        }
        continue;
      }

      // Parse cage data: cageNo birdCount weight
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 3 && currentCustomer) {
        const cageNo = parseInt(parts[0]);
        const birdCount = parseInt(parts[1]);
        const weight = parseFloat(parts[2]);

        if (!isNaN(cageNo) && !isNaN(birdCount) && !isNaN(weight)) {
          grouped[currentCustomer].push({ cageNo, birdCount, weight });
        }
      }
    }

    // Convert to GroupedData format
    const groupedArray: GroupedData[] = Object.entries(grouped).map(([customerName, cages]) => ({
      customerName,
      cages,
      rate: 0,
      vendorPrice: 0
    }));

    setGroupedData(groupedArray);
  };

  const updateGroupRate = (index: number, field: 'rate' | 'vendorPrice', value: number) => {
    const updated = [...groupedData];
    updated[index][field] = value;
    setGroupedData(updated);
  };

  const generateInvoices = async () => {
    setProcessing(true);
    setResults([]);
    
    try {
      for (const group of groupedData) {
        if (group.rate === 0) {
          setResults(prev => [...prev, `❌ Skipped ${group.customerName}: No rate specified`]);
          continue;
        }

        // Find or create customer
        let customer = customers.find(c => 
          c.name.toLowerCase().includes(group.customerName.toLowerCase()) ||
          group.customerName.toLowerCase().includes(c.name.toLowerCase())
        );

        if (!customer) {
          customer = await dataService.createCustomer({
            name: group.customerName,
            email: '',
            phone: '',
            address: '',
            customerType: 'regular',
            defaultRate: group.rate,
            balance: 0,
            advance: 0
          });
          setResults(prev => [...prev, `✅ Created new customer: ${customer!.name}`]);
        }

        // Calculate totals
        const totalBirds = group.cages.reduce((sum, cage) => sum + cage.birdCount, 0);
        const totalWeight = group.cages.reduce((sum, cage) => sum + cage.weight, 0);
        const subtotal = totalWeight * group.rate;
        const tax = subtotal * 0.18; // 18% GST
        const total = subtotal + tax;

        // Create invoice
        const invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
          invoiceNumber: `FI${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          customerId: customer.id,
          customerName: customer.name,
          cages: group.cages.map(cage => ({
            cageNo: cage.cageNo,
            birdCount: cage.birdCount,
            weight: cage.weight,
            rate: group.rate,
            amount: cage.weight * group.rate
          })),
          subtotal,
          tax,
          total,
          paidAmount: 0,
          dueAmount: total,
          paymentMethod: 'cash',
          status: 'draft',
          isManual: true,
          version: '1.0',
          weightLoss: 0,
          additionalCharges: 0,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        };

        const createdInvoice = await dataService.createInvoice(invoice);
        
        // Generate PDF (placeholder)
        await generateInvoicePDF(createdInvoice, customer);
        
        setResults(prev => [...prev, `✅ Invoice ${createdInvoice.invoiceNumber} created for ${customer!.name} - ₹${total.toFixed(2)}`]);
      }
      
      setResults(prev => [...prev, `🎉 Fast Invoice generation completed!`]);
      
    } catch (error) {
      setResults(prev => [...prev, `❌ Error: ${error}`]);
    } finally {
      setProcessing(false);
    }
  };

  const generateInvoicePDF = async (invoice: Invoice, customer: Customer) => {
    // This would use jsPDF to generate PDF
    // For now, just simulate PDF generation
    const filename = `I${invoice.version}_${customer.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}_1.pdf`;
    
    // In real implementation, this would generate and download PDF
    console.log(`Generated PDF: ${filename}`);
    
    return filename;
  };

  const clearAll = () => {
    setBulkText('');
    setGroupedData([]);
    setResults([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Fast Invoice Generator</h1>
            <p className="text-gray-400">Bulk process DC data into invoices</p>
          </div>
        </div>
      </div>

      {/* Bulk Input Section */}
      <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
        <div className="flex items-center gap-3 mb-4">
          <Upload className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Paste Full DC Data</h3>
        </div>
        
        <div className="mb-4">
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="Paste data in format:&#10;Customer Name 1&#10;1 50 2.5&#10;2 45 2.3&#10;&#10;Customer Name 2&#10;3 52 2.7&#10;4 48 2.4"
            className="w-full h-48 px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]"
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={parseBulkDCData}
            disabled={!bulkText.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,0,255,0.3)] hover:shadow-[0_0_30px_rgba(0,0,255,0.5)] transition-all duration-300"
          >
            <Users className="w-5 h-5" />
            Parse & Group by Customer
          </button>
          
          <button
            onClick={clearAll}
            className="px-6 py-3 bg-gray-600 rounded-xl text-white font-medium hover:bg-gray-700 transition-colors duration-200"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Grouped Data Section */}
      {groupedData.length > 0 && (
        <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calculator className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Set Rates for Each Customer</h3>
            </div>
            
            <button
              onClick={generateInvoices}
              disabled={processing || groupedData.some(g => g.rate === 0)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,255,0,0.3)] hover:shadow-[0_0_30px_rgba(0,255,0,0.5)] transition-all duration-300"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Generate All Invoices
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            {groupedData.map((group, index) => {
              const totalBirds = group.cages.reduce((sum, cage) => sum + cage.birdCount, 0);
              const totalWeight = group.cages.reduce((sum, cage) => sum + cage.weight, 0);
              const estimatedAmount = totalWeight * group.rate;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
                    <div className="lg:col-span-2">
                      <h4 className="text-white font-medium text-lg">{group.customerName}</h4>
                      <p className="text-gray-400 text-sm">
                        {group.cages.length} cages • {totalBirds} birds • {totalWeight.toFixed(2)} kg
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Selling Rate (₹/kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={group.rate}
                        onChange={(e) => updateGroupRate(index, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Vendor Price (₹/kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={group.vendorPrice}
                        onChange={(e) => updateGroupRate(index, 'vendorPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Estimated Amount</label>
                      <p className="text-white font-medium text-lg">₹{estimatedAmount.toFixed(2)}</p>
                      {group.vendorPrice > 0 && (
                        <p className="text-green-400 text-sm">
                          Profit: ₹{((group.rate - group.vendorPrice) * totalWeight).toFixed(2)}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-center">
                      {group.rate === 0 ? (
                        <div className="flex items-center gap-2 text-yellow-400">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm">Set rate</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-400">
                          <Check className="w-4 h-4" />
                          <span className="text-sm">Ready</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Cage Details */}
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-sm">
                      {group.cages.map((cage, cageIndex) => (
                        <div key={cageIndex} className="bg-[#0f0f0f] rounded px-2 py-1">
                          <span className="text-gray-400">C{cage.cageNo}:</span>
                          <span className="text-white ml-1">{cage.birdCount}b, {cage.weight}kg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Processing Results</h3>
          </div>
          
          <div className="bg-[#1a1a1a] rounded-xl p-4 max-h-64 overflow-y-auto shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
            {results.map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="py-1 text-sm font-mono"
              >
                <span className={
                  result.startsWith('✅') ? 'text-green-400' :
                  result.startsWith('❌') ? 'text-red-400' :
                  result.startsWith('🎉') ? 'text-purple-400' :
                  'text-gray-300'
                }>
                  {result}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}