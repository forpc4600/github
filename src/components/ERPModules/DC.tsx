import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Truck, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Save,
  Calendar,
  User,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { DeliveryChallan, Cage } from '../../types/erp';

export default function DC() {
  const [deliveryChallans, setDeliveryChallans] = useState<DeliveryChallan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedVendor, setSelectedVendor] = useState<{ name: string; saved?: boolean } | null>(null);
  const [vendorSearch, setVendorSearch] = useState('');
  const [purchaseRate, setPurchaseRate] = useState<number>(0);
  const [cages, setCages] = useState<Omit<Cage, 'id' | 'dcId'>[]>([]);
  const [manualWeighing, setManualWeighing] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingDC, setPendingDC] = useState<any>(null);
  const [savedVendors, setSavedVendors] = useState<string[]>([]);

  // Predefined vendor codes
  const vendorCodes: { [key: string]: string } = {
    'suguna': 'sgn',
    'avee': 'ave',
    'venkateshwara': 'vnk',
    'skylark': 'sky',
    'godrej': 'gdj',
    'cp': 'cp',
    'venkys': 'vnk',
    'hatsun': 'hts',
    'heritage': 'htg',
    'amul': 'aml'
  };

  useEffect(() => {
    loadData();
    loadSavedVendors();
  }, []);

  const loadData = async () => {
    try {
      const dcList = await dataService.getDeliveryChallans();
      setDeliveryChallans(dcList);
    } catch (error) {
      console.error('Error loading DCs:', error);
    }
  };

  const loadSavedVendors = () => {
    try {
      const saved = localStorage.getItem('saved_vendors');
      if (saved) {
        setSavedVendors(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved vendors:', error);
    }
  };

  const saveVendor = (vendorName: string) => {
    if (!savedVendors.includes(vendorName)) {
      const updated = [...savedVendors, vendorName];
      setSavedVendors(updated);
      localStorage.setItem('saved_vendors', JSON.stringify(updated));
    }
  };

  const generateVendorCode = (vendorName: string): string => {
    const name = vendorName.toLowerCase().trim();
    
    // Check predefined mappings first
    if (vendorCodes[name]) {
      return vendorCodes[name];
    }
    
    // Generate code from vendor name
    const words = name.split(/\s+/);
    if (words.length > 1) {
      // Multi-word: take first letter of each word
      return words.map(word => word[0]).join('').substring(0, 4);
    } else {
      // Single word: take consonants or first 3-4 chars
      const consonants = name.replace(/[aeiou]/g, '');
      if (consonants.length >= 3) {
        return consonants.substring(0, 4);
      }
      return name.substring(0, 4);
    }
  };

  const generateDCNumber = (vendorName: string, date: Date): string => {
    const vendorCode = generateVendorCode(vendorName);
    const dateStr = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).replace(/\//g, '');

    // Check for existing DCs on same date with same vendor
    const sameVendorSameDate = deliveryChallans.filter(dc => {
      const dcDate = new Date(dc.date);
      return dc.vendorName.toLowerCase() === vendorName.toLowerCase() &&
             dcDate.toDateString() === date.toDateString();
    });

    if (sameVendorSameDate.length === 0) {
      return `${vendorCode}${dateStr}`;
    } else {
      const sequence = String.fromCharCode(97 + sameVendorSameDate.length); // a, b, c...
      return `${vendorCode}${dateStr}${sequence}`;
    }
  };

  const getAllVendors = () => {
    const predefinedVendors = Object.keys(vendorCodes).map(name => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      saved: false
    }));
    
    const savedVendorObjects = savedVendors.map(name => ({
      name,
      saved: true
    }));

    // Combine and deduplicate
    const allVendors = [...savedVendorObjects, ...predefinedVendors];
    const uniqueVendors = allVendors.filter((vendor, index, self) => 
      index === self.findIndex(v => v.name.toLowerCase() === vendor.name.toLowerCase())
    );

    return uniqueVendors.filter(vendor =>
      vendor.name.toLowerCase().includes(vendorSearch.toLowerCase())
    );
  };

  const addCage = () => {
    setCages([...cages, {
      cageNo: cages.length + 1,
      birdCount: 0,
      weight: 0,
      sellingRate: 0,
      isBilled: false
    }]);
  };

  const updateCage = (index: number, field: keyof Omit<Cage, 'id' | 'dcId'>, value: number) => {
    const updatedCages = cages.map((cage, i) => 
      i === index ? { ...cage, [field]: value } : cage
    );
    setCages(updatedCages);
  };

  const removeCage = (index: number) => {
    setCages(cages.filter((_, i) => i !== index));
  };

  const parseBulkData = () => {
    if (!bulkData.trim()) return;

    try {
      const parsed = dataService.parseBulkData(bulkData);
      
      if (parsed.customerName && !selectedVendor) {
        setSelectedVendor({ name: parsed.customerName, saved: false });
        setVendorSearch(parsed.customerName);
      }

      if (parsed.cages.length > 0) {
        const newCages = parsed.cages.map((cage, index) => ({
          cageNo: cage.cageNo || (cages.length + index + 1),
          birdCount: cage.birdCount,
          weight: cage.weight,
          sellingRate: 0,
          isBilled: false
        }));
        setCages([...cages, ...newCages]);
      }

      setBulkData('');
    } catch (error) {
      alert('Error parsing bulk data: ' + error);
    }
  };

  const validateForm = (): boolean => {
    if (!selectedDate) {
      alert('Please select a date');
      return false;
    }
    
    if (!selectedVendor?.name) {
      alert('Please select a vendor');
      return false;
    }
    
    if (purchaseRate <= 0) {
      alert('Please enter a valid purchase rate');
      return false;
    }
    
    if (cages.length === 0) {
      alert('Please add at least one cage');
      return false;
    }

    return true;
  };

  const checkForExistingDC = (): boolean => {
    if (!selectedVendor) return false;
    
    const selectedDateObj = new Date(selectedDate);
    const existingDC = deliveryChallans.find(dc => {
      const dcDate = new Date(dc.date);
      return dc.vendorName.toLowerCase() === selectedVendor.name.toLowerCase() &&
             dcDate.toDateString() === selectedDateObj.toDateString();
    });

    return !!existingDC;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const dcData = {
      dcNumber: generateDCNumber(selectedVendor!.name, new Date(selectedDate)),
      date: new Date(selectedDate),
      vendorName: selectedVendor!.name,
      purchaseRate,
      cages: cages.map(cage => ({
        ...cage,
        dcId: '', // Will be set after creation
        id: `cage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })),
      totalBirds: cages.reduce((sum, cage) => sum + cage.birdCount, 0),
      totalWeight: cages.reduce((sum, cage) => sum + cage.weight, 0),
      manualWeighing,
      confirmed: false
    };

    setPendingDC(dcData);

    if (checkForExistingDC()) {
      setShowConfirmation(true);
    } else {
      saveDC(dcData);
    }
  };

  const saveDC = async (dcData: any) => {
    try {
      // Save vendor for future use
      if (selectedVendor) {
        saveVendor(selectedVendor.name);
      }

      await dataService.createDeliveryChallan(dcData);
      await loadData();
      resetForm();
      setShowForm(false);
      alert('DC saved successfully!');
    } catch (error) {
      alert('Error saving DC: ' + error);
    }
  };

  const resetForm = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSelectedVendor(null);
    setVendorSearch('');
    setPurchaseRate(0);
    setCages([]);
    setManualWeighing(false);
    setBulkData('');
    setShowConfirmation(false);
    setPendingDC(null);
  };

  const confirmSave = () => {
    if (pendingDC) {
      saveDC(pendingDC);
    }
    setShowConfirmation(false);
  };

  const totalBirds = cages.reduce((sum, cage) => sum + cage.birdCount, 0);
  const totalWeight = cages.reduce((sum, cage) => sum + cage.weight, 0);
  const totalValue = totalWeight * purchaseRate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Delivery Challan (DC)</h1>
            <p className="text-gray-400">Manage incoming stock deliveries</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-xl text-white font-medium shadow-[0_0_20px_rgba(255,0,128,0.3)] hover:shadow-[0_0_30px_rgba(255,0,128,0.5)] transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          New DC
        </button>
      </div>

      {/* DC Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
          <div className="flex items-center gap-3 mb-2">
            <Truck className="w-5 h-5 text-blue-400" />
            <h3 className="text-gray-400 text-sm font-medium">Total DCs</h3>
          </div>
          <p className="text-3xl font-bold text-white">{deliveryChallans.length}</p>
        </div>
        <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="text-gray-400 text-sm font-medium">Confirmed</h3>
          </div>
          <p className="text-3xl font-bold text-green-400">
            {deliveryChallans.filter(dc => dc.confirmed).length}
          </p>
        </div>
        <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <h3 className="text-gray-400 text-sm font-medium">Pending</h3>
          </div>
          <p className="text-3xl font-bold text-yellow-400">
            {deliveryChallans.filter(dc => !dc.confirmed).length}
          </p>
        </div>
        <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-purple-400" />
            <h3 className="text-gray-400 text-sm font-medium">Total Birds</h3>
          </div>
          <p className="text-3xl font-bold text-purple-400">
            {deliveryChallans.reduce((sum, dc) => sum + dc.totalBirds, 0)}
          </p>
        </div>
      </div>

      {/* DC Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Create New Delivery Challan</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="p-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors duration-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
                  <h4 className="text-white font-medium mb-4">Basic Information</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Date</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Vendor</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={vendorSearch}
                          onChange={(e) => setVendorSearch(e.target.value)}
                          placeholder="Search or type vendor name..."
                          className="w-full pl-10 pr-4 py-2 bg-[#0f0f0f] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      
                      {vendorSearch && (
                        <div className="mt-2 max-h-32 overflow-y-auto bg-[#0f0f0f] border border-gray-600 rounded-lg">
                          {getAllVendors().map((vendor, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setSelectedVendor(vendor);
                                setVendorSearch(vendor.name);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-[#2a2a2a] text-white flex items-center justify-between"
                            >
                              <span>{vendor.name}</span>
                              {vendor.saved && (
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                  Saved
                                </span>
                              )}
                            </button>
                          ))}
                          {!getAllVendors().some(v => v.name.toLowerCase() === vendorSearch.toLowerCase()) && (
                            <button
                              onClick={() => {
                                setSelectedVendor({ name: vendorSearch, saved: false });
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-[#2a2a2a] text-blue-400"
                            >
                              + Add "{vendorSearch}" as new vendor
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Purchase Rate (per kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={purchaseRate || ''}
                        onChange={(e) => setPurchaseRate(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                        placeholder="Enter rate per kg"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="manualWeighing"
                        checked={manualWeighing}
                        onChange={(e) => setManualWeighing(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="manualWeighing" className="text-gray-400 text-sm">
                        Manual Weighing
                      </label>
                    </div>
                  </div>
                </div>

                {/* Bulk Data Input */}
                <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
                  <h4 className="text-white font-medium mb-4">Bulk Data Entry</h4>
                  <textarea
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                    placeholder="Paste bulk data here (cage_no bird_count weight)..."
                    className="w-full h-24 px-3 py-2 bg-[#0f0f0f] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
                  />
                  <button
                    onClick={parseBulkData}
                    className="mt-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors duration-200"
                  >
                    Parse Data
                  </button>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Cages */}
                <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-medium">Cages</h4>
                    <button
                      onClick={addCage}
                      className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      Add Cage
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {cages.map((cage, index) => (
                      <div key={index} className="grid grid-cols-4 gap-2 items-center p-2 bg-[#0f0f0f] rounded-lg">
                        <input
                          type="number"
                          value={cage.cageNo}
                          onChange={(e) => updateCage(index, 'cageNo', parseInt(e.target.value) || 0)}
                          className="px-2 py-1 bg-[#2a2a2a] border border-gray-600 rounded text-white text-sm focus:border-purple-500 focus:outline-none"
                          placeholder="Cage #"
                        />
                        <input
                          type="number"
                          value={cage.birdCount}
                          onChange={(e) => updateCage(index, 'birdCount', parseInt(e.target.value) || 0)}
                          className="px-2 py-1 bg-[#2a2a2a] border border-gray-600 rounded text-white text-sm focus:border-purple-500 focus:outline-none"
                          placeholder="Birds"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={cage.weight}
                          onChange={(e) => updateCage(index, 'weight', parseFloat(e.target.value) || 0)}
                          className="px-2 py-1 bg-[#2a2a2a] border border-gray-600 rounded text-white text-sm focus:border-purple-500 focus:outline-none"
                          placeholder="Weight"
                        />
                        <button
                          onClick={() => removeCage(index)}
                          className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors duration-200"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
                  <h4 className="text-white font-medium mb-4">Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Birds:</span>
                      <span className="text-white">{totalBirds}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Weight:</span>
                      <span className="text-white">{totalWeight.toFixed(2)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rate per kg:</span>
                      <span className="text-white">₹{purchaseRate.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-700 pt-2">
                      <div className="flex justify-between text-lg font-semibold">
                        <span className="text-white">Total Value:</span>
                        <span className="text-green-400">₹{totalValue.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    {selectedVendor && (
                      <div className="mt-4 p-3 bg-[#0f0f0f] rounded-lg">
                        <p className="text-gray-400 text-sm">DC Number Preview:</p>
                        <p className="text-white font-mono">
                          {generateDCNumber(selectedVendor.name, new Date(selectedDate))}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-700">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-medium shadow-[0_0_20px_rgba(0,255,0,0.3)] hover:shadow-[0_0_30px_rgba(0,255,0,0.5)] transition-all duration-300"
              >
                <Save className="w-5 h-5" />
                Save DC
              </button>
              
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-6 py-3 bg-gray-600 rounded-xl text-white font-medium hover:bg-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] rounded-2xl p-6 w-full max-w-md shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
            <h3 className="text-xl font-semibold text-white mb-4">DC Already Exists</h3>
            <p className="text-gray-400 mb-6">
              A DC for {selectedVendor?.name} on {new Date(selectedDate).toLocaleDateString()} already exists. 
              This will create a new DC with sequence number.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={confirmSave}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
              >
                Create New DC
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                Go Back to Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DC List */}
      <div className="bg-[#2a2a2a] rounded-2xl shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">Recent Delivery Challans</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">DC Number</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Vendor</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Birds/Weight</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Rate</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {deliveryChallans.slice(0, 10).map((dc, index) => (
                <motion.tr
                  key={dc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="hover:bg-[#1a1a1a] transition-colors duration-200"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{dc.dcNumber}</p>
                      <p className="text-gray-400 text-sm">
                        {generateVendorCode(dc.vendorName).toUpperCase()}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white">{dc.vendorName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-300">{new Date(dc.date).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white">{dc.totalBirds} birds</p>
                      <p className="text-gray-400 text-sm">{dc.totalWeight.toFixed(2)} kg</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white">₹{dc.purchaseRate.toFixed(2)}/kg</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      dc.confirmed 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }`}>
                      {dc.confirmed ? 'Confirmed' : 'Pending'}
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
        </div>
      </div>
    </div>
  );
}