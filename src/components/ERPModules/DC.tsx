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
  DollarSign,
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
  const [bulkData, setBulkData] = useState('');
  const [previousDue, setPreviousDue] = useState<number>(0); // <-- NEW

  const predefinedVendors: Vendor[] = [
    { name: 'Sagar Poultry Farm', code: 'sgr' },
    { name: 'Krishna Chicken Center', code: 'kcc' },
    { name: 'Balaji Poultry', code: 'blj' },
    { name: 'Shree Ganesh Farm', code: 'sgf' },
    { name: 'Radha Krishna Poultry', code: 'rkp' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const dcList = await dataService.getDeliveryChallans();
    setDeliveryChallans(dcList);
  };

  const filteredVendors = predefinedVendors.filter(vendor =>
    vendor.name.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  const selectVendor = async (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setVendorSearch(vendor.name);

    // fetch previous due from ledger
    const ledger = await dataService.getLedgerEntries();
    const vendorRows = ledger.filter((e: any) => e.type === 'DC' && e.name === vendor.name);
    if (vendorRows.length > 0) {
      const lastRow = vendorRows[vendorRows.length - 1];
      setPreviousDue(lastRow.due || 0);
    } else {
      setPreviousDue(0);
    }
  };

  const addCage = () => {
    setCages([
      ...cages,
      {
        cageNo: cages.length + 1,
        birdCount: 0,
        weight: 0,
        sellingRate: 0,
        isBilled: false
      }
    ]);
  };

  const updateCage = (index: number, field: keyof Omit<Cage, 'id' | 'dcId'>, value: number) => {
    const updated = cages.map((c, i) => (i === index ? { ...c, [field]: value } : c));
    setCages(updated);
  };

  const parseBulkData = () => {
    if (!bulkData.trim()) return;
    const lines = bulkData.trim().split('\n');
    const parsed: Omit<Cage, 'id' | 'dcId'>[] = [];
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        parsed.push({
          cageNo: parseInt(parts[0]),
          birdCount: parseInt(parts[1]),
          weight: parseFloat(parts[2]),
          sellingRate: parts[3] ? parseFloat(parts[3]) : 0,
          isBilled: false
        });
      }
    });
    setCages(parsed);
    setBulkData('');
  };

  const calculateTotals = () => {
    const birds = cages.reduce((a, c) => a + c.birdCount, 0);
    const weight = cages.reduce((a, c) => a + c.weight, 0);
    return { birds, weight };
  };

  const saveDC = async () => {
    if (!selectedVendor || cages.length === 0 || purchaseRate <= 0) {
      alert('Fill vendor, cages, and rate');
      return;
    }
    const { birds, weight } = calculateTotals();
    const amount = weight * purchaseRate;

    // ask how much paid to vendor
    const paidStr = prompt(
      `Previous due for ${selectedVendor.name}: ₹${previousDue}\nCurrent DC Amount: ₹${amount}\nHow much did you pay to vendor now?`,
      '0'
    );
    const paid = parseFloat(paidStr || '0');
    const newDue = previousDue + amount - paid;

    const dcNumber = `${selectedDate.replace(/-/g, '')}_${selectedVendor.name
      .split(' ')[0]
      .toLowerCase()}`;

    const dcData = {
      dcNumber,
      date: new Date(selectedDate),
      vendorName: selectedVendor.name,
      purchaseRate,
      cages: cages.map(c => ({
        ...c,
        id: `cage_${Date.now()}_${Math.random()}`,
        dcId: ''
      })),
      totalBirds: birds,
      totalWeight: weight,
      manualWeighing,
      confirmed: false
    };

    await dataService.createDeliveryChallan(dcData);

    // also update ledger
    await dataService.addLedgerEntry({
      id: `led_${Date.now()}`,
      date: selectedDate,
      type: 'DC',
      name: selectedVendor.name,
      rate: purchaseRate,
      amount,
      paid,
      due: newDue,
      paidMode: 'Cash'
    });

    alert(`DC Saved! New due for ${selectedVendor.name}: ₹${newDue}`);
    loadData();
    setShowForm(false);
  };

  const { birds, weight } = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Truck /> Delivery Challan
        </h1>
        <button
          onClick={() => {
            setCages([]);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-white font-medium"
        >
          <Plus className="inline-block mr-1" /> New DC
        </button>
      </div>

      {showForm && (
        <div className="bg-[#2a2a2a] p-4 rounded-xl space-y-4">
          <div>
            <label className="text-white block mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="p-2 rounded bg-black text-white"
            />
          </div>

          <div>
            <label className="text-white block mb-1">Vendor</label>
            <input
              type="text"
              value={vendorSearch}
              onChange={e => setVendorSearch(e.target.value)}
              className="p-2 rounded bg-black text-white mb-2"
              placeholder="Search vendor…"
            />
            <div className="space-y-1">
              {filteredVendors.map(v => (
                <div
                  key={v.name}
                  onClick={() => selectVendor(v)}
                  className={`p-2 rounded cursor-pointer ${
                    selectedVendor?.name === v.name
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#1a1a1a] text-gray-300'
                  }`}
                >
                  {v.name}
                </div>
              ))}
            </div>
            {selectedVendor && (
              <div className="text-green-400 mt-2">
                Selected: {selectedVendor.name} | Previous Due: ₹{previousDue}
              </div>
            )}
          </div>

          <div>
            <label className="text-white block mb-1">Purchase Rate (₹/kg)</label>
            <input
              type="number"
              value={purchaseRate}
              onChange={e => setPurchaseRate(parseFloat(e.target.value))}
              className="p-2 rounded bg-black text-white"
            />
          </div>

          {/* Bulk Paste */}
          <div>
            <label className="text-white block mb-1">Paste bulk cages</label>
            <textarea
              value={bulkData}
              onChange={e => setBulkData(e.target.value)}
              placeholder="CageNo BirdCount Weight [Rate]"
              className="w-full p-2 rounded bg-black text-white"
            ></textarea>
            <button
              onClick={parseBulkData}
              className="mt-2 px-3 py-1 bg-blue-600 rounded text-white"
            >
              Import
            </button>
          </div>

          {/* Cages Table */}
          <div className="space-y-2">
            {cages.map((cage, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 items-center">
                <input
                  type="number"
                  value={cage.cageNo}
                  onChange={e => updateCage(i, 'cageNo', parseInt(e.target.value))}
                  className="p-2 rounded bg-black text-white"
                />
                <input
                  type="number"
                  value={cage.birdCount}
                  onChange={e => updateCage(i, 'birdCount', parseInt(e.target.value))}
                  className="p-2 rounded bg-black text-white"
                />
                <input
                  type="number"
                  value={cage.weight}
                  onChange={e => updateCage(i, 'weight', parseFloat(e.target.value))}
                  className="p-2 rounded bg-black text-white"
                />
                <button
                  onClick={() => {
                    setCages(cages.filter((_, idx) => idx !== i));
                  }}
                  className="px-3 py-1 bg-red-600 rounded text-white"
                >
                  <Trash2 className="inline-block" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addCage}
            className="mt-2 px-3 py-1 bg-green-600 rounded text-white"
          >
            + Add Row
          </button>

          <div className="text-white mt-4">
            Total Birds: {birds} | Total Weight: {weight.toFixed(1)} kg
          </div>

          <button
            onClick={saveDC}
            className="mt-4 px-4 py-2 bg-purple-600 rounded text-white"
          >
            <Save className="inline-block mr-1" /> Save DC
          </button>
        </div>
      )}

      {/* List */}
      <div className="mt-6">
        <table className="w-full text-white">
          <thead>
            <tr className="bg-[#1a1a1a]">
              <th className="p-2">DC Number</th>
              <th className="p-2">Date</th>
              <th className="p-2">Vendor</th>
              <th className="p-2">Birds</th>
              <th className="p-2">Weight</th>
              <th className="p-2">Rate</th>
            </tr>
          </thead>
          <tbody>
            {deliveryChallans.map((dc, idx) => (
              <motion.tr
                key={dc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <td className="p-2">{dc.dcNumber}</td>
                <td className="p-2">{new Date(dc.date).toLocaleDateString()}</td>
                <td className="p-2">{dc.vendorName}</td>
                <td className="p-2">{dc.totalBirds}</td>
                <td className="p-2">{dc.totalWeight.toFixed(1)} kg</td>
                <td className="p-2">₹{dc.purchaseRate}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
