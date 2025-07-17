import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Truck, 
  Plus, 
  Upload, 
  Save, 
  Check, 
  Edit, 
  Trash2,
  Calculator,
  FileText,
  Clock,
  Zap,
  Users,
  Download,
  AlertTriangle,
  Search,
  User
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { DeliveryChallan, Cage, Customer, BulkData } from '../../types/erp';

interface GroupedData {
  customerName: string;
  cages: BulkData['cages'];
  rate: number;
  vendorPrice: number;
}

interface Vendor {
  id: string;
  name: string;
  totalPurchases: number;
  lastPurchaseDate: Date;
  averageRate: number;
}

export default function DC() {
  const [deliveryChallans, setDeliveryChallans] = useState<DeliveryChallan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [currentDC, setCurrentDC] = useState<Partial<DeliveryChallan>>({
    dcNumber: '',
    date: new Date(),
    cages: [],
    totalBirds: 0,
    totalWeight: 0,
    confirmed: false
  });
  
  // New DC Entry States
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorSearch, setVendorSearch] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState<number>(0);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [showNewVendorForm, setShowNewVendorForm] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [duplicateAction, setDuplicateAction] = useState<'save-as-2' | 'overwrite' | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [existingDC, setExistingDC] = useState<DeliveryChallan | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  
  // Fast Invoice States
  const [bulkText, setBulkText] = useState('');
  const [groupedData, setGroupedData] = useState<GroupedData[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'dc' | 'fast'>('dc');
  
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');

  useEffect(() => {
    loadData();
    // Start auto-save
    dataService.startAutoSave(loadData, 5);
    
    return () => {
      dataService.stopAutoSave();
    };
    
    // Start auto-save
    dataService.startAutoSave(() => {
      if (currentDC.cages && currentDC.cages.length > 0) {
        handleAutoSave();
      }
    }, 5);

    return () => {
      dataService.stopAutoSave();
    };
  }, []);

  const loadData = async () => {
    const [dcs, customerList] = await Promise.all([
      dataService.getDeliveryChallans(),
      dataService.getCustomers()
    ]);
    setDeliveryChallans(dcs);
    setCustomers(customerList);
    
    // Load vendors from ledger or create mock data
    const mockVendors: Vendor[] = [
      { id: '1', name: 'Poultry Farm A', totalPurchases: 150000, lastPurchaseDate: new Date(), averageRate: 85.50 },
      { id: '2', name: 'Chicken Supplier B', totalPurchases: 200000, lastPurchaseDate: new Date(), averageRate: 87.25 },
      { id: '3', name: 'Farm Fresh Ltd', totalPurchases: 120000, lastPurchaseDate: new Date(), averageRate: 84.75 }
    ];
    setVendors(mockVendors);
  };

  const handleAutoSave = async () => {
    if (currentDC.id) {
      await dataService.updateDeliveryChallan(currentDC.id, currentDC as DeliveryChallan);
      setAutoSaveStatus('Auto-saved at ' + new Date().toLocaleTimeString());
      setTimeout(() => setAutoSaveStatus(''), 3000);
    }
  };

  const calculateTotals = (cages: Cage[]) => {
    const totalBirds = cages.reduce((sum, cage) => sum + cage.birdCount, 0);
    const totalWeight = cages.reduce((sum, cage) => sum + cage.weight, 0);
    return { totalBirds, totalWeight };
  };

  // Vendor Selection Functions
  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  const selectVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setVendorSearch(vendor.name);
    setShowVendorDropdown(false);
  };

  const addNewVendor = async () => {
    if (!newVendorName.trim()) return;
    
    const newVendor: Vendor = {
      id: Date.now().toString(),
      name: newVendorName.trim(),
      totalPurchases: 0,
      lastPurchaseDate: new Date(),
      averageRate: 0
    };
    
    setVendors([...vendors, newVendor]);
    setSelectedVendor(newVendor);
    setVendorSearch(newVendor.name);
    setNewVendorName('');
    setShowNewVendorForm(false);
    setShowVendorDropdown(false);
  };

  // Generate vendor code from vendor name
  const generateVendorCode = (vendorName: string): string => {
    const name = vendorName.toLowerCase().replace(/[^a-z]/g, '');
    
    // Common vendor code mappings
    const vendorMappings: { [key: string]: string } = {
      'suguna': 'sgn',
      'avee': 'ave',
      'venkateshwara': 'vnk',
      'skylark': 'sky',
      'godrej': 'gdr',
      'cargill': 'car',
      'cp': 'cp',
      'bharath': 'bhr',
      'srinivasa': 'sri',
      'krishna': 'krs'
    };
    
    // Check if vendor has a predefined mapping
    if (vendorMappings[name]) {
      return vendorMappings[name];
    }
    
    // Generate code from vendor name
    if (name.length <= 3) {
      return name;
    } else if (name.length <= 6) {
      return name.substring(0, 3);
    } else {
      // For longer names, take first letter + consonants
      const consonants = name.replace(/[aeiou]/g, '');
      if (consonants.length >= 3) {
        return consonants.substring(0, 3);
      } else {
        return name.substring(0, 3);
      }
    }
  };

  // Generate DC number with date and vendor code
  const generateDCNumber = async (date: Date, vendorName: string): Promise<string> => {
    const vendorCode = generateVendorCode(vendorName);
    
    // Format date as DDMMYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const dateCode = `${day}${month}${year}`;
    
    // Check for existing DCs on the same date with same vendor
    const existingDCs = await dataService.getDeliveryChallans();
    const sameDateDCs = existingDCs.filter(dc => {
      const dcDate = new Date(dc.date);
      return dcDate.toDateString() === date.toDateString() && 
             dc.vendorName === vendorName;
    });
    
    // Generate base DC number
    const baseDCNumber = `${vendorCode}${dateCode}`;
    
    // If no existing DCs, return base number
    if (sameDateDCs.length === 0) {
      return baseDCNumber;
    }
    
    // Generate sequence letter (a, b, c...)
    const sequenceLetter = String.fromCharCode(97 + sameDateDCs.length); // 97 = 'a'
    return `${baseDCNumber}${sequenceLetter}`;
  };

  // DC Functions
  const handleBulkPaste = () => {
    const parsed = dataService.parseBulkData(bulkText);
    const newCages: Cage[] = parsed.cages.map((cage, index) => ({
      id: Date.now().toString() + index,
      cageNo: cage.cageNo,
      birdCount: cage.birdCount,
      weight: cage.weight,
      sellingRate: 0, // Removed selling rate
      isBilled: false,
      dcId: currentDC.id || ''
    }));

    const { totalBirds, totalWeight } = calculateTotals(newCages);
    
    setCurrentDC({
      ...currentDC,
      cages: newCages,
      totalBirds,
      totalWeight
    });
    
    setBulkText('');
    setShowBulkInput(false);
  };

  const addCage = () => {
    if (currentDC.cages && currentDC.cages.length < 60) {
      const newCage: Cage = {
        id: Date.now().toString(),
        cageNo: currentDC.cages.length + 1,
        birdCount: 0,
        weight: 0,
        sellingRate: 0,
        isBilled: false,
        dcId: currentDC.id || ''
      };
      
      const updatedCages = [...currentDC.cages, newCage];
      const { totalBirds, totalWeight } = calculateTotals(updatedCages);
      
      setCurrentDC({
        ...currentDC,
        cages: updatedCages,
        totalBirds,
        totalWeight
      });
    }
  };

  const updateCage = (cageId: string, field: keyof Cage, value: number) => {
    if (!currentDC.cages) return;
    
    const updatedCages = currentDC.cages.map(cage =>
      cage.id === cageId ? { ...cage, [field]: value } : cage
    );
    
    const { totalBirds, totalWeight } = calculateTotals(updatedCages);
    
    setCurrentDC({
      ...currentDC,
      cages: updatedCages,
      totalBirds,
      totalWeight
    });
  };

  const removeCage = (cageId: string) => {
    if (!currentDC.cages) return;
    
    const updatedCages = currentDC.cages.filter(cage => cage.id !== cageId);
    const { totalBirds, totalWeight } = calculateTotals(updatedCages);
    
    setCurrentDC({
      ...currentDC,
      cages: updatedCages,
      totalBirds,
      totalWeight
    });
  };

  // Check for duplicate DC
  const checkForDuplicateDate = async (date: Date) => {
    const existingDCs = await dataService.getDeliveryChallans();
    const dateStr = date.toDateString();
    const existing = existingDCs.find(dc => dc.date.toDateString() === dateStr);
    
    if (existing) {
      setExistingDC(existing);
      setShowDuplicateDialog(true);
      return true;
    }
    return false;
  };

  // Calculate automatic total
  const calculateAutomaticTotal = () => {
    if (!currentDC.totalWeight || !purchaseAmount) return 0;
    return currentDC.totalWeight * (purchaseAmount / currentDC.totalWeight);
  };

  const showSummaryDialog = () => {
    if (!selectedVendor || !currentDC.date || !purchaseAmount || !currentDC.cages || currentDC.cages.length === 0) {
      alert('Please fill all mandatory fields: Date, Vendor Name, Purchase Amount, and add at least one cage');
      return;
    }
    setShowSummary(true);
  };

  const saveDC = async () => {
    if (!selectedVendor || !currentDC.date || !purchaseAmount) {
      alert('Please fill all mandatory fields');
      return;
    }

    // Check for duplicate date
    const hasDuplicate = await checkForDuplicateDate(currentDC.date);
    if (hasDuplicate && !duplicateAction) {
      return; // Wait for user decision
    }

    try {
      let dcNumber = await generateDCNumber(currentDC.date, selectedVendor.name);
      
      if (duplicateAction === 'save-as-2') {
        // Check for existing DCs on the same date
        const existingDCs = await dataService.getDeliveryChallans();
        const sameDateDCs = existingDCs.filter(dc => {
          const dcDate = new Date(dc.date);
          return dcDate.toDateString() === currentDC.date!.toDateString() && 
                 dc.vendorName === selectedVendor.name;
        });
        
        // Generate new DC number with suffix
        const sequenceLetter = String.fromCharCode(97 + sameDateDCs.length);
        dcNumber = `${dcNumber}${sequenceLetter}`;
      } else if (duplicateAction === 'overwrite' && existingDC) {
        await dataService.deleteDeliveryChallan(existingDC.id);
        dcNumber = existingDC.dcNumber;
      }

      const dcData = {
        ...currentDC,
        dcNumber,
        vendorId: selectedVendor.id,
        vendorName: selectedVendor.name,
        purchaseAmount,
        totalAmount: calculateAutomaticTotal()
      };

      if (currentDC.id && duplicateAction !== 'overwrite') {
        await dataService.updateDeliveryChallan(currentDC.id, dcData as DeliveryChallan);
      } else {
        const newDC = await dataService.createDeliveryChallan(dcData as Omit<DeliveryChallan, 'id' | 'createdAt' | 'updatedAt'>);
        setCurrentDC(newDC);
      }

      // Update vendor ledger
      await updateVendorLedger();
      
      await loadData();
      setShowSummary(false);
      setShowDuplicateDialog(false);
      setDuplicateAction(null);
      alert('DC saved successfully and vendor ledger updated!');
    } catch (error) {
      alert('Error saving DC: ' + error);
    }
  };

  const updateVendorLedger = async () => {
    if (!selectedVendor) return;
    
    // Create ledger entry for vendor
    await dataService.createLedgerEntry({
      customerId: selectedVendor.id,
      customerName: selectedVendor.name,
      type: 'invoice', // Purchase from vendor perspective
      amount: purchaseAmount,
      balance: 0,
      description: `DC ${currentDC.dcNumber} - ${currentDC.totalWeight}kg`,
      referenceId: currentDC.id,
      date: currentDC.date || new Date()
    });
  };

  const confirmDC = async () => {
    if (!currentDC.id) {
      await saveDC();
    }
    
    await dataService.updateDeliveryChallan(currentDC.id!, { confirmed: true });
    setCurrentDC({ ...currentDC, confirmed: true });
    await loadData();
  };

  const newDC = () => {
    setCurrentDC({
      dcNumber: '',
      date: new Date(),
      cages: [],
      totalBirds: 0,
      totalWeight: 0,
      confirmed: false
    });
    setSelectedVendor(null);
    setVendorSearch('');
    setPurchaseAmount(0);
    setDuplicateAction(null);
  };

  // Fast Invoice Functions (unchanged)
  const parseBulkDCData = () => {
    const lines = bulkText.trim().split('\n');
    const grouped: { [key: string]: BulkData['cages'] } = {};
    let currentCustomer = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (!/^\d/.test(trimmed) && /[a-zA-Z]/.test(trimmed) && trimmed.length > 2) {
        currentCustomer = trimmed;
        if (!grouped[currentCustomer]) {
          grouped[currentCustomer] = [];
        }
        continue;
      }

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

        const totalBirds = group.cages.reduce((sum, cage) => sum + cage.birdCount, 0);
        const totalWeight = group.cages.reduce((sum, cage) => sum + cage.weight, 0);
        const subtotal = totalWeight * group.rate;
        const tax = subtotal * 0.18;
        const total = subtotal + tax;

        const invoice = {
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
          paymentMethod: 'cash' as const,
          status: 'draft' as const,
          isManual: true,
          version: '1.0',
          weightLoss: 0,
          additionalCharges: 0,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        };

        const createdInvoice = await dataService.createInvoice(invoice);
        
        const filename = `I${createdInvoice.version}_${customer.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}_1.pdf`;
        
        setResults(prev => [...prev, `✅ Invoice ${createdInvoice.invoiceNumber} created for ${customer!.name} - ₹${total.toFixed(2)}`]);
        setResults(prev => [...prev, `📄 PDF: ${filename}`]);
      }
      
      setResults(prev => [...prev, `🎉 Fast Invoice generation completed!`]);
      
    } catch (error) {
      setResults(prev => [...prev, `❌ Error: ${error}`]);
    } finally {
      setProcessing(false);
    }
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
          <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 shadow-lg">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">DC Management</h1>
            <p className="text-gray-400">Delivery Challan & Fast Invoice Generation</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {autoSaveStatus && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <Clock className="w-4 h-4" />
              {autoSaveStatus}
            </div>
          )}
          <button
            onClick={newDC}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-xl text-white font-medium shadow-[0_0_20px_rgba(255,0,128,0.3)] hover:shadow-[0_0_30px_rgba(255,0,128,0.5)] transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            New DC
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-[#2a2a2a] rounded-2xl p-2 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('dc')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'dc'
                ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white shadow-[0_0_20px_rgba(0,255,255,0.3)]'
                : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
            }`}
          >
            <Truck className="w-5 h-5" />
            Delivery Challan
          </button>
          <button
            onClick={() => setActiveTab('fast')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'fast'
                ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white shadow-[0_0_20px_rgba(255,165,0,0.3)]'
                : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
            }`}
          >
            <Zap className="w-5 h-5" />
            Fast Invoice
          </button>
        </div>
      </div>

      {/* DC Tab Content */}
      {activeTab === 'dc' && (
        <div className="space-y-6">
          {/* DC Form */}
          <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Date Field */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={currentDC.date ? currentDC.date.toISOString().split('T')[0] : ''}
                  onChange={(e) => setCurrentDC({ ...currentDC, date: new Date(e.target.value) })}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white focus:border-purple-500 focus:outline-none shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]"
                  required
                />
              </div>
              
              {/* Vendor Selection */}
              <div className="relative">
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Vendor Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={vendorSearch}
                    onChange={(e) => {
                      setVendorSearch(e.target.value);
                      setShowVendorDropdown(true);
                    }}
                    onFocus={() => setShowVendorDropdown(true)}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]"
                    placeholder="Search or select vendor..."
                    required
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
                
                {/* Vendor Dropdown */}
                {showVendorDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-[#1a1a1a] border border-gray-600 rounded-xl shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a] max-h-48 overflow-y-auto">
                    {filteredVendors.map(vendor => (
                      <button
                        key={vendor.id}
                        onClick={() => selectVendor(vendor)}
                        className="w-full text-left px-4 py-3 hover:bg-[#2a2a2a] text-white border-b border-gray-700 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{vendor.name}</span>
                          <span className="text-gray-400 text-sm">₹{vendor.averageRate}/kg</span>
                        </div>
                      </button>
                    ))}
                    
                    {/* Add New Vendor Option */}
                    <button
                      onClick={() => {
                        setShowNewVendorForm(true);
                        setShowVendorDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[#2a2a2a] text-green-400 border-t border-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add New Vendor
                      </div>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Purchase Amount */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Purchase Amount (₹/kg) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]"
                  placeholder="Enter rate per kg"
                  required
                />
              </div>
            </div>

            {/* Selected Vendor Info */}
            {selectedVendor && (
              <div className="mb-6 p-4 bg-[#1a1a1a] rounded-xl shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">{selectedVendor.name}</p>
                    <p className="text-gray-400 text-sm">
                      Total Purchases: ₹{selectedVendor.totalPurchases.toLocaleString()} | 
                      Avg Rate: ₹{selectedVendor.averageRate}/kg
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Input */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => setShowBulkInput(!showBulkInput)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] rounded-xl text-gray-300 hover:text-white transition-colors duration-200 shadow-[4px_4px_8px_#0f0f0f,-4px_-4px_8px_#3a3a3a]"
                >
                  <Upload className="w-4 h-4" />
                  Bulk Paste Data
                </button>
                
                <button
                  onClick={addCage}
                  disabled={currentDC.cages && currentDC.cages.length >= 60}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,255,0,0.3)]"
                >
                  <Plus className="w-4 h-4" />
                  Add Cage ({currentDC.cages?.length || 0}/60)
                </button>
              </div>

              {showBulkInput && (
                <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_4px_4px_8px_#0f0f0f,inset_-4px_-4px_8px_#2a2a2a]">
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder="Paste data in format:&#10;1 50 2.5&#10;2 45 2.3&#10;3 52 2.7"
                    className="w-full h-32 px-3 py-2 bg-[#0f0f0f] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleBulkPaste}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white font-medium"
                    >
                      Parse & Add
                    </button>
                    <button
                      onClick={() => setShowBulkInput(false)}
                      className="px-4 py-2 bg-gray-600 rounded-lg text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-5 h-5" />
                  <span className="font-medium">Total Birds</span>
                </div>
                <p className="text-2xl font-bold">{currentDC.totalBirds || 0}</p>
              </div>
              
              <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-5 h-5" />
                  <span className="font-medium">Total Weight</span>
                </div>
                <p className="text-2xl font-bold">{(currentDC.totalWeight || 0).toFixed(2)} kg</p>
              </div>
              
              <div className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-600 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">Purchase Rate</span>
                </div>
                <p className="text-2xl font-bold">₹{purchaseAmount}/kg</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-5 h-5" />
                  <span className="font-medium">Total Amount</span>
                </div>
                <p className="text-2xl font-bold">₹{((currentDC.totalWeight || 0) * purchaseAmount).toFixed(2)}</p>
              </div>
            </div>

            {/* Cages Table */}
            {currentDC.cages && currentDC.cages.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-xl overflow-hidden shadow-[inset_4px_4px_8px_#0f0f0f,inset_-4px_-4px_8px_#2a2a2a]">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-[#0f0f0f] sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Cage No</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Bird Count</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Weight (kg)</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Amount (₹)</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {currentDC.cages.map((cage, index) => (
                        <motion.tr
                          key={cage.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                          className="hover:bg-[#2a2a2a] transition-colors duration-200"
                        >
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={cage.cageNo}
                              onChange={(e) => updateCage(cage.id, 'cageNo', parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 bg-[#0f0f0f] border border-gray-600 rounded text-white text-sm focus:border-purple-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={cage.birdCount}
                              onChange={(e) => updateCage(cage.id, 'birdCount', parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 bg-[#0f0f0f] border border-gray-600 rounded text-white text-sm focus:border-purple-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.1"
                              value={cage.weight}
                              onChange={(e) => updateCage(cage.id, 'weight', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 bg-[#0f0f0f] border border-gray-600 rounded text-white text-sm focus:border-purple-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-green-400 font-medium">
                              ₹{(cage.weight * purchaseAmount).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => removeCage(cage.id)}
                              className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={showSummaryDialog}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-medium shadow-[0_0_20px_rgba(0,255,0,0.3)] hover:shadow-[0_0_30px_rgba(0,255,0,0.5)] transition-all duration-300"
              >
                <Save className="w-5 h-5" />
                Save DC
              </button>
              
              {currentDC.id && !currentDC.confirmed && (
                <button
                  onClick={confirmDC}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-medium shadow-[0_0_20px_rgba(0,0,255,0.3)] hover:shadow-[0_0_30px_rgba(0,0,255,0.5)] transition-all duration-300"
                >
                  <Check className="w-5 h-5" />
                  Confirm DC
                </button>
              )}
              
              {currentDC.confirmed && (
                <div className="flex items-center gap-2 text-green-400">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">DC Confirmed</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fast Invoice Tab Content (unchanged) */}
      {activeTab === 'fast' && (
        <div className="space-y-6">
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
                      result.startsWith('📄') ? 'text-blue-400' :
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
      )}

      {/* New Vendor Form Modal */}
      {showNewVendorForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] rounded-2xl p-6 w-full max-w-md shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
            <h3 className="text-xl font-semibold text-white mb-4">Add New Vendor</h3>
            <input
              type="text"
              value={newVendorName}
              onChange={(e) => setNewVendorName(e.target.value)}
              placeholder="Enter vendor name"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={addNewVendor}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-medium"
              >
                Add Vendor
              </button>
              <button
                onClick={() => {
                  setShowNewVendorForm(false);
                  setNewVendorName('');
                }}
                className="flex-1 px-4 py-2 bg-gray-600 rounded-xl text-white font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Date Dialog */}
      {showDuplicateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] rounded-2xl p-6 w-full max-w-md shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <h3 className="text-xl font-semibold text-white">DC Already Exists</h3>
            </div>
            <p className="text-gray-400 mb-6">
              DC already exists for {currentDC.date?.toLocaleDateString()}. Would you like to:
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setDuplicateAction('save-as-2');
                  saveDC();
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-medium"
              >
                Save as DC-2
              </button>
              <button
                onClick={() => {
                  setDuplicateAction('overwrite');
                  saveDC();
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl text-white font-medium"
              >
                Overwrite Existing DC
              </button>
              <button
                onClick={() => {
                  setShowDuplicateDialog(false);
                  setDuplicateAction(null);
                }}
                className="w-full px-4 py-3 bg-gray-600 rounded-xl text-white font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Dialog */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] rounded-2xl p-6 w-full max-w-lg shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
            <h3 className="text-xl font-semibold text-white mb-6">DC Summary</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">Date:</span>
                <span className="text-white">{currentDC.date?.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Vendor:</span>
                <span className="text-white">{selectedVendor?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">DC Number:</span>
                <span className="text-white">{selectedVendor && currentDC.date ? generateVendorCode(selectedVendor.name) + currentDC.date.getDate().toString().padStart(2, '0') + (currentDC.date.getMonth() + 1).toString().padStart(2, '0') + currentDC.date.getFullYear().toString().slice(-2) : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Birds:</span>
                <span className="text-white">{currentDC.totalBirds}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Weight:</span>
                <span className="text-white">{currentDC.totalWeight?.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Purchase Rate:</span>
                <span className="text-white">₹{purchaseAmount}/kg</span>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-4">
                <span className="text-gray-400 font-medium">Total Amount:</span>
                <span className="text-green-400 font-bold text-lg">
                  ₹{((currentDC.totalWeight || 0) * purchaseAmount).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={saveDC}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-medium"
              >
                Confirm & Save
              </button>
              <button
                onClick={() => setShowSummary(false)}
                className="flex-1 px-6 py-3 bg-gray-600 rounded-xl text-white font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DC History */}
      <div className="bg-[#2a2a2a] rounded-2xl shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">Recent Delivery Challans ({deliveryChallans.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">DC Number</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Vendor</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Code</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Weight</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Rate</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {deliveryChallans.slice(0, 30).map((dc, index) => (
                <motion.tr
                  key={dc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="hover:bg-[#1a1a1a] transition-colors duration-200"
                >
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{dc.dcNumber}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-300">{dc.date.toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white">{(dc as any).vendorName || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-mono">
                      {generateVendorCode((dc as any).vendorName || '')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white">{dc.totalWeight.toFixed(2)} kg</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-green-400">₹{(dc as any).purchaseRate || 0}/kg</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-green-400">₹{((dc as any).totalAmount || 0).toFixed(2)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      dc.confirmed 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }`}>
                      {dc.confirmed ? 'Confirmed' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentDC(dc)}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors duration-200"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {deliveryChallans.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-gray-400">No delivery challans found. Create your first DC above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}