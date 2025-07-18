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
  Package,
  Weight,
  DollarSign,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { DeliveryChallan, Cage } from '../../types/erp';

interface Vendor {
  name: string;
  code: string;
  saved?: boolean;
}

export default function DC() {
  const [deliveryChallans, setDeliveryChallans] = useState<DeliveryChallan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorSearch, setVendorSearch] = useState('');
  const [purchaseRate, setPurchaseRate] = useState<number>(0);
  const [cages, setCages] = useState<Omit<Cage, 'id' | 'dcId'>[]>([]);
  const [manualWeighing, setManualWeighing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedVendors, setSavedVendors] = useState<Vendor[]>([]);

  const predefinedVendors: Vendor[] = [
    { name: 'Sagar Poultry Farm', code: 'sgr' },
    { name: 'Krishna Chicken Center', code: 'kcc' },
    { name: 'Balaji Poultry', code: 'blj' },
    { name: 'Shree Ganesh Farm', code: 'sgf' },
    { name: 'Radha Krishna Poultry', code: 'rkp' }
  ];

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

  const saveVendor = (vendor: Vendor) => {
    try {
      const existing = savedVendors.find(v => v.name === vendor.name);
      if (!existing) {
        const updated = [...savedVendors, { ...vendor, saved: true }];
        setSavedVendors(updated);
        localStorage.setItem('saved_vendors', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error saving vendor:', error);
    }
  };

  const allVendors = [
    ...savedVendors.map(v => ({ ...v, saved: true })),
    ...predefinedVendors.filter(pv => !savedVendors.some(sv => sv.name === pv.name))
  ];

  const filteredVendors = allVendors.filter(vendor =>
    vendor.name.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  const generateDCNumber = () => {
    if (!selectedVendor || !selectedDate) return '';
    
    const date = new Date(selectedDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const dateStr = `${day}${month}${year}`;
    
    const sameVendorSameDate = deliveryChallans.filter(dc => {
      const dcDate = new Date(dc.date);
      return dc.vendorName === selectedVendor.name &&
             dcDate.getDate() === date.getDate() &&
             dcDate.getMonth() === date.getMonth() &&
             dcDate.getFullYear() === date.getFullYear();
    });
    
    const sequence = sameVendorSameDate.length > 0 ? 
      String.fromCharCode(97 + sameVendorSameDate.length) : '';
    
    return `${selectedVendor.code}${dateStr}${sequence}`;
  };

  const selectVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setVendorSearch(vendor.name);
    saveVendor(vendor);
  };

  const addCage = () => {
    const newCage = {
      cageNo: cages.length + 1,
      birdCount: 0,
      weight: 0,
      sellingRate: 0,
      isBilled: false
    };
    setCages([...cages, newCage]);
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

  const calculateTotals = () => {
    const totalBirds = cages.reduce((sum, cage) => sum + cage.birdCount, 0);
    const totalWeight = cages.reduce((sum, cage) => sum + cage.weight, 0);
    return { totalBirds, totalWeight };
  };

  const resetForm = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSelectedVendor(null);
    setVendorSearch('');
    setPurchaseRate(0);
    setCages([]);
    setManualWeighing(false);
    setIsEditing(false);
    setEditingId(null);
  };

  const saveDC = async () => {
    console.log('Save DC clicked');
    
    // Validation
    if (!selectedDate) {
      alert('Please select a date');
      return;
    }

    if (!selectedVendor?.name) {
      alert('Please select a vendor');
      return;
    }

    if (!purchaseRate || purchaseRate <= 0) {
      alert('Please enter a valid purchase rate');
      return;
    }

    if (cages.length === 0) {
      alert('Please add at least one cage');
      return;
    }

    // Check for incomplete cages
    const incompleteCages = cages.filter(cage => 
      cage.birdCount <= 0 || cage.weight <= 0
    );

    if (incompleteCages.length > 0) {
      alert('Please fill bird count and weight for all cages');
      return;
    }

    try {
      console.log('Starting save process...');
      
      const { totalBirds, totalWeight } = calculateTotals();
      const dcNumber = generateDCNumber();

      const dcData = {
        dcNumber,
        date: new Date(selectedDate),
        vendorName: selectedVendor.name,
        purchaseRate,
        cages: cages.map(cage => ({
          ...cage,
          id: `cage_${Date.now()}_${Math.random()}`,
          dcId: '' // Will be set after creation
        })),
        totalBirds,
        totalWeight,
        manualWeighing,
        confirmed: false
      };

      console.log('DC Data to save:', dcData);

      if (isEditing && editingId) {
        await dataService.updateDeliveryChallan(editingId, dcData);
        console.log('DC updated successfully');
      } else {
        await dataService.createDeliveryChallan(dcData);
        console.log('DC created successfully');
      }

      await loadData();
      resetForm();
      setShowForm(false);
      alert('DC saved successfully!');
    } catch (error) {
      console.error('Error saving DC:', error);
      alert('Error saving DC: ' + error);
    }
  };

  const editDC = (dc: DeliveryChallan) => {
    setSelectedDate(dc.date.toISOString().split('T')[0]);
    setSelectedVendor({ name: dc.vendorName, code: dc.dcNumber.slice(0, 3) });
    setVendorSearch(dc.vendorName);
    setPurchaseRate(dc.purchaseRate);
    setCages(dc.cages.map(cage => ({
      cageNo: cage.cageNo,
      birdCount: cage.birdCount,
      weight: cage.weight,
      sellingRate: cage.sellingRate,
      isBilled: cage.isBilled
    })));
    setManualWeighing(dc.manualWeighing);
    setIsEditing(true);
    setEditingId(dc.id);
    setShowForm(true);
  };

  const deleteDC = async (id: string) => {
    if (confirm('Are you sure you want to delete this DC?')) {
      try {
        await dataService.deleteDeliveryChallan(id);
        await loadData();
        alert('DC deleted successfully!');
      } catch (error) {
        console.error('Error deleting DC:', error);
        alert('Error deleting DC: ' + error);
      }
    }
  };

  const confirmDC = async (id: string) => {
    try {
      await dataService.updateDeliveryChallan(id, { confirmed: true });
      await loadData();
      alert('DC confirmed successfully!');
    } catch (error) {
      console.error('Error confirming DC:', error);
      alert('Error confirming DC: ' + error);
    }
  };

  const { totalBirds, totalWeight } = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Delivery Challan</h1>
            <p className="text-gray-400">Manage incoming poultry deliveries</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-xl text-white font-medium shadow-[0_0_20px_rgba(255,0,128,0.3)] hover:shadow-[0_0_30px_rgba(255,0,128,0.5)] transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          New DC
        </button>
      </div>

      {/* DC Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                {isEditing ? 'Edit Delivery Challan' : 'Create New Delivery Challan'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors duration-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-6">
                {/* Date Selection */}
                <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <h4 className="text-white font-medium">Date</h4>
                  </div>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Vendor Selection */}
                <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-green-400" />
                    <h4 className="text-white font-medium">Vendor</h4>
                  </div>
                  
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={vendorSearch}
                      onChange={(e) => setVendorSearch(e.target.value)}
                      placeholder="Search or type vendor name..."
                      className="w-full pl-10 pr-4 py-2 bg-[#0f0f0f] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {filteredVendors.map(vendor => (
                      <button
                        key={vendor.name}
                        onClick={() => selectVendor(vendor)}
                        className={`w-full text-left p-2 rounded-lg transition-colors duration-200 ${
                          selectedVendor?.name === vendor.name
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'hover:bg-[#2a2a2a] text-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{vendor.name}</span>
                          {vendor.saved && (
                            <span className="text-xs text-green-400">Saved</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">Code: {vendor.code}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Purchase Rate */}
                <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-yellow-400" />
                    <h4 className="text-white font-medium">Purchase Rate (per kg)</h4>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={purchaseRate || ''}
                    onChange={(e) => setPurchaseRate(parseFloat(e.target.value) || 0)}
                    placeholder="Enter rate per kg"
                    className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* DC Number Preview */}
                {selectedVendor && selectedDate && (
                  <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
                    <h4 className="text-white font-medium mb-2">DC Number Preview</h4>
                    <p className="text-green-400 font-mono text-lg">{generateDCNumber()}</p>
                  </div>
                )}
              </div>

              {/* Right Column - Cages */}
              <div className="space-y-6">
                {/* Cage Management */}
                <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-orange-400" />
                      <h4 className="text-white font-medium">Cages</h4>
                    </div>
                    <button
                      onClick={addCage}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      Add Cage
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {cages.map((cage, index) => (
                      <div key={index} className="grid grid-cols-4 gap-2 items-center p-2 bg-[#0f0f0f] rounded-lg">
                        <div className="text-white text-sm">#{cage.cageNo}</div>
                        <input
                          type="number"
                          value={cage.birdCount || ''}
                          onChange={(e) => updateCage(index, 'birdCount', parseInt(e.target.value) || 0)}
                          placeholder="Birds"
                          className="px-2 py-1 bg-[#2a2a2a] border border-gray-600 rounded text-white text-sm focus:border-purple-500 focus:outline-none"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={cage.weight || ''}
                          onChange={(e) => updateCage(index, 'weight', parseFloat(e.target.value) || 0)}
                          placeholder="Weight"
                          className="px-2 py-1 bg-[#2a2a2a] border border-gray-600 rounded text-white text-sm focus:border-purple-500 focus:outline-none"
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

                  {cages.length === 0 && (
                    <p className="text-gray-400 text-center py-4">No cages added yet</p>
                  )}
                </div>

                {/* Totals */}
                {cages.length > 0 && (
                  <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
                    <h4 className="text-white font-medium mb-3">Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Total Birds</p>
                        <p className="text-2xl font-bold text-blue-400">{totalBirds}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Total Weight</p>
                        <p className="text-2xl font-bold text-green-400">{totalWeight.toFixed(1)} kg</p>
                      </div>
                    </div>
                    {purchaseRate > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <p className="text-gray-400 text-sm">Total Cost</p>
                        <p className="text-xl font-bold text-yellow-400">₹{(totalWeight * purchaseRate).toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Weighing Option */}
                <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={manualWeighing}
                      onChange={(e) => setManualWeighing(e.target.checked)}
                      className="w-4 h-4 text-purple-500 bg-[#0f0f0f] border-gray-600 rounded focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-white font-medium">Manual Weighing</span>
                      <p className="text-gray-400 text-sm">Check if weights were manually entered</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-700">
              <button
                onClick={saveDC}
                disabled={!selectedDate || !selectedVendor || purchaseRate <= 0 || cages.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-medium shadow-[0_0_20px_rgba(0,255,0,0.3)] hover:shadow-[0_0_30px_rgba(0,255,0,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {isEditing ? 'Update DC' : 'Save DC'}
              </button>
              
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-gray-600 rounded-xl text-white font-medium hover:bg-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DC List */}
      <div className="bg-[#2a2a2a] rounded-2xl shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">Delivery Challans</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">DC Number</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Vendor</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Birds/Weight</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Rate</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {deliveryChallans.map((dc, index) => (
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
                    <p className="text-gray-300">{new Date(dc.date).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white">{dc.vendorName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white">{dc.totalBirds} birds</p>
                      <p className="text-gray-400 text-sm">{dc.totalWeight.toFixed(1)} kg</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-green-400">₹{dc.purchaseRate}/kg</p>
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
                      {!dc.confirmed && (
                        <button
                          onClick={() => confirmDC(dc.id)}
                          className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors duration-200"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => editDC(dc)}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors duration-200"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteDC(dc.id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {deliveryChallans.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-gray-400">No delivery challans found. Create your first DC to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}