import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  Edit, 
  Save, 
  X,
  IndianRupee,
  Calendar,
  User,
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { LedgerEntry } from '../../types/erp';

export default function Ledger() {
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ paid?: number; description?: string }>({});

  useEffect(() => {
    loadLedgerData();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [ledgerEntries, searchTerm, filterType]);

  const loadLedgerData = async () => {
    try {
      const entries = await dataService.getLedgerEntries();
      setLedgerEntries(entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Error loading ledger:', error);
    }
  };

  const filterEntries = () => {
    let filtered = ledgerEntries;

    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(entry => entry.type === filterType);
    }

    setFilteredEntries(filtered);
  };

  const startEdit = (entry: LedgerEntry) => {
    setEditingId(entry.id);
    setEditData({
      paid: 0, // Start with 0 for additional payment
      description: entry.description
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;

    try {
      const entry = ledgerEntries.find(e => e.id === editingId);
      if (!entry) return;

      const additionalPayment = editData.paid || 0;
      const newBalance = entry.balance - additionalPayment;

      await dataService.updateLedgerEntry(editingId, {
        balance: Math.max(0, newBalance),
        description: editData.description || entry.description
      });

      // If payment made, create a new payment entry
      if (additionalPayment > 0) {
        await dataService.createLedgerEntry({
          customerId: entry.customerId,
          customerName: entry.customerName,
          type: 'payment',
          amount: -additionalPayment, // Negative for payment
          balance: Math.max(0, newBalance),
          description: `Payment received - ${editData.description || 'Manual payment'}`,
          referenceId: entry.referenceId,
          date: new Date()
        });
      }

      setEditingId(null);
      setEditData({});
      await loadLedgerData();
      alert('Ledger updated successfully!');
    } catch (error) {
      console.error('Error updating ledger:', error);
      alert('Error updating ledger: ' + error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'invoice': return <FileText className="w-4 h-4 text-blue-400" />;
      case 'payment': return <IndianRupee className="w-4 h-4 text-green-400" />;
      default: return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'invoice': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'payment': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const totalBalance = filteredEntries.reduce((sum, entry) => sum + entry.balance, 0);
  const totalPurchases = filteredEntries.filter(e => e.type === 'purchase').reduce((sum, e) => sum + e.amount, 0);
  const totalSales = filteredEntries.filter(e => e.type === 'invoice').reduce((sum, e) => sum + e.amount, 0);
  const totalPayments = filteredEntries.filter(e => e.type === 'payment').reduce((sum, e) => sum + Math.abs(e.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Customer Ledger</h1>
            <p className="text-gray-400">Track customer payments and balances</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by customer name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white focus:border-purple-500 focus:outline-none shadow-[inset_2px_2px_4px_#0f0f0f,inset_-2px_-2px_4px_#2a2a2a]"
          >
            <option value="all">All Types</option>
            <option value="purchase">Purchases</option>
            <option value="invoice">Sales</option>
            <option value="payment">Payments</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-red-400" />
            <h3 className="text-gray-400 text-sm font-medium">Total Purchases</h3>
          </div>
          <p className="text-2xl font-bold text-red-400">₹{totalPurchases.toLocaleString()}</p>
        </div>
        <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h3 className="text-gray-400 text-sm font-medium">Total Sales</h3>
          </div>
          <p className="text-2xl font-bold text-blue-400">₹{totalSales.toLocaleString()}</p>
        </div>
        <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
          <div className="flex items-center gap-3 mb-2">
            <IndianRupee className="w-5 h-5 text-green-400" />
            <h3 className="text-gray-400 text-sm font-medium">Total Payments</h3>
          </div>
          <p className="text-2xl font-bold text-green-400">₹{totalPayments.toLocaleString()}</p>
        </div>
        <div className="bg-[#2a2a2a] rounded-2xl p-6 shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a]">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h3 className="text-gray-400 text-sm font-medium">Outstanding Balance</h3>
          </div>
          <p className="text-2xl font-bold text-purple-400">₹{totalBalance.toLocaleString()}</p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-[#2a2a2a] rounded-2xl shadow-[8px_8px_16px_#0f0f0f,-8px_-8px_16px_#3a3a3a] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">Ledger Entries</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Customer/Vendor</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Type</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Description</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Balance</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredEntries.map((entry, index) => (
                <motion.tr
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="hover:bg-[#1a1a1a] transition-colors duration-200"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-white">{new Date(entry.date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{entry.customerName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(entry.type)}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(entry.type)}`}>
                        {entry.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === entry.id ? (
                      <input
                        type="text"
                        value={editData.description || ''}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      />
                    ) : (
                      <p className="text-gray-300 text-sm">{entry.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${entry.amount >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                      ₹{Math.abs(entry.amount).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${entry.balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      ₹{entry.balance.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === entry.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Payment amount"
                          value={editData.paid || ''}
                          onChange={(e) => setEditData({ ...editData, paid: parseFloat(e.target.value) || 0 })}
                          className="w-24 px-2 py-1 bg-[#1a1a1a] border border-gray-600 rounded text-white text-sm focus:border-purple-500 focus:outline-none"
                        />
                        <button
                          onClick={saveEdit}
                          className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors duration-200"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors duration-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(entry)}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors duration-200"
                        disabled={entry.balance <= 0}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredEntries.length === 0 && (
            <div className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No ledger entries found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}