import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Truck, Plus, Search, Edit, Trash2, Save, Calendar, User, Package, DollarSign, CheckCircle
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
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedVendors, setSavedVendors] = useState<Vendor[]>([]);

  const predefinedVendors: Vendor[] = [
    { name: 'Sagar Poultry Farm', code: 'sgr' },
    { name: 'Suguna', code: 'sgn' },
    { name: 'Krishna Chicken Center', code: 'kcc' }
  ];

  useEffect(() => {
    loadData();
    const saved = localStorage.getItem('saved_vendors');
    if (saved) setSavedVendors(JSON.parse(saved));
  }, []);

  const loadData = async () => {
    const list = await dataService.getDeliveryChallans();
    // only show last 30
    setDeliveryChallans(list.slice(-30).reverse());
  };

  const allVendors = [
    ...savedVendors.map(v => ({ ...v, saved: true })),
    ...predefinedVendors.filter(pv => !savedVendors.some(sv => sv.name === pv.name))
  ];

  const filteredVendors = allVendors.filter(v =>
    v.name.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  const saveVendor = (vendor: Vendor) => {
    if (!savedVendors.find(v => v.name === vendor.name)) {
      const updated = [...savedVendors, { ...vendor, saved: true }];
      setSavedVendors(updated);
      localStorage.setItem('saved_vendors', JSON.stringify(updated));
    }
  };

  const selectVendor = (v: Vendor) => {
    setSelectedVendor(v);
    setVendorSearch(v.name);
    saveVendor(v);
  };

  const generateDCNumber = () => {
    if (!selectedVendor || !selectedDate) return '';
    const date = new Date(selectedDate);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = String(date.getFullYear()).slice(-2);
    const prefix = `${day}-${month}-${year}${selectedVendor.code}`;
    const sameDay = deliveryChallans.filter(dc => {
      const d = new Date(dc.date);
      return dc.vendorName === selectedVendor.name &&
        d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear();
    });
    const seq = sameDay.length > 0 ? String.fromCharCode(97 + sameDay.length) : '';
    return prefix + seq;
  };

  const addRow = () => {
    setCages([...cages, { cageNo: cages.length + 1, birdCount: 0, weight: 0, sellingRate: 0, isBilled: false }]);
  };

  const updateCell = (i: number, field: keyof Omit<Cage, 'id' | 'dcId'>, val: number) => {
    const updated = cages.map((c, idx) => idx === i ? { ...c, [field]: val } : c);
    setCages(updated);
  };

  const removeRow = (i: number) => {
    setCages(cages.filter((_, idx) => idx !== i));
  };

  const calcTotals = () => ({
    birds: cages.reduce((a, c) => a + c.birdCount, 0),
    weight: cages.reduce((a, c) => a + c.weight, 0)
  });

  const resetForm = () => {
    setSelectedVendor(null);
    setVendorSearch('');
    setPurchaseRate(0);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setCages([]);
    setIsEditing(false);
    setEditingId(null);
  };

  const saveDC = async () => {
    if (!selectedVendor) return alert('Vendor required');
    if (purchaseRate <= 0) return alert('Rate required');
    if (!selectedDate) return alert('Date required');
    if (cages.length === 0) return alert('Add at least one row');
    if (cages.some(c => c.birdCount <= 0 || c.weight <= 0)) return alert('All rows need valid values');

    const dcNumber = generateDCNumber();
    const { birds, weight } = calcTotals();

    const dcData: DeliveryChallan = {
      id: editingId || `dc_${Date.now()}`,
      dcNumber,
      date: new Date(selectedDate),
      vendorName: selectedVendor.name,
      purchaseRate,
      cages: cages.map(c => ({ ...c, id: `c_${Math.random()}`, dcId: '' })),
      totalBirds: birds,
      totalWeight: weight,
      manualWeighing: false,
      confirmed: false
    };

    if (isEditing && editingId) {
      await dataService.updateDeliveryChallan(editingId, dcData);
    } else {
      await dataService.createDeliveryChallan(dcData);
    }

    // ledger entry
    if (dataService.addLedgerEntry) {
      await dataService.addLedgerEntry({
        date: selectedDate,
        vendorName: selectedVendor.name,
        rate: purchaseRate,
        totalBirds: birds,
        totalWeight: weight,
        dcNumber
      });
    }

    await loadData();
    resetForm();
    setShowForm(false);
    alert('✅ Saved successfully!');
  };

  const editDC = (dc: DeliveryChallan) => {
    setSelectedDate(new Date(dc.date).toISOString().split('T')[0]);
    setSelectedVendor({ name: dc.vendorName, code: dc.dcNumber.replace(/^\d{1,2}-\d{1,2}-\d{2}/, '') });
    setVendorSearch(dc.vendorName);
    setPurchaseRate(dc.purchaseRate);
    setCages(dc.cages.map(c => ({
      cageNo: c.cageNo,
      birdCount: c.birdCount,
      weight: c.weight,
      sellingRate: c.sellingRate,
      isBilled: c.isBilled
    })));
    setIsEditing(true);
    setEditingId(dc.id);
    setShowForm(true);
  };

  const deleteDC = async (id: string) => {
    if (confirm('Delete this DC?')) {
      await dataService.deleteDeliveryChallan(id);
      await loadData();
    }
  };

  const confirmDC = async (id: string) => {
    await dataService.updateDeliveryChallan(id, { confirmed: true });
    await loadData();
  };

  const { birds, weight } = calcTotals();

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
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-xl text-white font-medium shadow-[0_0_20px_rgba(255,0,128,0.3)]"
        >
          <Plus className="w-5 h-5" /> New DC
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#2a2a2a] rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Vendor & Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-white text-sm">Date</label>
                <input type="date" value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full p-2 rounded bg-[#0f0f0f] text-white" />
              </div>
              <div>
                <label className="text-white text-sm">Vendor</label>
                <input type="text" value={vendorSearch}
                  onChange={e => setVendorSearch(e.target.value)}
                  placeholder="Search vendor"
                  className="w-full p-2 rounded bg-[#0f0f0f] text-white" />
                <div className="max-h-24 overflow-y-auto">
                  {filteredVendors.map(v => (
                    <button key={v.name} onClick={() => selectVendor(v)}
                      className={`block w-full text-left p-1 rounded ${selectedVendor?.name === v.name ? 'bg-purple-500/30' : 'hover:bg-[#3a3a3a]'}`}>
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-white text-sm">Purchase Rate</label>
                <input type="number" value={purchaseRate}
                  onChange={e => setPurchaseRate(parseFloat(e.target.value))}
                  className="w-full p-2 rounded bg-[#0f0f0f] text-white" />
              </div>
            </div>

            <div className="text-green-400 font-mono mb-4">{generateDCNumber()}</div>

            {/* Excel-like Cage Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="bg-[#1a1a1a]">
                    <th className="p-2">Cage No</th>
                    <th className="p-2">Bird Count</th>
                    <th className="p-2">Weight</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {cages.map((c, i) => (
                    <tr key={i} className="bg-[#0f0f0f]">
                      <td className="p-2">{c.cageNo}</td>
                      <td className="p-2">
                        <input type="number" value={c.birdCount}
                          onChange={e => updateCell(i, 'birdCount', parseInt(e.target.value) || 0)}
                          className="w-full p-1 rounded bg-[#2a2a2a] text-white" />
                      </td>
                      <td className="p-2">
                        <input type="number" value={c.weight}
                          onChange={e => updateCell(i, 'weight', parseFloat(e.target.value) || 0)}
                          className="w-full p-1 rounded bg-[#2a2a2a] text-white" />
                      </td>
                      <td className="p-2">
                        <button onClick={() => removeRow(i)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={addRow}
                className="mt-3 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30">
                + Add Row
              </button>
            </div>

            {/* Totals */}
            <div className="mt-4 text-white">
              Total Birds: {birds} | Total Weight: {weight.toFixed(1)} kg
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-3">
              <button onClick={saveDC}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white">
                <Save className="w-5 h-5" /> {isEditing ? 'Update DC' : 'Save DC'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-gray-600 rounded-xl text-white">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* DC list (last 30) */}
      <div className="bg-[#2a2a2a] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-700 text-white font-semibold">Last 30 Delivery Challans</div>
        <table className="w-full text-white">
          <thead className="bg-[#1a1a1a]">
            <tr>
              <th className="p-2">DC Number</th>
              <th className="p-2">Date</th>
              <th className="p-2">Vendor</th>
              <th className="p-2">Birds</th>
              <th className="p-2">Weight</th>
              <th className="p-2">Rate</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliveryChallans.map((dc, idx) => (
              <motion.tr key={dc.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}>
                <td className="p-2">{dc.dcNumber}</td>
                <td className="p-2">{new Date(dc.date).toLocaleDateString()}</td>
                <td className="p-2">{dc.vendorName}</td>
                <td className="p-2">{dc.totalBirds}</td>
                <td className="p-2">{dc.totalWeight.toFixed(1)}</td>
                <td className="p-2">₹{dc.purchaseRate}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => editDC(dc)} className="text-blue-400"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => deleteDC(dc.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                  {!dc.confirmed && (
                    <button onClick={() => confirmDC(dc.id)} className="text-green-400"><CheckCircle className="w-4 h-4" /></button>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
