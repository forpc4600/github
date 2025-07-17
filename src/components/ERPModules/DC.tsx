import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Truck, 
  Plus, 
  Search, 
  Save, 
  Calendar,
  User,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Trash2,
  Edit
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { DeliveryChallan, Customer, Cage, BulkData } from '../../types/erp';

export default function DC() {
  const [deliveryChallans, setDeliveryChallans] = useState<DeliveryChallan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentDC, setCurrentDC] = useState<Partial<DeliveryChallan>>({
    dcNumber: '',
    date: new Date(),
    vendorName: '',
    purchaseRate: 0,
    cages: [],
    totalBirds: 0,
    totalWeight: 0,
    manualWeighing: false,
    confirmed: false
  });
  
  const [selectedVendor, setSelectedVendor] = useState<Customer | null>(null);
  const [vendorSearch, setVendorSearch] = useState('');
  const [bulkData, setBulkData] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [duplicateAction, setDuplicateAction] = useState<'save-as-2' | 'overwrite' | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [existingDC, setExistingDC] = useState<DeliveryChallan | null>(null);

  useEffect(() => {
    loadData();
    // Auto-save every 5 minutes
    const interval = setInterval(() => {
      if (currentDC.cages && currentDC.cages.length > 0) {
        console.log('Auto-saving DC...');
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const [dcList, customerList] = await Promise.all([
      dataService.getDeliveryChallans(),
      dataService.getCustomers()
    ]);
    
    setDeliveryChallans(dcList);
    setCustomers(customerList);
  };

  const filteredVendors = customers.filter(customer =>
    customer.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
    customer.phone.includes(vendorSearch)
  );

  const selectVendor = (vendor: Customer) => {
    setSelectedVendor(vendor);
    setVendorSearch(vendor.name);
    setCurrentDC({
      ...currentDC,
      vendorName: vendor.name
    });
  };

  const addNewVendor = async () => {
    if (!vendorSearch.trim()) return;
    
    const newVendor: Omit<Customer, 'id' | 'createdAt'> = {
      name: vendorSearch.trim(),
      email: '',
      phone: '',
      address: '',
      customerType: 'wholesale',
      defaultRate: currentDC.purchaseRate || 0,
      balance: 0,
      advance: 0
    };
    
    const createdVendor = await dataService.createCustomer(newVendor);
    setCustomers([...customers, createdVendor]);
    selectVendor(createdVendor);
  };

  const parseBulkData = () => {
    if (!bulkData.trim()) return;
    
    const parsed = dataService.parseBulkData(bulkData);
    const newCages: Cage[] = parsed.cages.map((cage, index) => ({
      id: `cage-${Date.now()}-${index}`,
      cageNo: cage.cageNo,
      birdCount: cage.birdCount,
      weight: cage.weight,
      sellingRate: 0, // Removed selling rate
      isBilled: false,
      dcId: currentDC.id || ''
    }));
    
    updateCagesAndTotals(newCages);
    setBulkData('');
  };

  const addSingleCage = () => {
    const newCage: Cage = {
      id: `cage-${Date.now()}`,
      cageNo: (currentDC.cages?.length || 0) + 1,
      birdCount: 0,
      weight: 0,
      sellingRate: 0, // Removed selling rate
      isBilled: false,
      dcId: currentDC.id || ''
    };
    
    const updatedCages = [...(currentDC.cages || []), newCage];
    updateCagesAndTotals(updatedCages);
  };

  const updateCage = (cageId: string, field: keyof Cage, value: number) => {
    const updatedCages = (currentDC.cages || []).map(cage =>
      cage.id === cageId ? { ...cage, [field]: value } : cage
    );
    updateCagesAndTotals(updatedCages);
  };

  const removeCage = (cageId: string) => {
    const updatedCages = (currentDC.cages || []).filter(cage => cage.id !== cageId);
    updateCagesAndTotals(updatedCages);
  };

  const updateCagesAndTotals = (cages: Cage[]) => {
    const totalBirds = cages.reduce((sum, cage) => sum + cage.birdCount, 0);
    const totalWeight = cages.reduce((sum, cage) => sum + cage.weight, 0);
    
    setCurrentDC({
      ...currentDC,
      cages,
      totalBirds,
      totalWeight
    });
  };

  const checkForDuplicateDate = async (date: Date) => {
    const existingDCs = await dataService.getDeliveryChallans();
    const dateStr = date.toDateString();
    const existing = existingDCs.find(dc => new Date(dc.date).toDateString() === dateStr);
    
    if (existing) {
      setExistingDC(existing);
      setShowDuplicateDialog(true);
      return true;
    }
    return false;
  };

  const handleSave = async () => {
    // Validation
    if (!currentDC.date || !currentDC.vendorName || !currentDC.purchaseRate) {
      alert('Please fill all mandatory fields: Date, Vendor Name, and Purchase Rate');
      return;
    }

    if (!currentDC.cages || currentDC.cages.length === 0) {
      alert('Please add at least one cage');
      return;
    }

    // Check for duplicate date
    const hasDuplicate = await checkForDuplicateDate(currentDC.date);
    if (hasDuplicate && !duplicateAction) {
      return; // Wait for user decision
    }

    setShowSummary(true);
  };

  const confirmSave = async () => {
    try {
      let dcNumber = `DC${Date.now()}`;
      
      // Handle duplicate actions
      if (duplicateAction === 'save-as-2' && existingDC) {
        dcNumber = `${existingDC.dcNumber}-2`;
      } else if (duplicateAction === 'overwrite' && existingDC) {
        dcNumber = existingDC.dcNumber;
        await dataService.deleteDeliveryChallan(existingDC.id);
      }

      const dcData = {
        dcNumber,
        date: currentDC.date!,
        vendorName: currentDC.vendorName!,
        purchaseRate: currentDC.purchaseRate!,
        cages: currentDC.cages!,
        totalBirds: currentDC.totalBirds!,
        totalWeight: currentDC.totalWeight!,
        manualWeighing: false, // Removed manual weighing
        confirmed: true
      };

      await dataService.createDeliveryChallan(dcData);
      
      // Reset form
      setCurrentDC({
        dcNumber: '',
        date: new Date(),
        vendorName: '',
        purchaseRate: 0,
        cages: [],
        totalBirds: 0,
        totalWeight: 0,
        manualWeighing: false,
        confirmed: false
      });
      
      setSelectedVendor(null);
      setVendorSearch('');
      setShowSummary(false);
      setDuplicateAction(null);
      setShowDuplicateDialog(false);
      setExistingDC(null);
      
      await loadData();
      alert('DC saved successfully and ledger updated!');
    } catch (error) {
      alert('Error saving DC: ' + error);
    }
  };

  const handleDuplicateAction = (action: 'save-as-2' | 'overwrite') => {
    setDuplicateAction(action);
    setShowDuplicateDialog(false);
    setShowSummary(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Delivery Challan</h1>
            <p className="text-gray-400">Create and manage delivery challans</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Auto-save: Every 5 min</span>
        </div>
      </div>

      {/* DC Entry Form */}
      <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
        <h3 className="text-xl font-semibold text-white mb-6">New Delivery Challan</h3>
        
        {/* Mandatory Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Date */}
          <div>
            <label className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-2">
              <Calendar className="w-4 h-4" />
              Date *
            </label>
            <input
              type="date"
              value={currentDC.date ? new Date(currentDC.date).toISOString().split('T')[0] : ''}
              onChange={(e) => setCurrentDC({ ...currentDC, date: new Date(e.target.value) })}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white focus:border-purple-500 focus:outline-none shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]"
              required
            />
          </div>

          {/* Vendor Name */}
          <div>
            <label className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-2">
              <User className="w-4 h-4" />
              Vendor Name *
            </label>
            <div className="relative">
              <input
                type="text"
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                placeholder="Type to search vendors..."
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]"
                required
              />
              
              {/* Vendor Dropdown */}
              {vendorSearch && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-gray-600 rounded-xl shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a] z-10 max-h-48 overflow-y-auto">
                  {filteredVendors.length > 0 ? (
                    filteredVendors.map(vendor => (
                      <button
                        key={vendor.id}
                        onClick={() => selectVendor(vendor)}
                        className="w-full text-left px-4 py-3 hover:bg-[#2a2a2a] text-white transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl"
                      >
                        <p className="font-medium">{vendor.name}</p>
                        <p className="text-gray-400 text-sm">{vendor.phone}</p>
                      </button>
                    ))
                  ) : (
                    <button
                      onClick={addNewVendor}
                      className="w-full text-left px-4 py-3 hover:bg-[#2a2a2a] text-blue-400 transition-colors duration-200 rounded-xl"
                    >
                      + Add "{vendorSearch}" as new vendor
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Purchase Rate */}
          <div>
            <label className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-2">
              <DollarSign className="w-4 h-4" />
              Purchase Rate (₹/kg) *
            </label>
            <input
              type="number"
              step="0.01"
              value={currentDC.purchaseRate || ''}
              onChange={(e) => setCurrentDC({ ...currentDC, purchaseRate: parseFloat(e.target.value) || 0 })}
              placeholder="Enter rate per kg"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]"
              required
            />
          </div>
        </div>

        {/* Bulk Data Entry */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-2">
            <FileText className="w-4 h-4" />
            Bulk Data Entry (Format: cageNo birdCount weight)
          </label>
          <div className="flex gap-3">
            <textarea
              value={bulkData}
              onChange={(e) => setBulkData(e.target.value)}
              placeholder="1 50 2.5&#10;2 45 2.3&#10;3 48 2.7"
              className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a] resize-none"
              rows={3}
            />
            <button
              onClick={parseBulkData}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-medium shadow-[0_0_15px_rgba(0,255,0,0.3)] hover:shadow-[0_0_25px_rgba(0,255,0,0.5)] transition-all duration-300"
            >
              Parse Data
            </button>
          </div>
        </div>

        {/* Cage Management */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Cage Details</h4>
            <button
              onClick={addSingleCage}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-medium shadow-[0_0_15px_rgba(0,0,255,0.3)] hover:shadow-[0_0_25px_rgba(0,0,255,0.5)] transition-all duration-300"
            >
              <Plus className="w-4 h-4" />
              Add Cage
            </button>
          </div>

          {/* Cage List */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {currentDC.cages && currentDC.cages.length > 0 ? (
              currentDC.cages.map((cage, index) => (
                <motion.div
                  key={cage.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className="grid grid-cols-4 gap-4 items-center p-4 bg-[#1a1a1a] rounded-xl shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]"
                >
                  <div>
                    <label className="text-gray-400 text-xs">Cage No.</label>
                    <input
                      type="number"
                      value={cage.cageNo}
                      onChange={(e) => updateCage(cage.id, 'cageNo', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs">Birds</label>
                    <input
                      type="number"
                      value={cage.birdCount}
                      onChange={(e) => updateCage(cage.id, 'birdCount', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={cage.weight}
                      onChange={(e) => updateCage(cage.id, 'weight', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">
                      ₹{((cage.weight || 0) * (currentDC.purchaseRate || 0)).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeCage(cage.id)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No cages added yet. Use bulk entry or add individual cages.</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        {currentDC.cages && currentDC.cages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
              <p className="text-gray-400 text-sm">Total Cages</p>
              <p className="text-2xl font-bold text-white">{currentDC.cages.length}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
              <p className="text-gray-400 text-sm">Total Birds</p>
              <p className="text-2xl font-bold text-blue-400">{currentDC.totalBirds}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
              <p className="text-gray-400 text-sm">Total Weight</p>
              <p className="text-2xl font-bold text-green-400">{currentDC.totalWeight.toFixed(2)} kg</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
              <p className="text-gray-400 text-sm">Total Amount</p>
              <p className="text-2xl font-bold text-purple-400">
                ₹{((currentDC.totalWeight || 0) * (currentDC.purchaseRate || 0)).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-xl text-white font-medium shadow-[0_0_20px_rgba(255,0,128,0.3)] hover:shadow-[0_0_30px_rgba(255,0,128,0.5)] transition-all duration-300"
          >
            <Save className="w-5 h-5" />
            Save DC
          </button>
        </div>
      </div>

      {/* Recent Delivery Challans */}
      <div className="bg-[#2a2a2a] rounded-2xl shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">Recent Delivery Challans (Last 30)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">DC Number</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Vendor</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Birds</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Weight (kg)</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Rate (₹/kg)</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Total Amount</th>
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
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="hover:bg-[#1a1a1a] transition-colors duration-200"
                >
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{dc.dcNumber}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-300">{new Date(dc.date).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white">{dc.vendorName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-blue-400 font-medium">{dc.totalBirds}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-green-400 font-medium">{dc.totalWeight.toFixed(2)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-yellow-400 font-medium">₹{dc.purchaseRate?.toFixed(2) || '0.00'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-purple-400 font-medium">
                      ₹{((dc.totalWeight || 0) * (dc.purchaseRate || 0)).toFixed(2)}
                    </p>
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
                      <button className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors duration-200">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors duration-200">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {deliveryChallans.length === 0 && (
            <div className="text-center py-12">
              <Truck className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg">No delivery challans found</p>
              <p className="text-gray-500 text-sm">Create your first DC to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Duplicate Date Dialog */}
      {showDuplicateDialog && existingDC && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] rounded-2xl p-6 w-full max-w-md shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <h3 className="text-xl font-semibold text-white">DC Already Exists</h3>
            </div>
            
            <p className="text-gray-400 mb-6">
              DC already exists for {new Date(currentDC.date!).toLocaleDateString()}. 
              What would you like to do?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => handleDuplicateAction('save-as-2')}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-medium"
              >
                Save as DC-2
              </button>
              <button
                onClick={() => handleDuplicateAction('overwrite')}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white font-medium"
              >
                Overwrite Existing
              </button>
            </div>
            
            <button
              onClick={() => setShowDuplicateDialog(false)}
              className="w-full mt-3 px-4 py-2 bg-gray-600 rounded-xl text-white hover:bg-gray-700 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Save Summary Dialog */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] rounded-2xl p-6 w-full max-w-lg shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-semibold text-white">Confirm DC Details</h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Date</p>
                  <p className="text-white font-medium">{new Date(currentDC.date!).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Vendor</p>
                  <p className="text-white font-medium">{currentDC.vendorName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Birds</p>
                  <p className="text-blue-400 font-medium">{currentDC.totalBirds}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Weight</p>
                  <p className="text-green-400 font-medium">{currentDC.totalWeight?.toFixed(2)} kg</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Purchase Rate</p>
                  <p className="text-yellow-400 font-medium">₹{currentDC.purchaseRate?.toFixed(2)}/kg</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Amount</p>
                  <p className="text-purple-400 font-medium">
                    ₹{((currentDC.totalWeight || 0) * (currentDC.purchaseRate || 0)).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={confirmSave}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-medium shadow-[0_0_20px_rgba(0,255,0,0.3)]"
              >
                Confirm & Save
              </button>
              <button
                onClick={() => setShowSummary(false)}
                className="px-6 py-3 bg-gray-600 rounded-xl text-white font-medium hover:bg-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}