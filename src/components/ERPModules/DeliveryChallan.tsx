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
  Clock
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { DeliveryChallan, Cage } from '../../types/erp';

export default function DeliveryChallanPanel() {
  const [deliveryChallans, setDeliveryChallans] = useState<DeliveryChallan[]>([]);
  const [currentDC, setCurrentDC] = useState<Partial<DeliveryChallan>>({
    dcNumber: '',
    date: new Date(),
    cages: [],
    totalBirds: 0,
    totalWeight: 0,
    manualWeighing: false,
    confirmed: false
  });
  const [bulkText, setBulkText] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');

  useEffect(() => {
    loadDeliveryChallans();
    
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

  const loadDeliveryChallans = async () => {
    const dcs = await dataService.getDeliveryChallans();
    setDeliveryChallans(dcs);
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

  const handleBulkPaste = () => {
    const parsed = dataService.parseBulkData(bulkText);
    const newCages: Cage[] = parsed.cages.map((cage, index) => ({
      id: Date.now().toString() + index,
      cageNo: cage.cageNo,
      birdCount: cage.birdCount,
      weight: cage.weight,
      sellingRate: 0,
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

  const saveDC = async () => {
    if (!currentDC.dcNumber || !currentDC.cages || currentDC.cages.length === 0) {
      alert('Please fill DC number and add at least one cage');
      return;
    }

    try {
      if (currentDC.id) {
        await dataService.updateDeliveryChallan(currentDC.id, currentDC as DeliveryChallan);
      } else {
        const newDC = await dataService.createDeliveryChallan(currentDC as Omit<DeliveryChallan, 'id' | 'createdAt' | 'updatedAt'>);
        setCurrentDC(newDC);
      }
      
      await loadDeliveryChallans();
      alert('Delivery Challan saved successfully!');
    } catch (error) {
      alert('Error saving DC: ' + error);
    }
  };

  const confirmDC = async () => {
    if (!currentDC.id) {
      await saveDC();
    }
    
    await dataService.updateDeliveryChallan(currentDC.id!, { confirmed: true });
    setCurrentDC({ ...currentDC, confirmed: true });
    await loadDeliveryChallans();
  };

  const newDC = () => {
    setCurrentDC({
      dcNumber: `DC${Date.now()}`,
      date: new Date(),
      cages: [],
      totalBirds: 0,
      totalWeight: 0,
      manualWeighing: false,
      confirmed: false
    });
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
            <h1 className="text-2xl font-bold text-white">Delivery Challan</h1>
            <p className="text-gray-400">Manage cage entries and weights</p>
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

      {/* DC Form */}
      <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">DC Number</label>
            <input
              type="text"
              value={currentDC.dcNumber || ''}
              onChange={(e) => setCurrentDC({ ...currentDC, dcNumber: e.target.value })}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]"
              placeholder="Enter DC number"
            />
          </div>
          
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              value={currentDC.date ? currentDC.date.toISOString().split('T')[0] : ''}
              onChange={(e) => setCurrentDC({ ...currentDC, date: new Date(e.target.value) })}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white focus:border-purple-500 focus:outline-none shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={currentDC.manualWeighing || false}
                onChange={(e) => setCurrentDC({ ...currentDC, manualWeighing: e.target.checked })}
                className="w-4 h-4 text-purple-500 bg-[#1a1a1a] border-gray-600 rounded focus:ring-purple-500"
              />
              Manual Weighing
            </label>
          </div>
        </div>

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              <span className="font-medium">Cages</span>
            </div>
            <p className="text-2xl font-bold">{currentDC.cages?.length || 0}</p>
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
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Selling Rate</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
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
                        <input
                          type="number"
                          step="0.01"
                          value={cage.sellingRate}
                          onChange={(e) => updateCage(cage.id, 'sellingRate', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 bg-[#0f0f0f] border border-gray-600 rounded text-white text-sm focus:border-purple-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          cage.isBilled 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {cage.isBilled ? 'Billed' : 'Available'}
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
            onClick={saveDC}
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

      {/* DC History */}
      <div className="bg-[#2a2a2a] rounded-2xl shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">Recent Delivery Challans</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">DC Number</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Cages</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Total Birds</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Total Weight</th>
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
                    <p className="text-white font-medium">{dc.dcNumber}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-300">{dc.date.toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white">{dc.cages.length}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white">{dc.totalBirds}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white">{dc.totalWeight.toFixed(2)} kg</p>
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
        </div>
      </div>
    </div>
  );
}